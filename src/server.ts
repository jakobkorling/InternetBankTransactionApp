import express from "express";
import { classificationsData } from "./data.js";
import { pool } from "./db.js";
import {
    idParamSchema,
    createTransactionSchema,
    updateTransactionSchema,
    dateFilterQuerySchema,
    formatZodError,
} from "./schemas.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Internet Bank Transaction API");
});

// Get one transaction by ID
app.get("/transactions/:id", async (req, res) => {
    const parsedId = idParamSchema.safeParse(req.params);

    if (!parsedId.success) {
        return res.status(400).json({
            error: formatZodError(parsedId.error)
        });
    }

    const id = parsedId.data.id;

    try {
        const result = await pool.query(
            `SELECT
                id,
                TO_CHAR(date, 'YYYY-MM-DD') AS date,
                recipient,
                amount::float AS amount
            FROM transactions
            WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "Transaction not found"
            });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Database error"
        });
    }
});

// Get all transactions
app.get("/transactions", async (req, res) => {
    const parsedQuery = dateFilterQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
        return res.status(400).json({
            message: formatZodError(parsedQuery.error)
        });
    }

    const { start, end } = parsedQuery.data;

    try {
        let result;

        if (start && end) {
            result = await pool.query(
                `SELECT
                    id,
                    TO_CHAR(date, 'YYYY-MM-DD') AS date,
                    recipient,
                    amount::float AS amount
                FROM transactions
                WHERE date >= $1 AND date <= $2
                ORDER BY id`,
                [start, end]
            );
        } else {
            result = await pool.query(
                `SELECT
                    id,
                    TO_CHAR(date, 'YYYY-MM-DD') AS date,
                    recipient,
                    amount::float AS amount
                FROM transactions
                ORDER BY id`
            );
        }

        return res.status(200).json(result.rows);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Database error"
        });
    }
});

// Create transaction
app.post("/transactions", async (req, res) => {
    const parsedBody = createTransactionSchema.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            message: formatZodError(parsedBody.error)
        });
    }

    const { date, recipient, amount } = parsedBody.data;

    try {
        const result = await pool.query(
            `INSERT INTO transactions (date, recipient, amount)
            VALUES ($1, $2, $3)
            RETURNING
                id,
                TO_CHAR(date, 'YYYY-MM-DD') AS date,
                recipient,
                amount::float AS amount`,
            [date, recipient, amount]
        );

        return res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Database error"
        });
    }
});

// Update transaction by ID
app.put("/transactions/:id", async (req, res) => {
    const parsedId = idParamSchema.safeParse(req.params);

    if (!parsedId.success) {
        return res.status(400).json({
            message: formatZodError(parsedId.error)
        });
    }

    const parsedBody = updateTransactionSchema.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            message: formatZodError(parsedBody.error)
        });
    }

    const transactionId = parsedId.data.id;
    const body = parsedBody.data;

    try {
        const result = await pool.query(
            `UPDATE transactions
            SET
                date = COALESCE($1, date),
                recipient = COALESCE($2, recipient),
                amount = COALESCE($3, amount)
            WHERE id = $4
            RETURNING
                id,
                TO_CHAR(date, 'YYYY-MM-DD') AS date,
                recipient,
                amount::float AS amount`,
            [
                body.date ?? null,
                body.recipient ?? null,
                body.amount ?? null,
                transactionId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        return res.status(200).json({
            message: "Transaction updated successfully",
            transaction: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Database error"
        });
    }
});

// Delete transaction by ID
app.delete("/transactions/:id", async (req, res) => {
    const parsedId = idParamSchema.safeParse(req.params);

    if (!parsedId.success) {
        return res.status(400).json({
            message: formatZodError(parsedId.error)
        });
    }

    const transactionId = parsedId.data.id;

    try {
        const result = await pool.query(
            `DELETE FROM transactions
            WHERE id = $1
            RETURNING id`,
            [transactionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Transaction not found"
            });
        }

        return res.status(200).json({
            message: "Transaction deleted successfully"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Database error"
        });
    }
});

app.get("/classifications", (req, res) => {
    res.status(200).json(classificationsData);
});

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});