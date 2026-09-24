import classificationsData from "../data/classifications.json" with { type: "json" };
import transactionsData from "../data/transactions.json" with { type: "json" };

export type Transaction = {
    id: number;
    date: string;
    recipient: string;
    amount: number;
    classification?: "Household" | "Transport" | "Food" | "Entertainment" | "Unknown"
};

export type Classification = { 
    recipient: string; 
    classification: string 
};

export let transactions: Transaction[] = transactionsData;

export const findClassification = (recipient: string): string => {
    const match = classificationsData.find((c) => c.recipient === recipient);
    if (!match) {
        return "Unknown";
    }
    return match.classification;
};

// console.log(findClassification("ICA"));