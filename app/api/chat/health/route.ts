/**
 * Health check endpoint for chatbot configuration
 * Validates that all required configuration is present
 * Requirements: 8.1, 8.5
 */

import { NextResponse } from 'next/server';
import { validateChatbotConfig, getConfigSummary } from '@/lib/chat/config';

export async function GET() {
  try {
    const validation = validateChatbotConfig();
    const configSummary = getConfigSummary();
    
    if (!validation.isValid) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Chatbot configuration is invalid',
          errors: validation.errors,
          warnings: validation.warnings,
          config: configSummary,
        },
        { status: 500 }
      );
    }
    
    if (validation.warnings.length > 0) {
      return NextResponse.json({
        status: 'warning',
        message: 'Chatbot is operational but has configuration warnings',
        warnings: validation.warnings,
        config: configSummary,
      });
    }
    
    return NextResponse.json({
      status: 'ok',
      message: 'Chatbot configuration is valid',
      config: configSummary,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to validate configuration',
        error: error.message,
      },
      { status: 500 }
    );
  }
}
