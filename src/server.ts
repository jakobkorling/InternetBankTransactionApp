import express from "express";
import { transactions, findClassification } from "./data.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Internet Bank Transaction API");
});


app.get("/transactions", (req, res): void => {
    const result = transactions.map((t) => {
        if (t.amount < 0) {
            return { ...t, classification: findClassification(t.recipient) };
        }
        return t;
    });
    res.status(200).json(result);
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