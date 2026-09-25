import express from "express";
import { transactions, findClassification } from "./data.js";
import type { Transaction } from "./data.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Internet Bank Transaction API");
});

// Get one transaction by ID
app.get("/transactions/:id", (req, res) => {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
        return res.status(400).json({
            error: "Transaction ID must be a number"
        });
    }

    const transaction = transactions.find((transaction) => transaction.id === id);

    if (!transaction) {
        return res.status(404).json({
            error: "Transaction not found"
        });
    }

    return res.status(200).json(transaction);
});

// Get all transactions
app.get("/transactions", (req, res): void => {
    const { start, end } = req.query;
    let result = transactions;

    if (start || end) {
        const startDate = new Date(start as string);
        const endDate = new Date(end as string);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            res.status(400).json({ message: "Invalid date format" });
            return;
        }

        if (startDate > endDate) {
            res.status(400).json({
                message: "Start date must be before end date!"
            });
            return;
        }

        result = transactions.filter((t) => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    }

    const withClassification = result.map((t) => {
        if (t.amount < 0) {
            return {
                ...t,
                classification: findClassification(t.recipient)
            };
        }

        return t;
    });

    res.status(200).json(withClassification);
});

// Create transaction
app.post("/transactions", (req, res) => {
    const { date, recipient, amount } = req.body;

    if (
        typeof date !== "string" ||
        typeof recipient !== "string" ||
        typeof amount !== "number"
    ) {
        return res.status(400).json({
            message: "Date, recipient and amount are required",
        });
    }

    const newId =
        transactions.length > 0
            ? Math.max(...transactions.map((t) => t.id)) + 1
            : 1;

    const newTransaction: Transaction = {
        id: newId,
        date,
        recipient,
        amount,
    };

    if (amount < 0) {
        newTransaction.classification =
            findClassification(recipient) as NonNullable<Transaction["classification"]>;
    }

    transactions.push(newTransaction);

    res.status(201).json(newTransaction);
});

// Update transaction by ID
app.put("/transactions/:id", (req, res): void => {
    const transactionId: number = parseInt(req.params.id);
    const transaction = transactions.find((t) => t.id === transactionId);

    if (!transaction) {
        res.status(404).json({ message: "Transaction not found" });
        return;
    }

    if (req.body.amount !== undefined && typeof req.body.amount !== "number") {
        res.status(400).json({ message: "Amount must be a number" });
        return;
    }

    transaction.date = req.body.date || transaction.date;
    transaction.recipient = req.body.recipient || transaction.recipient;
    transaction.amount = req.body.amount ?? transaction.amount;

    if (transaction.amount < 0) {
        transaction.classification = findClassification(transaction.recipient);
    } else {
        transaction.classification = undefined;
    }

    res.status(200).json({
        message: "Transaction updated successfully",
        transaction
    });
});

// Delete transaction by ID
app.delete("/transactions/:id", (req, res): void => {
    const transactionId = Number(req.params.id);

    if (Number.isNaN(transactionId)) {
        res.status(400).json({
            message: "Transaction ID must be a number"
        });
        return;
    }

    const transactionIndex = transactions.findIndex(
        (transaction) => transaction.id === transactionId
    );

    if (transactionIndex === -1) {
        res.status(404).json({
            message: "Transaction not found"
        });
        return;
    }

    transactions.splice(transactionIndex, 1);

    res.status(200).json({
        message: "Transaction deleted successfully"
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
