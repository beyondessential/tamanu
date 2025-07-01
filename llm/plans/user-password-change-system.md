# User Password Change System

## Overview

Users need the ability to change their own passwords through a self-service interface accessible from both facility and central servers. This requires implementing a user profile system with password change functionality and ensuring proper bidirectional synchronisation of user data.

## Requirements

- **Self-Service Password Change**: Users can update their own passwords without admin intervention
- **Cross-Platform Access**: Available in both facility and central server interfaces
- **Secure Authentication**: Current password verification before allowing changes
- **Bidirectional Sync**: User password changes sync between facility and central servers
- **User Profile Interface**: Dedicated profile view accessible from main navigation
- **Validation**: Strong password requirements and confirmation matching

## Approach

We'll extend the existing authentication system with a new authenticated password change endpoint, create a user profile interface accessible via the sidebar kebab menu, and modify the User model to support bidirectional synchronisation. The solution leverages existing UI patterns and authentication infrastructure.

## Implementation Steps

### Phase 1: Backend Foundation

1. **Update User Model Sync Direction**
   - Change `tamanu/packages/database/src/models/User.ts` sync direction from `PULL_FROM_CENTRAL` to `BIDIRECTIONAL`
   - Test bidirectional sync functionality works correctly
   - Verify no conflicts with existing user management

2. **Create Authenticated Password Change Endpoint**
   - Add new route `POST /api/user/change-password` in both:
     - `tamanu/packages/central-server/app/routes/`
     - `tamanu/packages/facility-server/app/routes/`
   - Require authentication (unlike reset password which uses tokens)
   - Validate current password before allowing change
   - Accept `{ currentPassword, newPassword, confirmPassword }` payload
   - Return appropriate error messages for validation failures

3. **Update API Client**
   - Add `changePasswordAuthenticated` method to `tamanu/packages/api-client/src/TamanuApi.js`
   - Distinguish from existing `changePassword` method (which is for resets)
   - Ensure proper error handling and response parsing

### Phase 2: Frontend Profile System

4. **Create User Profile View**
   - Build `tamanu/packages/web/app/views/UserProfileView.jsx` with user information display
   - Include basic user details (name, email, role) in read-only format
   - Add "Change Password" button as primary action
   - Design responsive layout that works in both facility and central contexts

5. **Implement Password Change Modal**
   - Create `tamanu/packages/web/app/components/UserProfile/ChangePasswordModal.jsx`
   - Include form fields: Current Password, New Password, Confirm New Password
   - Add client-side validation for password requirements and confirmation matching
   - Show appropriate success/error messages
   - Use existing modal patterns and styling

6. **Create User Profile Components**
   - Build `tamanu/packages/web/app/components/UserProfile/` component directory
   - `UserProfileDisplay.jsx` - shows user information
   - `PasswordStrengthIndicator.jsx` - visual feedback for password strength
   - Follow existing component patterns and use TranslatedText for internationalisation

### Phase 3: Navigation Integration

7. **Add Profile Link to Kebab Menu**
   - Update `tamanu/packages/web/app/components/Sidebar/KebabMenu.jsx`
   - Add "User Profile" menu item between language change and support centre
   - Use appropriate routing to open profile view
   - Ensure proper permissions and availability

8. **Implement Profile Routing**
   - Add routes to both facility and central routing files
   - Ensure profile is accessible from both contexts
   - Add route guards to verify user authentication
   - Handle navigation properly when modal is open

### Phase 4: Backend Route Integration

9. **Add User Profile API Routes for Central Server**
   - Create `tamanu/packages/central-server/app/routes/user.js` for user-specific operations
   - Include GET endpoint for current user profile data
   - Add proper middleware for authentication and permissions
   - Follow existing route patterns and error handling

10. **Add User Profile API Routes for Facility Server**
    - Create `tamanu/packages/facility-server/app/routes/user.js` for user-specific operations
    - Mirror the central server implementation
    - Include GET endpoint for current user profile data
    - Add proper middleware for authentication and permissions
    - Follow existing route patterns and error handling

11. **Integrate Routes with Main Routers**
    - Update `tamanu/packages/central-server/app/routes/index.js` to include user routes
    - Update `tamanu/packages/facility-server/app/routes/index.js` to include user routes
    - Ensure proper path mounting and middleware application on both servers
    - Test route accessibility and authentication requirements on both servers

### Phase 5: Testing and Validation

12. **Add Password Validation Rules**
    - Implement password strength requirements (length, complexity)
    - Add validation in both frontend and backend
    - Provide clear user feedback for password requirements
    - Ensure consistent validation between client and server

13. **Create Form Validation**
    - Add real-time validation feedback in password change modal
    - Implement confirmation password matching
    - Show helpful error messages for validation failures
    - Use existing form validation patterns from the codebase

## Dependencies

- **User Model Changes**: Must be deployed to all servers simultaneously
- **Database Migration**: May need migration if User table structure changes
- **Sync Testing**: Requires testing with both facility and central servers
- **Authentication System**: Depends on existing auth middleware and session management
- **Dual Server Routes**: Both central and facility servers must have identical user route implementations

## Risks

- **Sync Conflicts**: Bidirectional sync could cause conflicts if multiple servers modify the same user
- **Session Management**: Password changes might invalidate current sessions
- **Migration Complexity**: Changing sync direction might require careful migration planning
- **Security**: Need to ensure current password verification is robust

## Testing Strategy

- **Unit Tests**: Password validation, API endpoints on both servers, component rendering
- **Integration Tests**: Full password change flow on both central and facility servers, sync verification
- **E2E Tests**: User journey from profile access through password change on both server types
- **Security Testing**: Authentication bypass attempts, password validation edge cases
- **Sync Testing**: Multi-server scenarios with concurrent changes
- **Cross-Server Testing**: Ensure password changes work identically on both central and facility servers

## Rollout Plan

1. **Backend First**: Deploy User model changes and API endpoints
2. **Frontend Components**: Add profile view and password change modal
3. **Navigation Integration**: Add kebab menu links and routing
4. **Feature Flag**: Consider feature flag for controlled rollout
5. **Documentation**: Update user guides and technical documentation
6. **Training**: Brief support team on new self-service capability