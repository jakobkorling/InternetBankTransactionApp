
import express from "express";
import { pool } from "./db.js";
import {
    idParamSchema,
    createTransactionSchema,
    updateTransactionSchema,
    dateFilterQuerySchema,
    classificationSchema,
    formatZodError,
} from "./schemas.js";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get("/", (_req, res) => {
    res.send("Internet Bank Transaction API");
});

// Get all transactions, optionally filtered by date
app.get("/transactions", async (req, res) => {
    const parsedQuery = dateFilterQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
        return res.status(400).json({
            message: formatZodError(parsedQuery.error),
        });
    }

    const { start, end } = parsedQuery.data;

    try {
        const query = `
            SELECT
                t.id,
                TO_CHAR(t.date, 'YYYY-MM-DD') AS date,
                t.recipient,
                t.amount::float AS amount,
                CASE
                    WHEN t.amount < 0
                    THEN COALESCE(c.classification, 'Unknown')
                    ELSE NULL
                END AS classification
            FROM transactions AS t
            LEFT JOIN classifications AS c
                ON LOWER(TRIM(t.recipient)) =
                   LOWER(TRIM(c.recipient))
            ${start && end ? "WHERE t.date >= $1 AND t.date <= $2" : ""}
            ORDER BY t.id
        `;

        const result = start && end
            ? await pool.query(query, [start, end])
            : await pool.query(query);

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Database error",
        });
    }
});

// Get one transaction by ID
app.get("/transactions/:id", async (req, res) => {
    const parsedId = idParamSchema.safeParse(req.params);

    if (!parsedId.success) {
        return res.status(400).json({
            message: formatZodError(parsedId.error),
        });
    }

    try {
        const result = await pool.query(
            `SELECT
                t.id,
                TO_CHAR(t.date, 'YYYY-MM-DD') AS date,
                t.recipient,
                t.amount::float AS amount,
                CASE
                    WHEN t.amount < 0
                    THEN COALESCE(c.classification, 'Unknown')
                    ELSE NULL
                END AS classification
            FROM transactions AS t
            LEFT JOIN classifications AS c
                ON LOWER(TRIM(t.recipient)) =
                   LOWER(TRIM(c.recipient))
            WHERE t.id = $1`,
            [parsedId.data.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Transaction not found",
            });
        }

        return res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Database error",
        });
    }
});

// Create a transaction
app.post("/transactions", async (req, res) => {
    const parsedBody = createTransactionSchema.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            message: formatZodError(parsedBody.error),
        });
    }

    const { date, recipient, amount } = parsedBody.data;

    try {
        const result = await pool.query(
            `INSERT INTO transactions (date, recipient, amount)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [date, recipient.trim(), amount]
        );

        const transactionId = result.rows[0].id;

        const transaction = await pool.query(
            `SELECT
                t.id,
                TO_CHAR(t.date, 'YYYY-MM-DD') AS date,
                t.recipient,
                t.amount::float AS amount,
                CASE
                    WHEN t.amount < 0
                    THEN COALESCE(c.classification, 'Unknown')
                    ELSE NULL
                END AS classification
             FROM transactions AS t
             LEFT JOIN classifications AS c
                ON LOWER(TRIM(t.recipient)) =
                   LOWER(TRIM(c.recipient))
             WHERE t.id = $1`,
            [transactionId]
        );

        return res.status(201).json(transaction.rows[0]);
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Database error",
        });
    }
});

// Update a transaction
app.put("/transactions/:id", async (req, res) => {
    const parsedId = idParamSchema.safeParse(req.params);

    if (!parsedId.success) {
        return res.status(400).json({
            message: formatZodError(parsedId.error),
        });
    }

    const parsedBody = updateTransactionSchema.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(400).json({
            message: formatZodError(parsedBody.error),
        });
    }

    const body = parsedBody.data;

    if (Object.keys(body).length === 0) {
        return res.status(400).json({
            message: "Provide at least one field to update",
        });
    }

    try {
        const result = await pool.query(
            `UPDATE transactions
             SET
                date = COALESCE($1, date),
                recipient = COALESCE($2, recipient),
                amount = COALESCE($3, amount)
             WHERE id = $4
             RETURNING id`,
            [
                body.date ?? null,
                body.recipient?.trim() ?? null,
                body.amount ?? null,
                parsedId.data.id,
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Transaction not found",
            });
        }

        const transaction = await pool.query(
            `SELECT
                t.id,
                TO_CHAR(t.date, 'YYYY-MM-DD') AS date,
                t.recipient,
                t.amount::float AS amount,
                CASE
                    WHEN t.amount < 0
                    THEN COALESCE(c.classification, 'Unknown')
                    ELSE NULL
                END AS classification
             FROM transactions AS t
             LEFT JOIN classifications AS c
                ON LOWER(TRIM(t.recipient)) =
                   LOWER(TRIM(c.recipient))
             WHERE t.id = $1`,
            [parsedId.data.id]
        );

        return res.status(200).json({
            message: "Transaction updated successfully",
            transaction: transaction.rows[0],
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Database error",
        });
    }
});

// Delete a transaction
app.delete("/transactions/:id", async (req, res) => {
    const parsedId = idParamSchema.safeParse(req.params);

    if (!parsedId.success) {
        return res.status(400).json({
            message: formatZodError(parsedId.error),
        });
    }

    try {
        const result = await pool.query(
            `DELETE FROM transactions
             WHERE id = $1
             RETURNING id`,
            [parsedId.data.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Transaction not found",
            });
        }

        return res.status(200).json({
            message: "Transaction deleted successfully",
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            message: "Database error",
        });
    }
});

// Get available classifications
app.get("/classifications", (_req, res) => {
    return res.status(200).json(classificationSchema.options);
});

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
