# Hive API Routes

This directory contains API routes for the Hive page redesign feature.

## Endpoints

### POST /api/hives/game-score
Submit a score for the daily puzzle game.

**Request Body:**
```json
{
  "score": 100,
  "game_date": "2024-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "rank": 5
}
```

**Requirements:** 4.3, 4.4

---

### GET /api/hives/leaderboard
Get the leaderboard for a specific date.

**Query Parameters:**
- `date` (optional): YYYY-MM-DD format, defaults to today

**Response:**
```json
{
  "leaderboard": [
    {
      "user_id": "uuid",
      "display_name": "John Doe",
      "avatar_url": "https://...",
      "score": 150,
      "rank": 1
    }
  ]
}
```

**Requirements:** 4.5

---

### GET /api/hives/has-played
Check if the user has played the game for a specific date.

**Query Parameters:**
- `date` (optional): YYYY-MM-DD format, defaults to today

**Response:**
```json
{
  "has_played": true,
  "score": 100,
  "rank": 5
}
```

**Requirements:** 4.4

---

### GET /api/hives/top-subhives
Get the most popular subhives based on recent activity.

**Query Parameters:**
- `limit` (optional): Number of subhives to return (1-20, default 5)
- `days` (optional): Number of days to look back (1-30, default 7)

**Response:**
```json
{
  "subhives": [
    {
      "id": "uuid",
      "name": "Computer Science",
      "description": "Discuss CS topics",
      "member_count": 150,
      "post_count_7d": 25,
      "comment_count_7d": 100,
      "activity_score": 150
    }
  ]
}
```

**Requirements:** 5.2, 5.5

---

### GET /api/hives/feed
Get posts from joined subhives with search and filtering.

**Query Parameters:**
- `subhive_id` (optional): Filter to specific subhive
- `search` (optional): Search query
- `sort` (optional): "new" | "hot" | "top" (default "new")
- `page` (optional): Page number (default 0)
- `limit` (optional): Posts per page (1-100, default 20)

**Response:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "subforum_id": "uuid",
      "subforum_name": "Computer Science",
      "author_id": "uuid",
      "author_name": "John Doe",
      "title": "Post Title",
      "content": "Post content...",
      "is_anonymous": false,
      "vote_count": 10,
      "comment_count": 5,
      "user_vote": "upvote",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "hasMore": true,
  "total": 100
}
```

**Requirements:** 1.2, 3.1

## Database Schema

The `game_scores` table is created by migration `20240101000007_game_scores.sql`:

```sql
CREATE TABLE public.game_scores (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  game_date DATE NOT NULL,
  score INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id, game_date)
);
```

## Helper Functions

### get_user_rank(p_user_id, p_game_date)
Returns the rank of a user for a specific game date.

### get_top_subhives(p_limit, p_date_threshold)
Returns the most active subhives based on recent activity.

## Security

All endpoints require authentication. Row Level Security (RLS) policies ensure:
- Users can view all game scores (for leaderboard)
- Users can only insert their own game scores
- Game scores are immutable (no updates or deletes)
- Users can only see posts from subhives they've joined

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created (for POST requests)
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (e.g., already played today)
- `500`: Internal Server Error
