import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .transform((s) => s.replace(/[\s-]/g, "").replace(/^(\+91|91)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"));

export const customerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: phoneSchema,
});

export const addressSchema = z.object({
  line1: z.string().trim().min(3, "Enter your address").max(200),
  line2: z.string().trim().max(200).optional().default(""),
  city: z.string().trim().min(2, "Enter your city").max(80),
  state: z.string().trim().min(2, "Select your state").max(80),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
});

export const firstError = (e: z.ZodError) => e.issues[0]?.message ?? "Invalid input";
