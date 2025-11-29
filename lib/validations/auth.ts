import { z } from "zod"

/**
 * Validates that an email address ends with @tum.de or @mytum.de
 */
export function validateTUMEmail(email: string): boolean {
  return email.endsWith('@tum.de') || email.endsWith('@mytum.de')
}

/**
 * Common weak passwords that should be rejected
 */
const COMMON_WEAK_PASSWORDS = [
  'password',
  'password123',
  '12345678',
  '123456',
  '1234567',
  '12345678',
  '1234',
  '12345',
  '123',
  '123456789',
  'qwerty123',
  'abc123',
  'letmein',
  'welcome',
  'admin123',
  'root123',
  'tum123',
  'tum2024',
]

/**
 * Validates password strength
 * Returns an error message if the password is too weak, or null if it's acceptable
 */
export function validatePasswordStrength(password: string): string | null {
  // Check minimum length
  if (password.length < 8) {
    return "Password must be at least 8 characters long"
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter"
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter"
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number"
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?/\\'\")"
  }

  // Check against common weak passwords
  // Use exact matching (case-insensitive) to avoid false positives from substring matching
  // This prevents passwords like "MyPassword123" from being rejected for containing "password"
  const lowerPassword = password.toLowerCase()
  if (COMMON_WEAK_PASSWORDS.some(weak => lowerPassword === weak.toLowerCase())) {
    return "Password is too common or easily guessable. Please choose a stronger password"
  }

  // Check for repeated characters (e.g., "aaaa" or "1111")
  if (/(.)\1{3,}/.test(password)) {
    return "Password cannot contain the same character repeated 4 or more times"
  }

  // Check for sequential characters (e.g., "1234" or "abcd")
  if (/0123|1234|2345|3456|4567|5678|6789|abcd|bcde|cdef|defg|efgh|fghi|ghij|hijk|ijkl|jklm|klmn|lmno|mnop|nopq|opqr|pqrs|qrst|rstu|stuv|tuvw|uvwx|vwxy|wxyz/i.test(password)) {
    return "Password cannot contain sequential characters (e.g., '1234' or 'abcd')"
  }

  return null
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
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .superRefine((password, ctx) => {
      const error = validatePasswordStrength(password)
      if (error !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: error,
        })
      }
    }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
