import { z } from "zod";

export const classificationSchema = z.enum([
    "Household",
    "Transport",
    "Food",
    "Entertainment",
    "Unknown",
]);
export type ClassificationType = z.infer<typeof classificationSchema>;

export function isValidDate(date: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return false;
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
        return false;
    }

    const [year, month, day] = date.split("-").map(Number);

  return (
        parsedDate.getUTCFullYear() === year &&
        parsedDate.getUTCMonth() + 1 === month &&
        parsedDate.getUTCDate() === day
    );
}

const dateString = z
    .string("Date must be a string")
    .refine(isValidDate, "Date must be a valid date in format YYYY-MM-DD");

const recipient = z
    .string("Recipient must be a string")
    .refine((s) => s.trim() !== "", "Recipient must be a non-empty string");

const amount = z.number("Amount must be a finite number");

export const idParamSchema = z.object({
    id: z
        .string()
        .regex(/^[1-9]\d*$/, "Transaction ID must be a number")
        .transform(Number),
});

export const createTransactionSchema = z.object({
    date: dateString,
    recipient,
    amount,
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const dateFilterQuerySchema = z
    .object({
        start: dateString.optional(),
        end: dateString.optional(),
    })
    .refine(
        (q) => (q.start === undefined) === (q.end === undefined),
        "Both start and end are required for date filtering"
    )
    .refine(
        (q) => !q.start || !q.end || q.start <= q.end,
        "Start date must be before end date!"
    );

export const formatZodError = (error: z.ZodError): string =>
    error.issues.map((i) => i.message).join("; ");