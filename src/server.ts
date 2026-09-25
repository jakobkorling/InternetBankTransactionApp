import express from "express";
import { transactions, findClassification } from "./data.js";
import { number } from "@inquirer/prompts";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Internet Bank Transaction API");
});


// Link transcations with classifications

app.get("/transactions", (req, res): void => {
    const result = transactions.map((t) => {
        if (t.amount < 0) {
            return { ...t, classification: findClassification(t.recipient) };
        }
        return t;
    });
    res.status(200).json(result);
});

// Update transcations by id

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

// Filter transcations by date
app.get("/transactions", (req, res): void => {
    const { start, end } = req.query;
    let result = transactions;
    if (start || end) {
        const startDate = new Date(start as string);
        const endDate = new Date(end as string);

        // Handle invalid dates
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            res.status(400).json({ message: "Invalid date format" });
            return;
        }
        // Handle cases where the start date is after the end date
        if (startDate > endDate) {
            res.status(400).json({ message: "Start date must be before end date!"});
            return;
        } 
        // Filter transcations by date
        result = transactions.filter((t) => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
    }
    
    const withClassification = result.map((t) => {
        if (t.amount < 0) {
            return { ...t, classification: findClassification(t.recipient) };
        }
        return t;
    });

    res.status(200).json(withClassification);
});

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});