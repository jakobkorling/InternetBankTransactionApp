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

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});