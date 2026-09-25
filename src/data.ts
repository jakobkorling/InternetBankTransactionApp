import classificationsData from "../data/classifications.json" with { type: "json" };
import transactionsData from "../data/transactions.json" with { type: "json" };

export type ClassificationType = "Household" | "Transport" | "Food" | "Entertainment" | "Unknown";

export type Transaction = {
    id: number;
    date: string;
    recipient: string;
    amount: number;
    classification?: ClassificationType | undefined
};

export type Classification = { 
    recipient: string; 
    classification: ClassificationType 
};

export let transactions: Transaction[] = transactionsData;

export const findClassification = (recipient: string): ClassificationType => {
    const match = classificationsData.find((c) => c.recipient === recipient);
    if (!match) {
        return "Unknown";
    }
    return match.classification as ClassificationType;

}; 

export { classificationsData };
