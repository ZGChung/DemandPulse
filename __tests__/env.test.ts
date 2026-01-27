import { validateEnv, getEnv, getEnvAsBoolean, getEnvAsNumber, env } from '@/lib/env'

describe('Environment Validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  describe('validateEnv', () => {
    it('should throw error when required env vars are missing', () => {
      delete process.env.DEEPSEEK_API_KEY
      delete process.env.NEXT_PUBLIC_APP_URL

      expect(() => validateEnv()).toThrow('Missing required environment variables: DEEPSEEK_API_KEY, NEXT_PUBLIC_APP_URL')
    })

    it('should not throw when all required env vars are present', () => {
      process.env.DEEPSEEK_API_KEY = 'sk-test-key'
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

      expect(() => validateEnv()).not.toThrow()
    })

    it('should warn when API key format is incorrect', () => {
      process.env.DEEPSEEK_API_KEY = 'invalid-key'
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

      const consoleWarn = jest.spyOn(console, 'warn').mockImplementation()
      
      validateEnv()
      
      expect(consoleWarn).toHaveBeenCalledWith(
        'Warning: DEEPSEEK_API_KEY does not start with "sk-"'
      )
      
      consoleWarn.mockRestore()
    })
  })

  describe('getEnv', () => {
    it('should return environment variable value', () => {
      process.env.TEST_VAR = 'test-value'
      expect(getEnv('TEST_VAR' as any)).toBe('test-value')
    })

    it('should throw for missing required env var', () => {
      delete process.env.DEEPSEEK_API_KEY
      expect(() => getEnv('DEEPSEEK_API_KEY')).toThrow('Required environment variable DEEPSEEK_API_KEY is not set')
    })

    it('should return default value for missing optional env var', () => {
      // Temporarily delete the env var to test default value
      const originalValue = process.env.NEXT_PUBLIC_APP_NAME
      delete process.env.NEXT_PUBLIC_APP_NAME
      expect(getEnv('NEXT_PUBLIC_APP_NAME' as any, 'DefaultApp')).toBe('DefaultApp')
      // Restore the original value
      if (originalValue !== undefined) {
        process.env.NEXT_PUBLIC_APP_NAME = originalValue
      }
    })
  })

  describe('getEnvAsBoolean', () => {
    it('should return true for "true" string', () => {
      process.env.TEST_BOOL = 'true'
      expect(getEnvAsBoolean('TEST_BOOL' as any)).toBe(true)
    })

    it('should return false for "false" string', () => {
      process.env.TEST_BOOL = 'false'
      expect(getEnvAsBoolean('TEST_BOOL' as any)).toBe(false)
    })

    it('should return default value for missing env var', () => {
      expect(getEnvAsBoolean('TEST_BOOL' as any, true)).toBe(true)
    })
  })

  describe('getEnvAsNumber', () => {
    it('should parse numeric string', () => {
      process.env.TEST_NUM = '123'
      expect(getEnvAsNumber('TEST_NUM' as any)).toBe(123)
    })

    it('should return default for invalid number', () => {
      process.env.TEST_NUM = 'not-a-number'
      expect(getEnvAsNumber('TEST_NUM' as any, 999)).toBe(999)
    })

    it('should return default for missing env var', () => {
      expect(getEnvAsNumber('TEST_NUM' as any, 456)).toBe(456)
    })
  })

  describe('env convenience object', () => {
    beforeEach(() => {
      process.env.DEEPSEEK_API_KEY = 'sk-test-key'
      process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
      process.env.NEXT_PUBLIC_APP_NAME = 'TestApp'
      process.env.RATE_LIMIT_MAX_REQUESTS = '50'
      process.env.ENABLE_CLAUDE_CODE_PLUGIN = 'false'
    })

    it('should provide access to deepseekApiKey', () => {
      expect(env.deepseekApiKey()).toBe('sk-test-key')
    })

    it('should provide access to appUrl', () => {
      expect(env.appUrl()).toBe('http://localhost:3000')
    })

    it('should provide access to appName with default', () => {
      delete process.env.NEXT_PUBLIC_APP_NAME
      expect(env.appName()).toBe('DemandPulse')
    })

    it('should parse numeric env vars', () => {
      expect(env.rateLimitMaxRequests()).toBe(50)
    })

    it('should parse boolean env vars', () => {
      expect(env.enableClaudeCodePlugin()).toBe(false)
    })
  })
})