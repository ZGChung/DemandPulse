import { NextResponse } from 'next/server'
import { validateEnv, env } from '@/lib/env'

export async function GET() {
  try {
    // Validate environment on health check
    validateEnv()
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      app: {
        name: env.appName(),
        url: env.appUrl(),
      },
      features: {
        claudeCodePlugin: env.enableClaudeCodePlugin(),
        aiProcessing: env.enableAiProcessing(),
      },
      environment: process.env.NODE_ENV,
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}