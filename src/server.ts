import express from "express";
import { transactions } from "./data.js";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Internet Bank Transaction API");
});

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

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
