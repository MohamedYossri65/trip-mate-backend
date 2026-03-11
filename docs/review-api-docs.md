# Review Feature Documentation

## Overview
This feature allows users to review offices after completing their bookings. Users can only review offices they have completed bookings with, ensuring authentic and verified reviews.

## Features

### 1. Create Review
- **Endpoint**: `POST /v1/reviews`
- **Authentication**: Required (USER role)
- **Description**: Create a review for an office after completing a booking
- **Validation**:
  - User must have at least one completed booking with the office
  - User can only review an office once
  - Rating must be between 1-5

**Request Body**:
```json
{
  "officeId": 1,
  "bookingId": 5,  // Optional
  "rating": 5,
  "comment": "Great service! Highly recommended."
}
```

**Response**:
```json
{
  "id": "1",
  "reviewer": {
    "id": "123",
    "name": "User"
  },
  "office": {
    "id": "456",
    "name": "Travel Agency XYZ",
    "logo": "https://example.com/logo.jpg"
  },
  "rating": 5,
  "comment": "Great service! Highly recommended.",
  "createdAt": "2026-03-11T10:00:00.000Z"
}
```

### 2. Get Office Reviews
- **Endpoint**: `GET /v1/reviews/office/:officeId`
- **Authentication**: Public (no authentication required)
- **Description**: Get all reviews for a specific office with pagination and filtering

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page
- `rating` (optional): Filter by exact rating (1-5)
- `minRating` (optional): Filter by minimum rating (1-5)

**Response**:
```json
{
  "data": [
    {
      "id": "1",
      "reviewer": {
        "id": "123",
        "name": "User",
        "avatar": null
      },
      "office": {
        "id": "456",
        "name": "Travel Agency XYZ",
        "logo": "https://example.com/logo.jpg"
      },
      "rating": 5,
      "comment": "Great service!",
      "createdAt": "2026-03-11T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### 3. Get Office Review Statistics
- **Endpoint**: `GET /v1/reviews/office/:officeId/stats`
- **Authentication**: Public
- **Description**: Get aggregated review statistics for an office

**Response**:
```json
{
  "averageRating": 4.5,
  "totalReviews": 120,
  "ratingDistribution": {
    "1": 1,
    "2": 1,
    "3": 8,
    "4": 30,
    "5": 80
  }
}
```

### 4. Get My Reviews
- **Endpoint**: `GET /v1/reviews/my`
- **Authentication**: Required (USER role)
- **Description**: Get all reviews created by the current user

**Query Parameters**:
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page
- `officeId` (optional): Filter by office ID
- `rating` (optional): Filter by rating

**Response**: Same format as "Get Office Reviews"

### 5. Get Review by ID
- **Endpoint**: `GET /v1/reviews/:reviewId`
- **Authentication**: Public
- **Description**: Get a specific review by its ID

**Response**: Same format as single review object

### 6. Update Review
- **Endpoint**: `PATCH /v1/reviews/:reviewId`
- **Authentication**: Required (USER role)
- **Description**: Update your own review
- **Validation**: User can only update their own reviews

**Request Body** (all fields optional):
```json
{
  "rating": 4,
  "comment": "Updated review comment."
}
```

**Response**: Updated review object

### 7. Delete Review
- **Endpoint**: `DELETE /v1/reviews/:reviewId`
- **Authentication**: Required (USER role)
- **Description**: Delete your own review
- **Validation**: User can only delete their own reviews

**Response**: Success message

## Business Rules

1. **Review Creation Validation**:
   - User must have completed at least one booking with the office
   - User can only create one review per office
   - Rating must be between 1-5

2. **Review Modification**:
   - Users can only update or delete their own reviews
   - Updates preserve the creation date

3. **Public Access**:
   - Anyone can view reviews and statistics
   - Only authenticated users can create reviews
   - Only the review owner can update or delete

## Database Schema

### Review Entity
```typescript
- id: bigint (Primary Key, Auto-increment)
- accountId: bigint (Foreign Key → accounts.id)
- officeId: bigint (Foreign Key → office_profiles.account_id)
- rating: number (1-5)
- comment: string (nullable)
- createdAt: Date
```

## Integration Points

1. **Booking Module**: Validates user has completed booking before allowing review
2. **Office Module**: Reviews are displayed with office details
3. **Account Module**: Links reviews to user accounts

## Future Enhancements

1. Add ability to upload images with reviews
2. Add review helpfulness voting (thumbs up/down)
3. Add office response to reviews
4. Add email notification to office when reviewed
5. Add moderation system for inappropriate reviews
6. Add verified purchase badge for reviews
