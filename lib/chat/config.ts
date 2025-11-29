/**
 * Configuration module for Wiki Chatbot
 * Handles loading and validation of environment variables
 * Requirements: 8.1, 8.5
 */

/**
 * Configuration interface for the chatbot
 */
export interface ChatbotConfig {
  openai: {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
}

/**
 * Validation result for configuration
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate temperature value
 * Valid range: 0.0 to 2.0
 */
function validateTemperature(value: string | undefined): { value: number; warning?: string } {
  const defaultValue = 0.7;
  
  if (!value) {
    return { value: defaultValue };
  }
  
  const parsed = parseFloat(value);
  
  if (isNaN(parsed)) {
    return {
      value: defaultValue,
      warning: `Invalid OPENAI_TEMPERATURE value: "${value}" (not a number). Using default: ${defaultValue}`,
    };
  }
  
  if (parsed < 0 || parsed > 2) {
    return {
      value: defaultValue,
      warning: `Invalid OPENAI_TEMPERATURE value: ${parsed} (must be between 0 and 2). Using default: ${defaultValue}`,
    };
  }
  
  return { value: parsed };
}

/**
 * Validate max tokens value
 * Valid range: 1 to 4096
 */
function validateMaxTokens(value: string | undefined): { value: number; warning?: string } {
  const defaultValue = 1000;
  
  if (!value) {
    return { value: defaultValue };
  }
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    return {
      value: defaultValue,
      warning: `Invalid OPENAI_MAX_TOKENS value: "${value}" (not a number). Using default: ${defaultValue}`,
    };
  }
  
  if (parsed < 1 || parsed > 4096) {
    return {
      value: defaultValue,
      warning: `Invalid OPENAI_MAX_TOKENS value: ${parsed} (must be between 1 and 4096). Using default: ${defaultValue}`,
    };
  }
  
  return { value: parsed };
}

/**
 * Validate OpenAI model name
 * Provides warning for unknown models but doesn't fail
 */
function validateModel(value: string | undefined): { value: string; warning?: string } {
  const defaultValue = 'gpt-4-turbo-preview';
  
  if (!value) {
    return { value: defaultValue };
  }
  
  // List of known models (as of implementation)
  const knownModels = [
    'gpt-4-turbo-preview',
    'gpt-4-turbo',
    'gpt-4',
    'gpt-4-0125-preview',
    'gpt-4-1106-preview',
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-0125',
    'gpt-3.5-turbo-1106',
  ];
  
  if (!knownModels.includes(value)) {
    return {
      value,
      warning: `Unknown OPENAI_MODEL value: "${value}". This may cause API errors if the model doesn't exist. Known models: ${knownModels.join(', ')}`,
    };
  }
  
  return { value };
}

/**
 * Load and validate chatbot configuration from environment variables
 * Requirements: 8.1, 8.5
 * 
 * @throws {Error} If required configuration is missing
 * @returns {ChatbotConfig} Validated configuration object
 */
export function loadChatbotConfig(): ChatbotConfig {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Requirement 8.1: Load configuration from environment variables
  const apiKey = process.env.OPENAI_API_KEY;
  
  // Validate required configuration
  if (!apiKey) {
    errors.push('OPENAI_API_KEY environment variable is required');
  }
  
  // Validate optional configuration with defaults
  const modelValidation = validateModel(process.env.OPENAI_MODEL);
  if (modelValidation.warning) {
    warnings.push(modelValidation.warning);
  }
  
  const temperatureValidation = validateTemperature(process.env.OPENAI_TEMPERATURE);
  if (temperatureValidation.warning) {
    warnings.push(temperatureValidation.warning);
  }
  
  const maxTokensValidation = validateMaxTokens(process.env.OPENAI_MAX_TOKENS);
  if (maxTokensValidation.warning) {
    warnings.push(maxTokensValidation.warning);
  }
  
  // Requirement 8.5: Log warnings for invalid config
  if (warnings.length > 0) {
    console.warn('⚠️  Chatbot Configuration Warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  // Throw error if required configuration is missing
  if (errors.length > 0) {
    const errorMessage = 'Chatbot Configuration Errors:\n' + errors.map(e => `  - ${e}`).join('\n');
    throw new Error(errorMessage);
  }
  
  // Return validated configuration
  return {
    openai: {
      apiKey: apiKey!,
      model: modelValidation.value,
      temperature: temperatureValidation.value,
      maxTokens: maxTokensValidation.value,
    },
  };
}

/**
 * Validate configuration without throwing errors
 * Useful for health checks and diagnostics
 * 
 * @returns {ValidationResult} Validation result with errors and warnings
 */
export function validateChatbotConfig(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required configuration
  if (!process.env.OPENAI_API_KEY) {
    errors.push('OPENAI_API_KEY is not set');
  }
  
  // Validate optional configuration
  const modelValidation = validateModel(process.env.OPENAI_MODEL);
  if (modelValidation.warning) {
    warnings.push(modelValidation.warning);
  }
  
  const temperatureValidation = validateTemperature(process.env.OPENAI_TEMPERATURE);
  if (temperatureValidation.warning) {
    warnings.push(temperatureValidation.warning);
  }
  
  const maxTokensValidation = validateMaxTokens(process.env.OPENAI_MAX_TOKENS);
  if (maxTokensValidation.warning) {
    warnings.push(maxTokensValidation.warning);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get current configuration values (for debugging/logging)
 * Masks the API key for security
 */
export function getConfigSummary(): Record<string, string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  return {
    'OPENAI_API_KEY': apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : 'NOT SET',
    'OPENAI_MODEL': process.env.OPENAI_MODEL || 'gpt-4-turbo-preview (default)',
    'OPENAI_TEMPERATURE': process.env.OPENAI_TEMPERATURE || '0.7 (default)',
    'OPENAI_MAX_TOKENS': process.env.OPENAI_MAX_TOKENS || '1000 (default)',
  };
}
