import { select, input } from "@inquirer/prompts";

async function main() {
    const choice = await select({
    message: "Choose an option:",
    choices: [
        { 
            name: "View transactions",
            value: "view all"
        },
        { 
            name: "View one transaction",
            value: "view one"
        },
        { 
            name: "Add transaction",
            value: "add"
        },
        { 
            name: "Update transaction",
            value: "update"
        },
        { 
            name: "Delete transaction",
            value: "delete"
        },
        { 
            name: "Filter transactions by date",
            value: "filter by date"
        },
        {
            name: "Exit",
            value: "exit"
        }
    ]

});

switch (choice) {
    case "view all":
        await viewTransactions();
        break;
    case "view one":
        await viewOneTransaction();
        break;
    case "add":
        await addTransaction();
        break;
    case "update":
        await updateTransaction();
        break;
    case "delete":
        await deleteTransaction();
        break;
    case "filter by date":
        await filterTransactionsByDate();
        break;
    case "exit":
        console.log("Exit");
        return;
}
await main();
}

const API_URL = "http://localhost:3000";

async function viewTransactions() {
    try {
        const response = await fetch(`${API_URL}/transactions`);

        if (!response.ok) {
            console.log("Failed to fetch transactions");
            return;
        }

        const transactions = await response.json();

        console.log(transactions);
    } catch (error) {
        console.log("Could not connect to the API");
    }
}

async function viewOneTransaction() {
    const id = await input({
        message: "Enter transaction ID:"
    });

    try {
        const response = await fetch(`${API_URL}/transactions/${id}`);

        const data = await response.json();

        if (!response.ok) {
            console.log(data.error || data.message || "Failed to fetch transaction");
            return;
        }

        console.log(data);
    } catch (error) {
        console.log("Could not connect to the API");
    }
}

async function addTransaction() {
    const date = await input({
        message: "Enter date (YYYY-MM-DD):"
    });

    const recipient = await input({
        message: "Enter recipient:"
    });

    const amountInput = await input({
        message: "Enter amount:"
    });

    const amount = Number(amountInput);

    try {
        const response = await fetch(`${API_URL}/transactions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                date,
                recipient,
                amount
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(data.message || "Failed to add transaction");
            return;
        }

        console.log("Transaction created:");
        console.log(data);

    } catch (error) {
        console.log("Could not connect to the API");
    }
}

async function updateTransaction() {
    const id = await input({
        message: "Enter transaction ID:"
    });

    const date = await input({
        message: "Enter new date:"
    });

    const recipient = await input({
        message: "Enter new recipient:"
    });

    const amountInput = await input({
        message: "Enter new amount:"
    });

    const amount = Number(amountInput);

    try {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                date,
                recipient,
                amount
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(data.message || "Failed to update transaction");
            return;
        }

        console.log("Transaction updated:");
        console.log(data);

    } catch (error) {
        console.log("Could not connect to the API");
    }
}

async function deleteTransaction() {
    const id = await input({
        message: "Enter transaction ID:"
    });

    try {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(data.message || "Failed to delete transaction");
            return;
        }

        console.log(data.message);

    } catch (error) {
        console.log("Could not connect to the API");
    }
}

async function filterTransactionsByDate() {
    const start = await input({
        message: "Enter start date (YYYY-MM-DD):"
    });

    const end = await input({
        message: "Enter end date (YYYY-MM-DD):"
    });

    try {
        const response = await fetch(
            `${API_URL}/transactions?start=${start}&end=${end}`
        );

        const data = await response.json();

        if (!response.ok) {
            console.log(data.message || "Failed to filter transactions");
            return;
        }

        console.log("Filtered transactions:");
        console.log(data);

    } catch (error) {
        console.log("Could not connect to the API");
    }
}

main();