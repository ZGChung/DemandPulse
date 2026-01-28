# Mock Claude Code Integration

A simple mock service for testing the Claude Code integration without requiring actual Claude Code installation.

## Overview

This mock service simulates the Claude Code plugin detecting developer requirements and sending data to the DemandPulse API. It's designed for MVP testing and development.

## Features

1. **Mock Requirement Generation**: Generates realistic developer requirements
2. **API Integration**: Sends POST requests to `/api/requirements`
3. **Flexible Configuration**: Control count, interval, and API URL
4. **Development Endpoint**: `/api/mock/requirements` for testing without authentication
5. **Command Line Interface**: Easy to run from terminal

## Quick Start

### Using npm script:

```bash
# Send 5 mock requirements
npm run mock:claude-code -- --count=5

# Send one requirement every 2 seconds
npm run mock:claude-code -- --interval=2000

# Test with custom API URL
npm run mock:claude-code -- --api-url=http://localhost:3000 --count=3 --verbose
```

### Direct execution:

```bash
# Using npx
npx tsx scripts/mock-claude-code.ts --count=5

# Using node (JavaScript version)
node mock-claude-code.js --count=5
```

## API Endpoints

### Production Endpoint (requires auth)
- `POST /api/requirements` - Submit a requirement with authentication

### Development Mock Endpoint (no auth required)
- `POST /api/mock/requirements` - Submit a mock requirement (development only)
- `GET /api/mock/requirements?count=N` - Generate mock requirements

## Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `--count=N` | Number of mock requirements to send | 1 |
| `--interval=MS` | Interval between requests in milliseconds | 0 (all at once) |
| `--api-url=URL` | API base URL | http://localhost:3000 |
| `--verbose` | Show detailed output | false |
| `--help` | Show help message | - |

## Example Requirements Generated

The mock service generates realistic developer requirements such as:

1. **Authentication Setup**: "Add NextAuth.js authentication with Google OAuth"
2. **Bug Fixes**: "Fix database connection timeout error with retry logic"
3. **Performance Improvements**: "Optimize dashboard performance with virtual scrolling"
4. **New Tools**: "Create pre-commit hook CLI tool for code formatting"
5. **Feature Requests**: "Implement real-time notifications with WebSockets"

## Data Structure

Mock requirements follow this structure:

```typescript
{
  requirementId: "uuid",
  originalRequirement: "Original developer request text",
  summarizedRequirement: "Summarized requirement",
  context: {
    conversationId: "uuid",
    workspacePath: "/path/to/project",
    timestamp: "ISO date string"
  },
  consent: {
    consentOptions: {
      dataCollection: boolean,
      contact: boolean,
      anonymization: boolean
    },
    userProvidedEmail: "optional@email.com",
    consentedAt: "ISO date string"
  }
}
```

## Testing Workflow

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test API connection**:
   ```bash
   npm run mock:claude-code -- --count=0
   ```

3. **Send test requirements**:
   ```bash
   # Send 3 requirements
   npm run mock:claude-code -- --count=3

   # Send with 1-second intervals
   npm run mock:claude-code -- --count=5 --interval=1000 --verbose
   ```

4. **Use mock endpoint directly** (no auth):
   ```bash
   # Generate mock requirements
   curl "http://localhost:3000/api/mock/requirements?count=2"

   # Submit a mock requirement
   curl -X POST "http://localhost:3000/api/mock/requirements" \
     -H "Content-Type: application/json" \
     -d '{
       "originalRequirement": "Test requirement",
       "summarizedRequirement": "Test summary",
       "context": {
         "conversationId": "test-conv-123",
         "workspacePath": "/test/path",
         "timestamp": "2024-01-01T00:00:00Z"
       },
       "consent": {
         "consentOptions": {
           "dataCollection": true,
           "contact": false,
           "anonymization": true
         },
         "consentedAt": "2024-01-01T00:00:00Z"
       }
     }'
   ```

## Integration Testing

The mock service can be used for:

1. **End-to-end flow testing**: Simulate the complete data flow from Claude Code to database
2. **API contract validation**: Ensure the API accepts the correct data structure
3. **Rate limiting testing**: Test rate limiting behavior
4. **Error handling**: Test error responses and edge cases
5. **Performance testing**: Load test with multiple concurrent requests

## Files

- `scripts/mock-claude-code.ts` - TypeScript mock service (recommended)
- `mock-claude-code.js` - JavaScript mock service (legacy)
- `app/api/mock/requirements/route.ts` - Development mock API endpoint
- `MOCK-CLAUDE-CODE.md` - This documentation

## Notes

- The mock endpoint (`/api/mock/requirements`) is only available in development mode
- For production-like testing, use the main endpoint (`/api/requirements`) with authentication
- All mock data is randomly generated but follows realistic patterns
- The service includes basic error handling and logging