
import { Router } from "express";
import { pool } from "./db.js";
import { classificationSchema } from "./schemas.js";

const router = Router();

// Issue #20: GET /classifications
router.get("/", (_req, res) => {
  res.json(classificationSchema.options);
});

// Issue #19: Find a recipient's classification in PostgreSQL
export async function getRecipientClassification(
  recipient: string
): Promise<string> {
  const result = await pool.query(
    `SELECT classification
     FROM classifications
     WHERE LOWER(recipient) = LOWER($1)`,
    [recipient]
  );

  if (result.rows.length === 0) {
    return "Unknown";
  }

  const parsed = classificationSchema.safeParse(
    result.rows[0].classification
  );

  return parsed.success ? parsed.data : "Unknown";
}

export default router;
