import { select } from "@inquirer/prompts";

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
        console.log("View all transactions");
        break;
    case "view one":
        console.log("View one transaction");
        break;
    case "add":
        console.log("Add transaction");
        break;
    case "update":
        console.log("Update transaction");
        break;
    case "delete":
        console.log("Delete transaction");
        break;
    case "filter by date":
        console.log("Filter transactions by date");
        break;
    case "exit":
        console.log("Exit");
        return;
}
await main();
}
main();