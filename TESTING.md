# DemandPulse Testing Strategy

## Overview

This document outlines the testing strategy for DemandPulse, covering unit tests, integration tests, and end-to-end testing.

## Test Types

### 1. Unit Tests

- **Location**: `__tests__/` directories
- **Framework**: Jest
- **Coverage**: Services, utilities, components

### 2. Integration Tests

- **API Tests**: Verify API endpoints work correctly
- **Database Tests**: Test database operations (when database is available)
- **Auth Tests**: Test authentication flow

### 3. End-to-End Tests

- **Full Data Flow**: Claude Code → API → Database → Dashboard
- **Mock Testing**: Using mock services when external dependencies unavailable

## Test Environment Setup

### Prerequisites

```bash
# Install dependencies
npm install

# Set up test environment
cp .env.example .env.test

# For database testing (optional)
# DATABASE_URL=file:./test.db
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## End-to-End Data Flow Testing

### Test Scenario: Requirement Collection & Display

1. **Requirement Detection**: Mock Claude Code plugin detects a requirement
2. **API Submission**: Requirement sent to `/api/requirements`
3. **Database Storage**: Requirement stored in database (or mock storage)
4. **Dashboard Display**: Requirement appears in dashboard statistics and recent requirements

### Test Scripts

#### 1. Mock Integration Test

```bash
# Test mock Claude Code integration
npm run mock:claude-code -- --count=3 --verbose

# Expected output:
# ✅ Connected to API
# ✅ Submitted requirement 1/3
# ✅ Submitted requirement 2/3
# ✅ Submitted requirement 3/3
# 🎉 All requirements submitted successfully
```

#### 2. API Endpoint Tests

```bash
# Test API health
curl http://localhost:3000/api/health

# Test requirements API (GET)
curl http://localhost:3000/api/requirements

# Test requirements API (POST - requires auth)
curl -X POST http://localhost:3000/api/requirements \
  -H "Content-Type: application/json" \
  -d '{
    "requirementId": "test_001",
    "originalRequirement": "Test requirement",
    "summarizedRequirement": "Test",
    "context": {
      "conversationId": "test_conv",
      "workspacePath": "/test",
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

#### 3. Dashboard Component Tests

- Manual verification: Visit `http://localhost:3000`
- Check statistics display numbers
- Verify recent requirements table shows data
- Test filtering and pagination

### Automated Test Script

See `scripts/test-e2e-flow.js` for automated end-to-end testing.

## Mock Services for Testing

### 1. Mock Claude Code Integration

- **File**: `scripts/mock-claude-code.ts`
- **Purpose**: Simulate Claude Code plugin behavior
- **Usage**: `npm run mock:claude-code -- --count=5`

### 2. Mock Database Service

- **Fallback**: Dashboard components use mock data when API fails
- **Purpose**: Allow frontend testing without database
- **Implementation**: See `components/requirement-stats.tsx` and `components/recent-requirements.tsx`

### 3. Mock API Endpoints

- **Location**: `app/api/mock/`
- **Purpose**: Test API integration without authentication
- **Endpoints**:
  - `POST /api/mock/requirements` - Submit mock requirement
  - `GET /api/mock/requirements` - Generate mock requirements

## Test Data Management

### Sample Requirements

The system includes sample requirements for testing:

```typescript
const sampleRequirements = [
  {
    id: "req_001",
    originalRequirement: "Need real-time dashboard for AI model monitoring",
    summarizedRequirement: "Real-time AI dashboard",
    category: "Data Visualization",
    status: "processed",
    detectedAt: "1 hour ago",
  },
  // ... more samples
];
```

### Test User Accounts

- **Mock User**: Used for API testing without real authentication
- **Test Credentials**: Stored in test environment only

## CI/CD Integration

### GitHub Actions

Tests run automatically on every push:

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm test
      - run: npm run build
```

### Test Coverage Reporting

- Coverage reports generated with Jest
- Uploaded to coverage service (if configured)
- Minimum coverage: 80% (goal)

## Testing Without Database

### Current Limitation

Due to Prisma 7.3.0 configuration issues with SQLite, database tests may fail.

### Workaround

1. **Use Mock Data**: Dashboard components fall back to mock data
2. **Test API Logic**: Focus on API request/response validation
3. **Manual Testing**: Verify UI components work correctly

### Future Improvement

- Fix Prisma configuration for SQLite testing
- Use in-memory database for tests
- Implement proper database mocking

## Security Testing

### Input Validation Tests

- Verify API endpoints reject invalid input
- Test for SQL injection prevention
- Test for XSS protection

### Authentication Tests

- Verify protected routes require auth
- Test rate limiting
- Test session management

### Privacy Compliance Tests

- Verify consent tracking works
- Test data anonymization
- Verify data retention policies

## Performance Testing

### API Performance

- Response time < 200ms for API endpoints
- Concurrent request handling
- Database query optimization

### Frontend Performance

- Page load time < 3 seconds
- Component rendering performance
- Bundle size optimization

## Manual Testing Checklist

### Setup Verification

- [ ] Application builds successfully
- [ ] Development server starts
- [ ] Dashboard loads without errors
- [ ] API endpoints respond

### Feature Testing

- [ ] Dashboard displays statistics
- [ ] Recent requirements table works
- [ ] Mock Claude Code integration works
- [ ] API accepts mock requirements
- [ ] Error handling works correctly

### Security Testing

- [ ] CORS headers present
- [ ] Security headers configured
- [ ] Input validation works
- [ ] Rate limiting active

## Troubleshooting Test Failures

### Common Issues

1. **Database Connection Failed**

   ```
   Error: Database connection failed
   ```

   **Solution**: Use mock data or fix database configuration

2. **Authentication Required**

   ```
   Error: Authentication required
   ```

   **Solution**: Use mock endpoints or set up test authentication

3. **Build Failures**
   ```
   Error: Failed to build
   ```
   **Solution**: Check environment variables and dependencies

### Debugging Tips

```bash
# Increase verbosity
npm run mock:claude-code -- --verbose

# Check API responses
curl -v http://localhost:3000/api/health

# Examine test logs
npm test -- --verbose

# Check browser console for frontend errors
```

## Future Testing Improvements

### Planned Enhancements

1. **Cypress E2E Tests**: Browser automation for UI testing
2. **Load Testing**: Simulate multiple concurrent users
3. **API Contract Tests**: Verify API stability
4. **Visual Regression Tests**: Detect UI changes

### Test Infrastructure

1. **Dockerized Test Environment**: Consistent testing across environments
2. **Test Data Factory**: Generate realistic test data
3. **Performance Benchmarking**: Track performance over time

---

_Last updated: January 2026_
