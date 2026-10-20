import express from "express";
import { classificationsData } from "./data.js";
import { pool } from "./db.js";


const app = express();
const PORT = 3000;

app.use(express.json());

function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return false;
  }

  const [year, month, day] = date.split("-").map(Number);

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() + 1 === month &&
    parsedDate.getUTCDate() === day
  );
}

app.get("/", (req, res) => {
    res.send("Internet Bank Transaction API");
});

// Get one transaction by ID
app.get("/transactions/:id", async (req, res) => {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({
            error: "Transaction ID must be a number"
        });
    }

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
    const { start, end } = req.query;

    try {
        let result;

        if (start || end) {
            const startDate = new Date(start as string);
            const endDate = new Date(end as string);

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return res.status(400).json({
                    message: "Invalid date format"
                });
            }

            if (startDate > endDate) {
                return res.status(400).json({
                    message: "Start date must be before end date!"
                });
            }

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
    const { date, recipient, amount } = req.body;

    if (
        typeof date !== "string" ||
        typeof recipient !== "string" ||
        typeof amount !== "number" ||
        !isValidDate(date)
    ) {
        return res.status(400).json({
            message: "Date, recipient and amount are required",
        });
    }

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
    const transactionId = Number(req.params.id);

    if (Number.isNaN(transactionId)) {
        return res.status(400).json({
            message: "Transaction ID must be a number"
        });
    }

    if (
        req.body.date !== undefined &&
        (typeof req.body.date !== "string" || !isValidDate(req.body.date))
    ) {
        return res.status(400).json({
            message: "Date must be a valid date"
        });
    }

    if (
        req.body.recipient !== undefined &&
        (typeof req.body.recipient !== "string" ||
            req.body.recipient.trim() === "")
    ) {
        return res.status(400).json({
            message: "Recipient must be a non-empty string"
        });
    }

    if (
        req.body.amount !== undefined &&
        (typeof req.body.amount !== "number" ||
            !Number.isFinite(req.body.amount))
    ) {
        return res.status(400).json({
            message: "Amount must be a finite number"
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
            RETURNING
                id,
                TO_CHAR(date, 'YYYY-MM-DD') AS date,
                recipient,
                amount::float AS amount`,
            [
                req.body.date ?? null,
                req.body.recipient ?? null,
                req.body.amount ?? null,
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
    const transactionId = Number(req.params.id);

    if (Number.isNaN(transactionId)) {
        return res.status(400).json({
            message: "Transaction ID must be a number"
        });
    }

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
