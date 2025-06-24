# Overview

The Tamanu authentication system handles user login across multiple platforms. **This document covers web authentication only** - mobile authentication, server-to-server authentication, and third-party authentication integrations are not documented here.

The web authentication system uses both central server and local facility server authentication modes with JWT tokens and Bearer authentication.

# Key Components

- `packages/facility-server/app/middleware/auth.js` - Facility server auth middleware and login handlers
- `packages/central-server/app/auth/` - Central server authentication modules
- `packages/central-server/app/auth/userMiddleware.js` - Central server user middleware
- `packages/web/app/views/LoginView.jsx` - Web login interface
- `packages/web/app/store/auth.js` - Web authentication state management

# Architecture

```
Web Login Request
    ↓
Central Server Login (if available)
    ↓ (fallback on failure)
Local Login (facility server)
    ↓
JWT Token Generation
    ↓
Bearer Token in Authorization Header
    ↓
Auth Middleware (authMiddleware/userMiddleware)
    ↓
Permission Check
    ↓
Route Handler
```

The web authentication flow:

- **Central + Local**: Try central server first, fallback to local facility server
- **JWT Bearer**: Standard JWT bearer token authentication in Authorization header

# Data Flow

1. User submits credentials via `LoginView` component
2. `centralServerLoginWithLocalFallback()` tries central server first
3. On central server failure, falls back to `localLogin()`
4. Password validated using bcrypt comparison via `comparePassword()`
5. JWT token generated with `buildToken()` containing userId and facilityId
6. Web client stores token and sends in `Authorization: Bearer <token>` header
7. `authMiddleware`/`userMiddleware` validates token on each request
8. User object attached to `req.user`, facility to `req.facilityId`

# Important Patterns

- Always use `authMiddleware` for facility server routes
- Use `userMiddleware` for central server routes
- Check permissions with `req.ability.can(action, subject)`
- Call `req.flagPermissionChecked()` to mark permission as checked
- Facility access controlled via `allowedFacilities` and `availableFacilities`
- Web login form handles remember email functionality via localStorage

# Gotchas

- Central server login can fail - always have local fallback logic
- JWT tokens contain both `userId` and `facilityId`
- Permission checking requires explicit `req.flagPermissionChecked()` call
- Facility server checks if user has access to server's configured facilities
- Session auditing automatically attached to `req.audit.access()`
- Deactivated users (`visibilityStatus !== CURRENT`) cannot authenticate
- Web client clears patient state when different user logs in

# Related Areas

- User model (`packages/shared/src/models/User.js`)
- Permissions system (`packages/shared/src/permissions/`)
- Central server connection (`packages/shared/src/services/centralServer`)

# Undocumented Areas

- Mobile authentication (`packages/mobile/App/services/auth/AuthService.ts`)
- Server-to-server authentication between facility and central servers
- Third-party authentication integrations (if any)
- Refresh token mechanisms
- Password reset flows

# Useful Commands

```bash
# Check auth configuration
grep -r "auth\." packages/*/config/

# Find login endpoints
grep -r "loginHandler\|login.*async" packages/

# Check JWT token structure
grep -r "buildToken\|decodeToken" packages/
```
