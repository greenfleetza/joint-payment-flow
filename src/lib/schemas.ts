// Zod schemas shared across forms.
import { z } from "zod";

export const contributorSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Name required").max(80, "Name too long"),
  email: z.string().trim().email("Invalid email").max(255),
  shareCents: z.number().int().min(1, "Share must be > $0"),
  isInitiator: z.boolean().optional(),
});

export const contributorsFormSchema = z.object({
  rows: z.array(contributorSchema).min(2, "Add at least 2 contributors"),
});

export type ContributorsForm = z.infer<typeof contributorsFormSchema>;

export const addCardSchema = z.object({
  name: z.string().trim().min(1, "Cardholder name required").max(80),
  cardNumber: z
    .string()
    .transform((s) => s.replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{13,19}$/, "Invalid card number")),
  expiry: z
    .string()
    .regex(/^\d{2}\s?\/\s?\d{2}$/, "MM / YY"),
  cvc: z.string().regex(/^\d{3,4}$/, "3 or 4 digits"),
});

export type AddCardForm = z.infer<typeof addCardSchema>;
