import { z } from "zod"

/**
 * Validates that an email address ends with @tum.de or @mytum.de
 */
export function validateTUMEmail(email: string): boolean {
  return email.endsWith('@tum.de') || email.endsWith('@mytum.de')
}

/**
 * Zod schema for TUM email validation
 */
export const tumEmailSchema = z
  .string()
  .email("Invalid email address")
  .refine(
    (email) => validateTUMEmail(email),
    "Email must be a valid TUM email address (@tum.de or @mytum.de)"
  )

/**
 * Zod schema for login form
 */
export const loginSchema = z.object({
  email: tumEmailSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
})

/**
 * Zod schema for registration form
 */
export const registerSchema = z.object({
  email: tumEmailSchema,
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
