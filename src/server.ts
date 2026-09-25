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

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});