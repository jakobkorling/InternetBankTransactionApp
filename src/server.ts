import express from "express";
import { transactions, findClassification } from "./data.js";
import type { Transaction } from "./data.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Internet Bank Transaction API");
});


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

    res.status(200).json({ message:"Transaction updated successfully", transaction});
});

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});