# AuthService Tests

This directory contains comprehensive tests for the AuthService, focusing on case-insensitive username functionality for offline login.

## Issue Context

**Linear Issue NASS-1782**: Users were unable to login to Tamanu during internet outages due to case-sensitive username matching. This caused significant disruption during extended internet blackouts in locations like Palau.

## Solution

Implemented case-insensitive email lookup for both `localSignIn` and `saveLocalUser` methods using TypeORM's `Raw` SQL function.

## Test Coverage

### Unit Tests (`AuthService.test.ts`)

Comprehensive unit tests covering:

1. **Case Insensitive Email Lookup**
   - Verifies Raw SQL function usage for case-insensitive comparison
   - Tests uppercase, lowercase, and mixed case email variations
   - Validates SQL generation (`LOWER(email) = LOWER(:email)`)

2. **Error Handling**
   - No facility configured
   - User without local password
   - User not found
   - Password mismatch
   - Facility access denied

3. **saveLocalUser Method**
   - Case insensitive user lookup to prevent duplicates
   - Proper handling of existing vs new users
   - Asynchronous password hashing verification
   - Edge cases (undefined email, mixed case variations)

4. **Integration Scenarios**
   - Internet outage simulation with different email cases
   - Security validation (password still case-sensitive)
   - Online-to-offline user flow

### Integration Tests (`AuthService.integration.test.ts`)

Real database tests verifying:

1. **Database-Level Case Insensitive Behavior**
   - Actual TypeORM Raw query execution
   - Prevention of duplicate user creation
   - Email case preservation in database

2. **Real World Scenarios**
   - User signs in online with `User@Example.Com`
   - Later signs in offline with `user@example.com`
   - Verifies same user is found and used

3. **Password Hashing Integration**
   - Asynchronous bcrypt hashing
   - Local password storage and retrieval

## Key Changes Made

### AuthService.ts

1. **Added TypeORM Raw import**
   ```typescript
   import { Raw } from 'typeorm';
   ```

2. **Updated localSignIn method**
   ```typescript
   const user = await User.findOne({
     where: {
       email: Raw(alias => `LOWER(${alias}) = LOWER(:email)`, { email }),
       visibilityStatus: VisibilityStatus.Current,
     },
   });
   ```

3. **Updated saveLocalUser method**
   ```typescript
   let user = await this.models.User.findOne({
     where: {
       email: Raw(alias => `LOWER(${alias}) = LOWER(:email)`, { email: userData.email }),
     },
   });
   ```

## Running Tests

```bash
# Unit tests
npm test -- --testPathPattern=AuthService.test.ts

# Integration tests  
npm test -- --testPathPattern=AuthService.integration.test.ts

# All AuthService tests
npm test -- --testPathPattern=AuthService
```

## Important Notes

1. **Security**: Email lookup is case-insensitive, but passwords remain case-sensitive for security
2. **Database**: Original email case is preserved in the database
3. **Compatibility**: Works with existing user data without migration needed
4. **Performance**: Uses standard SQL LOWER() function for efficient case-insensitive comparison

## Test Scenarios Covered

- ✅ Uppercase email: `USER@EXAMPLE.COM`
- ✅ Lowercase email: `user@example.com`  
- ✅ Mixed case email: `User@Example.Com`
- ✅ Random case email: `uSeR@eXaMpLe.CoM`
- ✅ Duplicate prevention across cases
- ✅ Password security maintained
- ✅ Error handling for edge cases
- ✅ Real database integration
- ✅ Async password hashing
- ✅ Online-to-offline user flow