# Internet Bank Transaction App

A small internet bank app for managing account transactions. It has two parts:

- **A REST API** (Express + TypeScript) that stores transactions and lets you list, filter, create, update and delete them.
- **A terminal application** (interactive menu) that talks to the API, so you can manage transactions without writing HTTP requests yourself.

Each transaction has a date, a recipient and an amount. Negative amounts are expenses and positive amounts are income. Expenses are automatically **classified** (Food, Transport, Entertainment, Household or Unknown) based on the recipient.

## Tech stack

- Node.js + TypeScript
- [Express 5](https://expressjs.com/) for the API
- [@inquirer/prompts](https://www.npmjs.com/package/@inquirer/prompts) for the terminal menu
- [tsx](https://www.npmjs.com/package/tsx) to run TypeScript directly

## Project structure

```
InternetBankTransactionApp/
├── data/
│   ├── transactions.json      # Starting transactions loaded when the API starts
│   └── classifications.json   # Recipient -> classification mapping
├── src/
│   ├── server.ts              # Express API (port 3000)
│   ├── client.ts              # Terminal application
│   └── data.ts                # Types, data loading and classification lookup
├── package.json
└── tsconfig.json
```

## Installation

Requirements: **Node.js 20 or newer** (the app uses the built-in `fetch` and JSON import attributes) and npm.

```bash
git clone https://github.com/jakobkorling/InternetBankTransactionApp.git
cd InternetBankTransactionApp
npm install
```

To check the code for type errors:

```bash
npm run typecheck
```

## Starting the API

```bash
npm run server
```

The API runs on **http://localhost:3000**. You should see:

```
Server is running on port: 3000
```

Keep this terminal open while you use the API or the terminal application.

## Starting the terminal application

Open a **second** terminal in the project folder and run:

```bash
npm run client
```

The API must already be running. Otherwise every action prints `Could not connect to the API`.

## Using the terminal application

When the client starts, it shows a menu. Use the **arrow keys** to choose an option and press **Enter**. After each action the menu shows again, until you choose **Exit**.

| Menu option | What it asks for | What it does |
|---|---|---|
| **View transactions** | Nothing | Shows all transactions, with a classification on every expense |
| **View one transaction** | Transaction ID | Shows one transaction, or `Transaction not found` |
| **Add transaction** | Date (YYYY-MM-DD), recipient, amount | Creates a transaction and shows it with its new ID |
| **Update transaction** | Transaction ID, new date, new recipient, new amount | Updates the transaction and shows the result |
| **Delete transaction** | Transaction ID | Deletes the transaction |
| **Filter transactions by date** | Start date, end date (YYYY-MM-DD) | Shows transactions between the two dates, both included |
| **Exit** | Nothing | Closes the application |

Things to know when entering values:

- Use a **negative amount** for an expense (e.g. `-250`) and a **positive amount** for income (e.g. `32000`).
- When **updating**, you can leave the date or recipient empty to keep the current value. Leaving the **amount** empty does **not** keep it: the client turns an empty amount into `0`. Always enter the amount again when updating.
- An amount that is not a number (e.g. `abc`) is rejected by the API with `Amount must be a number` when updating, and with `Date, recipient and amount are required` when adding.
- Error messages from the API are printed as they are, e.g. `Invalid date format` or `Transaction not found`.

### Example session

```
? Choose an option: Add transaction
? Enter date (YYYY-MM-DD): 2026-09-10
? Enter recipient: ICA
? Enter amount: -220
Transaction created:
{ id: 10, date: '2026-09-10', recipient: 'ICA', amount: -220, classification: 'Food' }
```

## API endpoints

Base URL: `http://localhost:3000`. Request and response bodies are JSON.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check. Returns the text `Internet Bank Transaction API` |
| GET | `/transactions` | Get all transactions |
| GET | `/transactions?start=YYYY-MM-DD&end=YYYY-MM-DD` | Get transactions within a date range |
| GET | `/transactions/:id` | Get one transaction by ID |
| POST | `/transactions` | Create a transaction |
| PUT | `/transactions/:id` | Update a transaction |
| DELETE | `/transactions/:id` | Delete a transaction |
| GET | `/classifications` | Get the recipient → classification list |

### GET `/transactions`

Returns every transaction. Expenses (negative amounts) include a `classification`.

```bash
curl http://localhost:3000/transactions
```

```json
[
  { "id": 1, "date": "2026-09-01", "recipient": "ICA", "amount": -350, "classification": "Food" },
  { "id": 8, "date": "2026-09-07", "recipient": "Employer", "amount": 32000 }
]
```

**Filter by date:** add both `start` and `end` as query parameters.

```bash
curl "http://localhost:3000/transactions?start=2026-09-02&end=2026-09-05"
```

| Status | When |
|---|---|
| 200 | Success (an empty array `[]` if nothing matches) |
| 400 | `{ "message": "Invalid date format" }`: a date is invalid, or only one of `start`/`end` was given |
| 400 | `{ "message": "Start date must be before end date!" }`: `start` is later than `end` |

### GET `/transactions/:id`

```bash
curl http://localhost:3000/transactions/3
```

```json
{ "id": 3, "date": "2026-09-03", "recipient": "Netflix", "amount": -149 }
```

| Status | When |
|---|---|
| 200 | Transaction found |
| 400 | `{ "error": "Transaction ID must be a number" }` |
| 404 | `{ "error": "Transaction not found" }` |

Note: this endpoint returns the transaction as it is stored. Transactions from the starting data do not store a classification, so it is only shown here for transactions created or updated through the API. Use `GET /transactions` to always see classifications.

### POST `/transactions`

Request body (all three fields required):

```json
{ "date": "2026-09-10", "recipient": "ICA", "amount": -220 }
```

```bash
curl -X POST http://localhost:3000/transactions \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-09-10","recipient":"ICA","amount":-220}'
```

Response `201 Created`:

```json
{ "id": 10, "date": "2026-09-10", "recipient": "ICA", "amount": -220, "classification": "Food" }
```

| Status | When |
|---|---|
| 201 | Transaction created |
| 400 | `{ "message": "Date, recipient and amount are required" }`: a field is missing or has the wrong type |

### PUT `/transactions/:id`

Send only the fields you want to change. Fields you leave out keep their current value.

```bash
curl -X PUT http://localhost:3000/transactions/10 \
  -H "Content-Type: application/json" \
  -d '{"amount":-180}'
```

Response `200 OK`:

```json
{
  "message": "Transaction updated successfully",
  "transaction": { "id": 10, "date": "2026-09-10", "recipient": "ICA", "amount": -180, "classification": "Food" }
}
```

| Status | When |
|---|---|
| 200 | Transaction updated |
| 400 | `{ "message": "Amount must be a number" }` |
| 404 | `{ "message": "Transaction not found" }`: also returned when the ID is not a number |

### DELETE `/transactions/:id`

```bash
curl -X DELETE http://localhost:3000/transactions/10
```

Response `200 OK`:

```json
{ "message": "Transaction deleted successfully" }
```

| Status | When |
|---|---|
| 200 | Transaction deleted |
| 400 | `{ "message": "Transaction ID must be a number" }` |
| 404 | `{ "message": "Transaction not found" }` |

### GET `/classifications`

Returns the list used to classify expenses.

```json
[
  { "recipient": "ICA", "classification": "Food" },
  { "recipient": "Skanetrafiken", "classification": "Transport" }
]
```

## Team decisions

### Are start and end dates included when filtering?

**Yes, both are included.** `?start=2026-09-02&end=2026-09-05` returns transactions dated 2026-09-02, 2026-09-05 and everything in between. Both `start` and `end` must be given. If only one is sent, the missing one counts as an invalid date and the API returns 400.

### What happens with invalid dates?

- When **filtering**, a date that cannot be parsed (e.g. `abc` or `2026-13-01`) returns **400** with `Invalid date format`. A `start` later than `end` returns **400** with `Start date must be before end date!`.
- Dates are parsed with JavaScript's `Date`, so an impossible day such as `2026-02-30` is not rejected. It rolls over to `2026-03-02`.
- Always use the `YYYY-MM-DD` format. Other formats (e.g. `09/05/2026`) are parsed in local time and may shift the range by a few hours.
- When **creating or updating**, the API only checks that `date` is a string. It does not check that the string is a valid date.

### What happens when no classification is found?

Classification only applies to **expenses** (negative amounts). The recipient is looked up in `data/classifications.json`. The match is exact and case-sensitive, so `ica` does not match `ICA`.

- If the recipient is found, its classification is used (`Food`, `Transport`, `Entertainment` or `Household`).
- If the recipient is **not** found, the classification is **`Unknown`**. The request still succeeds.
- Income (amount of 0 or more) gets no classification. If an update changes an expense into income, the classification is removed.

### Which fields are required when creating a transaction?

`date` (string), `recipient` (string) and `amount` (number) are all required. If any is missing or has the wrong type, the API returns **400**. The `id` is generated by the server (highest existing ID + 1), and `classification` is calculated by the server. Any other fields in the body are ignored.

### Which fields can be updated?

`date`, `recipient` and `amount`. All are optional in a PUT request, and fields that are left out keep their current value. Empty strings for `date` or `recipient` also keep the current value. `amount` must be a number if it is sent. The `id` cannot be changed, and `classification` cannot be set by hand: it is recalculated after every update.

### What happens when a transaction does not exist?

`GET`, `PUT` and `DELETE` on `/transactions/:id` return **404** with `Transaction not found`. For `GET` and `DELETE`, an ID that is not a number returns **400** instead. For `PUT`, a non-numeric ID returns 404.

### Which HTTP status codes are used?

| Code | Meaning in this API |
|---|---|
| **200 OK** | Successful read, update or delete |
| **201 Created** | Transaction created (POST) |
| **400 Bad Request** | Invalid input: bad dates, missing or wrong-typed fields, non-numeric ID |
| **404 Not Found** | No transaction with that ID |

Error responses use a `message` field, except `GET /transactions/:id`, which uses an `error` field.

### Data storage

Transactions are kept **in memory**. The API loads `data/transactions.json` when it starts, but changes are never written back to the file. Restarting the API resets all data to the starting transactions.
