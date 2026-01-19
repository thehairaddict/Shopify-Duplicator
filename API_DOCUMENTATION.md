# API Documentation

Complete API reference for Zenith Weave Shopify Store Duplicator.

## Base URL

```
Production: https://your-backend.up.railway.app
Development: http://localhost:3000
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are obtained via login/register endpoints and are valid for 7 days.

---

## Authentication Endpoints

### Register User

**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Status Codes:**
- `200`: Success
- `400`: Validation error or email already exists
- `500`: Server error

---

### Login

**POST** `/api/auth/login`

Authenticate a user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Status Codes:**
- `200`: Success
- `401`: Invalid credentials
- `500`: Server error

---

### Logout

**POST** `/api/auth/logout`

Invalidate the current session.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `500`: Server error

---

### Get Current User

**GET** `/api/auth/me`

Get the authenticated user's information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized

---

## Store Endpoints

### List Stores

**GET** `/api/stores`

Get all stores for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "stores": [
    {
      "id": 1,
      "name": "My Source Store",
      "store_url": "mystore.myshopify.com",
      "store_type": "source",
      "created_at": "2024-01-19T10:00:00Z"
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `500`: Server error

---

### Create Store

**POST** `/api/stores`

Add a new Shopify store.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "My Store",
  "storeUrl": "mystore.myshopify.com",
  "apiKey": "your-api-key",
  "apiSecret": "your-api-secret",
  "accessToken": "your-access-token",
  "storeType": "source"
}
```

**Response:**
```json
{
  "store": {
    "id": 1,
    "name": "My Store",
    "store_url": "mystore.myshopify.com",
    "store_type": "source",
    "created_at": "2024-01-19T10:00:00Z"
  }
}
```

**Status Codes:**
- `201`: Created
- `400`: Validation error
- `401`: Unauthorized
- `500`: Server error

---

### Update Store

**PUT** `/api/stores/:id`

Update an existing store.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "storeUrl": "newstore.myshopify.com",
  "apiKey": "new-api-key",
  "apiSecret": "new-api-secret",
  "accessToken": "new-access-token",
  "storeType": "destination"
}
```

**Response:**
```json
{
  "store": {
    "id": 1,
    "name": "Updated Name",
    "store_url": "newstore.myshopify.com",
    "store_type": "destination",
    "created_at": "2024-01-19T10:00:00Z"
  }
}
```

**Status Codes:**
- `200`: Success
- `400`: Validation error
- `401`: Unauthorized
- `404`: Store not found
- `500`: Server error

---

### Delete Store

**DELETE** `/api/stores/:id`

Delete a store.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Store deleted successfully"
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `404`: Store not found
- `500`: Server error

---

### Test Store Connection

**POST** `/api/stores/:id/test`

Test the Shopify API connection for a store.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Connection successful"
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "Invalid API credentials"
}
```

**Status Codes:**
- `200`: Test completed (check success field)
- `400`: Connection failed
- `401`: Unauthorized
- `404`: Store not found
- `500`: Server error

---

## Migration Endpoints

### Start Migration

**POST** `/api/migrations/start`

Start a new migration job.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "sourceStoreId": 1,
  "destinationStoreId": 2,
  "selectedModules": {
    "theme": true,
    "products": true,
    "collections": true,
    "pages": false,
    "media": true
  }
}
```

**Response:**
```json
{
  "migration": {
    "id": 1,
    "status": "running",
    "created_at": "2024-01-19T10:00:00Z"
  }
}
```

**Status Codes:**
- `201`: Created
- `400`: Validation error
- `401`: Unauthorized
- `404`: Store not found
- `500`: Server error

---

### List Migrations

**GET** `/api/migrations`

Get all migrations for the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "migrations": [
    {
      "id": 1,
      "source_store_name": "Source Store",
      "destination_store_name": "Destination Store",
      "status": "running",
      "progress": {
        "theme": 100,
        "products": 45,
        "collections": 0
      },
      "created_at": "2024-01-19T10:00:00Z"
    }
  ]
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `500`: Server error

---

### Get Migration Details

**GET** `/api/migrations/:id`

Get detailed information about a specific migration.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "migration": {
    "id": 1,
    "source_store_name": "Source Store",
    "source_store_url": "source.myshopify.com",
    "destination_store_name": "Destination Store",
    "destination_store_url": "dest.myshopify.com",
    "status": "running",
    "selected_modules": {
      "theme": true,
      "products": true,
      "collections": true
    },
    "progress": {
      "theme": 100,
      "products": 45,
      "collections": 0
    },
    "total_items": {
      "theme": 1,
      "products": 150,
      "collections": 20
    },
    "processed_items": {
      "theme": 1,
      "products": 68,
      "collections": 0
    },
    "errors": [],
    "started_at": "2024-01-19T10:00:00Z",
    "created_at": "2024-01-19T09:55:00Z"
  }
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `404`: Migration not found
- `500`: Server error

---

### Pause Migration

**PUT** `/api/migrations/:id/pause`

Pause a running migration.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "migration": {
    "id": 1,
    "status": "paused"
  }
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `404`: Migration not found or cannot be paused
- `500`: Server error

---

### Resume Migration

**PUT** `/api/migrations/:id/resume`

Resume a paused migration.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "migration": {
    "id": 1,
    "status": "running"
  }
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `404`: Migration not found or cannot be resumed
- `500`: Server error

---

### Cancel Migration

**DELETE** `/api/migrations/:id/cancel`

Cancel a migration.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "migration": {
    "id": 1,
    "status": "cancelled"
  }
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `404`: Migration not found or cannot be cancelled
- `500`: Server error

---

### Get Migration Logs

**GET** `/api/migrations/:id/logs`

Get logs for a specific migration.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit` (optional): Number of logs to return (default: 100)
- `offset` (optional): Offset for pagination (default: 0)

**Response:**
```json
{
  "logs": [
    {
      "id": 1,
      "migration_id": 1,
      "module": "products",
      "level": "info",
      "message": "Migrated 10/150 products",
      "metadata": {},
      "created_at": "2024-01-19T10:05:00Z"
    }
  ],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

**Status Codes:**
- `200`: Success
- `401`: Unauthorized
- `404`: Migration not found
- `500`: Server error

---

### Export Migration Report

**GET** `/api/migrations/:id/export`

Download a complete migration report as JSON.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "migration": {
    "id": 1,
    "status": "completed",
    "source_store": {
      "name": "Source Store",
      "url": "source.myshopify.com"
    },
    "destination_store": {
      "name": "Destination Store",
      "url": "dest.myshopify.com"
    },
    "selected_modules": {},
    "progress": {},
    "started_at": "2024-01-19T10:00:00Z",
    "completed_at": "2024-01-19T11:30:00Z"
  },
  "summary": [
    {
      "module": "products",
      "status": "completed",
      "count": 150
    }
  ],
  "logs": [],
  "errors": []
}
```

**Status Codes:**
- `200`: Success (file download)
- `401`: Unauthorized
- `404`: Migration not found
- `500`: Server error

---

## WebSocket Events

Connect to: `ws://your-backend-url` or `wss://your-backend-url`

### Client → Server Events

#### Authenticate
```javascript
socket.emit('authenticate', { userId: 1 });
```

#### Subscribe to Migration
```javascript
socket.emit('subscribe:migration', migrationId);
```

#### Unsubscribe from Migration
```javascript
socket.emit('unsubscribe:migration', migrationId);
```

### Server → Client Events

#### Progress Update
```javascript
socket.on('migration:progress:1', (data) => {
  // data = {
  //   module: 'products',
  //   percentage: 45,
  //   processed: 68,
  //   total: 150,
  //   allProgress: { theme: 100, products: 45 },
  //   allProcessed: { theme: 1, products: 68 },
  //   allTotals: { theme: 1, products: 150 }
  // }
});
```

#### New Log
```javascript
socket.on('migration:log:1', (log) => {
  // log = {
  //   module: 'products',
  //   level: 'info',
  //   message: 'Migrated product: T-Shirt',
  //   created_at: '2024-01-19T10:05:00Z'
  // }
});
```

#### Migration Complete
```javascript
socket.on('migration:complete:1', (data) => {
  // data = {
  //   migrationId: 1,
  //   completedAt: '2024-01-19T11:30:00Z'
  // }
});
```

#### Migration Error
```javascript
socket.on('migration:error:1', (error) => {
  // error = {
  //   migrationId: 1,
  //   error: 'Failed to migrate product',
  //   timestamp: '2024-01-19T10:15:00Z'
  // }
});
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": "Error message",
  "details": []  // Optional validation details
}
```

### Common Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing or invalid token)
- `404`: Not Found
- `500`: Internal Server Error

---

## Rate Limiting

The API implements rate limiting to protect against abuse:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642598400
```

---

## Shopify API Integration

The backend handles Shopify API rate limiting automatically:

- **REST API**: 2 requests/second (burst: 40)
- **GraphQL API**: 50 cost points/second
- Automatic retry with exponential backoff on 429 errors
- Queue-based processing for reliability

---

## Support

For API support, contact:
- Email: hi@zenithweave.com
- Phone: +201011400020
