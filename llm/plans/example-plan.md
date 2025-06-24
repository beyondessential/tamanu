# Objective

Implement user profile photo upload feature with image resizing and validation.

# Steps

1. ~~Research image upload libraries and choose between multer vs formidable~~ ✓
2. ~~Create database migration to add `profile_photo_url` column to users table~~ ✓
3. Create API endpoint `/api/users/:id/photo` for photo upload
4. Add image validation (file type, size limits, dimensions)
5. Implement image resizing to standard profile photo dimensions (200x200px)
6. Add S3/cloud storage integration for photo storage
7. Update user profile component to show photo upload UI
8. Add photo preview functionality before upload
9. Update user profile display to show uploaded photo
10. Write tests for photo upload endpoint
11. Add error handling for upload failures
12. Update API documentation

# Success Criteria

- Users can upload profile photos through the UI
- Images are automatically resized to 200x200px
- Only valid image formats (jpg, png, webp) are accepted
- File size is limited to 5MB
- Photos are stored securely in cloud storage
- All existing tests pass
- New functionality has test coverage > 80%
