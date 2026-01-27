describe('Test setup verification', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should have environment variables set', () => {
    expect(process.env.NEXT_PUBLIC_APP_URL).toBe('http://localhost:3000')
    expect(process.env.DEEPSEEK_API_KEY).toBe('test-api-key')
  })
})