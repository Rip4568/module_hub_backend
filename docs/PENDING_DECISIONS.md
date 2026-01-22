# Pending Decisions & Requirements

## File Management
- **Issue**: The current system lacks a dedicated file manager.
- **Recommendation**: It is highly recommended to use a third-party service for file storage and management to ensure scalability and reliability.
- **Examples**:
  - **AWS S3**: Industry standard, highly scalable.
  - **Cloudinary**: Excellent for image optimization and transformation.
  - **Google Cloud Storage**: Good alternative if using GCP.
- **Action Required**: Decide on a provider and implement a service wrapper.

## Pending Decisions
- **Database Indexing**: Need to review query patterns and add indices for frequently accessed fields.
- **Caching Strategy**: Consider implementing Redis for caching session data and expensive query results.
