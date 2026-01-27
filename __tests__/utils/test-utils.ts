// Test utilities for API testing

export function createMockNextRequest(
  method: string = 'GET',
  body?: any,
  headers: Record<string, string> = {},
  ip: string = '127.0.0.1'
): any {
  return {
    method,
    ip,
    headers: new Map(Object.entries(headers)),
    json: async () => body,
    clone: () => createMockNextRequest(method, body, headers, ip),
  }
}

export function createMockNextResponse() {
  const response: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    headers: jest.fn().mockReturnThis(),
  }
  return response
}

// Mock environment for tests
export function setupTestEnvironment() {
  // Set up test environment variables
  process.env.DEEPSEEK_API_KEY = 'sk-test-key'
  process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  process.env.NEXT_PUBLIC_APP_NAME = 'TestApp'
  process.env.RATE_LIMIT_MAX_REQUESTS = '100'
  process.env.RATE_LIMIT_WINDOW_MS = '900000'
  process.env.ENABLE_CLAUDE_CODE_PLUGIN = 'true'
  process.env.ENABLE_AI_PROCESSING = 'true'
}

// Add a test to satisfy Jest's requirement
describe('Test Utilities', () => {
  test('should export utility functions', () => {
    expect(typeof createMockNextRequest).toBe('function')
    expect(typeof createMockNextResponse).toBe('function')
    expect(typeof setupTestEnvironment).toBe('function')
  })
})