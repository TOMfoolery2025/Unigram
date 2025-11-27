/**
 * Environment variable validation utility
 * 
 * This module validates that all required environment variables are present
 * and properly formatted. It should be called early in the application lifecycle
 * to catch configuration errors before they cause runtime issues.
 */

interface EnvValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Required environment variables that must be present
 */
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_HYGRAPH_ENDPOINT',
  'HYGRAPH_TOKEN',
] as const;

/**
 * Optional environment variables with default values
 */
const OPTIONAL_ENV_VARS = [
  'NEXT_PUBLIC_APP_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NODE_ENV',
] as const;

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate Supabase URL format
 */
function isValidSupabaseUrl(url: string): boolean {
  if (!isValidUrl(url)) return false;
  return url.includes('supabase.co') || url.includes('localhost');
}

/**
 * Validate Hygraph endpoint format
 */
function isValidHygraphEndpoint(endpoint: string): boolean {
  if (!isValidUrl(endpoint)) return false;
  return endpoint.includes('hygraph.com');
}

/**
 * Validate all environment variables
 * 
 * @returns Validation result with errors and warnings
 */
export function validateEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];

    if (!value) {
      errors.push(`Missing required environment variable: ${varName}`);
      continue;
    }

    // Validate specific formats
    if (varName === 'NEXT_PUBLIC_SUPABASE_URL') {
      if (!isValidSupabaseUrl(value)) {
        errors.push(
          `Invalid NEXT_PUBLIC_SUPABASE_URL format. Expected a Supabase URL like https://xxx.supabase.co`
        );
      }
    }

    if (varName === 'NEXT_PUBLIC_HYGRAPH_ENDPOINT') {
      if (!isValidHygraphEndpoint(value)) {
        errors.push(
          `Invalid NEXT_PUBLIC_HYGRAPH_ENDPOINT format. Expected a Hygraph URL like https://api-region.hygraph.com/v2/project-id/master`
        );
      }
    }

    // Check for placeholder values
    if (
      value.includes('your-') ||
      value.includes('project-id') ||
      value === 'your-project-url'
    ) {
      errors.push(
        `Environment variable ${varName} contains placeholder value. Please set actual value.`
      );
    }
  }

  // Check optional variables and provide warnings
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    warnings.push(
      'NEXT_PUBLIC_APP_URL is not set. CORS will allow all origins (*). Set this in production for security.'
    );
  } else if (!isValidUrl(appUrl)) {
    errors.push(
      `Invalid NEXT_PUBLIC_APP_URL format. Expected a valid URL like https://yourdomain.com`
    );
  }

  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv && !['development', 'production', 'test'].includes(nodeEnv)) {
    warnings.push(
      `NODE_ENV has unexpected value: ${nodeEnv}. Expected: development, production, or test.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate environment and throw error if invalid
 * Call this early in your application (e.g., in middleware or root layout)
 */
export function validateEnvOrThrow(): void {
  const result = validateEnv();

  // Log warnings
  if (result.warnings.length > 0) {
    console.warn('Environment configuration warnings:');
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  // Throw error if validation failed
  if (!result.isValid) {
    const errorMessage = [
      'Environment configuration is invalid:',
      ...result.errors.map((error) => `  - ${error}`),
      '',
      'Please check your .env.local file and ensure all required variables are set.',
      'See .env.example for documentation of all environment variables.',
    ].join('\n');

    throw new Error(errorMessage);
  }
}

/**
 * Get environment configuration summary (safe for logging)
 * Masks sensitive values
 */
export function getEnvSummary(): Record<string, string> {
  const summary: Record<string, string> = {};

  const allVars = [...REQUIRED_ENV_VARS, ...OPTIONAL_ENV_VARS];

  for (const varName of allVars) {
    const value = process.env[varName];

    if (!value) {
      summary[varName] = '<not set>';
    } else if (varName.includes('KEY') || varName.includes('TOKEN')) {
      // Mask sensitive values
      summary[varName] = `<set, length: ${value.length}>`;
    } else {
      summary[varName] = value;
    }
  }

  return summary;
}
