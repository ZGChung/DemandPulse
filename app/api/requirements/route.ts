import { NextRequest, NextResponse } from 'next/server'
import { DataCollectionFlow } from '@/services/data-collection-flow'
import { env } from '@/lib/env'

// Initialize services
const dataCollectionFlow = new DataCollectionFlow()

// Rate limiting in memory (in production, use Redis or similar)
const rateLimit = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now()
  const windowMs = env.rateLimitWindowMs()
  const maxRequests = env.rateLimitMaxRequests()

  const userLimit = rateLimit.get(ip)
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or create new limit
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, reset: now + windowMs }
  }

  if (userLimit.count >= maxRequests) {
    return { allowed: false, remaining: 0, reset: userLimit.resetTime }
  }

  // Increment count
  userLimit.count++
  rateLimit.set(ip, userLimit)
  
  return { allowed: true, remaining: maxRequests - userLimit.count, reset: userLimit.resetTime }
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(ip)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': env.rateLimitMaxRequests().toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.reset / 1000).toString(),
            'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    // Parse request body
    const body = await request.json().catch(() => null)
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { 
      requirementId,
      originalRequirement,
      summarizedRequirement,
      context,
      consent 
    } = body

    // Validate required fields
    if (!requirementId || !originalRequirement || !summarizedRequirement || !context || !consent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Process consent and collect requirement
    const result = await dataCollectionFlow.handleUserConsent(
      requirementId,
      originalRequirement,
      summarizedRequirement,
      context,
      consent
    )

    if (!result.success) {
      return NextResponse.json(
        { 
          error: 'Consent validation failed',
          details: result.errors 
        },
        { status: 400 }
      )
    }

    // In a real implementation, we would store the collected requirement in a database
    // For now, we'll just return success
    console.log('Requirement collected:', {
      id: result.collectedRequirement?.id,
      summary: result.collectedRequirement?.summarizedRequirement,
      consent: result.collectedRequirement?.consent.consentOptions,
    })

    return NextResponse.json(
      {
        success: true,
        requirementId: result.collectedRequirement?.id,
        message: 'Requirement successfully collected',
        retentionDays: dataCollectionFlow.getFlowStatistics(), // Placeholder
      },
      {
        status: 201,
        headers: {
          'X-RateLimit-Limit': env.rateLimitMaxRequests().toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(rateLimitResult.reset / 1000).toString(),
        },
      }
    )

  } catch (error) {
    console.error('Error processing requirement submission:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // This endpoint would return requirements in a real implementation
  // For now, return a placeholder response
  return NextResponse.json(
    {
      message: 'Requirements API is working',
      endpoints: {
        POST: '/api/requirements - Submit a new requirement',
      },
      rateLimit: {
        maxRequests: env.rateLimitMaxRequests(),
        windowMs: env.rateLimitWindowMs(),
      },
    },
    { status: 200 }
  )
}