# CI/CD Debugging Memory

## Issues Fixed

### 1. Gitleaks Configuration Issues
**Problem**: Gitleaks was detecting false positives in test files and documentation
**Solution**: 
- Updated `.gitleaks.toml` to exclude test files
- Added proper regex patterns for allowlist
- Added `DEPLOYMENT.md` to allowlist since it contains documentation about `.env` files

### 2. Dependency Review Action Issue
**Problem**: `actions/dependency-review-action@v3` requires pull request context
**Solution**: Added condition `if: github.event_name == 'pull_request'` to only run on PRs

### 3. Vercel Deployment Issues
**Problem**: "Unexpected error. Please try again later." during Vercel deployment
**Root Cause**: Vercel was trying to rebuild the application but failing
**Debugging Steps**:
1. Added `--debug` flag to Vercel deployment for more verbose output
2. Discovered Vercel was configured to run `npm run build` during deployment
3. Tried `--skip-build` flag (not supported by Vercel CLI)
4. Realized Vercel expects to build the application itself

**Solution**: Changed from uploading pre-built artifacts (.next directory) to uploading source code
- Build job now uploads source code (excluding .next, node_modules, .git)
- Deploy job downloads source code and lets Vercel build it

## Current CI/CD Pipeline Status

### Jobs:
1. ✅ **test**: All tests pass
2. ✅ **security**: Gitleaks passes with proper configuration
3. ✅ **build**: Build completes successfully, uploads source code
4. ⚠️ **deploy**: Previously failing with Vercel "Unexpected error"

### Latest Changes:
- Upload source code instead of build artifacts
- Let Vercel handle the build process
- Remove unsupported `--skip-build` flag

## Key Learnings

1. **Vercel Deployment Model**: Vercel prefers to build applications itself rather than using pre-built artifacts
2. **Gitleaks Configuration**: Need careful allowlist configuration to avoid false positives in test files
3. **GitHub Actions**: Some actions (like dependency-review) require specific event contexts
4. **Debugging Approach**: Use `--debug` flags and add verification steps to understand failures

## Files Modified

1. `.gitleaks.toml` - Fixed allowlist configuration
2. `.github/workflows/ci.yml` - Updated deployment strategy
   - Changed from build artifacts to source code upload
   - Fixed dependency review action condition
   - Added debugging steps

## Next Steps
Monitor the current CI/CD run to see if the source code deployment approach resolves the Vercel deployment issue.