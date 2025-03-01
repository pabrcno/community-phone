# Call Tracking Service

A service for tracking phone calls, recording their start and end times, and providing metrics about Stale calls.

## Features

- Track call start events with caller and recipient information
- Record call end events
- Find stale unfinished calls
- PostgreSQL persistence
- Error handling for invalid events and database operations

## Testing the API

http://community-phone.sliplane.app

The service exposes two main endpoints for tracking calls and retrieving metrics:

### POST /events

Used to submit call events (start/end). Expects a JSON payload with one of the following structures:

For call start:

```
{
"call_id": "string",
"started": "ISO 8601 timestamp",
"from": "string",
"to": "string"
}
```

For call end:

```
{
"call_id": "string",
"ended": "ISO 8601 timestamp",
"from": "string",
"to": "string"
}
```

#### Expected Outputs

- **Success Response:**

  - **Code:** 200
  - **Content:**

    ```json
    {
      "status": "ok",
     "call": {
        "id": number,
        "callId": string,
        "from": string,
        "to": string,
        "started": string,
        "ended?": string,
        "duration?": number,
      }
    }
    ```

- **Error Response:**
  - **Code:** 400
  - **Content:**
    ```json
    {
      "error": "Bad Request"
    }
    ```
  - **Code:** 500
  - **Content:**
    ```json
    {
      "error": "Internal Server Error"
    }
    ```

### GET /metrics

Used to retrieve metrics about the call events. The response will include the count of the latest Stale calls. The response structure is as follows:

#### Expected Outputs

- **Success Response:**

  - **Code:** 200
  - **Content:**
    ```json
    {
      "latestStaleCalls": "number"
    }
    ```

- **Error Response:**
  - **Code:** 500
  - **Content:**
    ```json
    {
      "error": "Failed to retrieve metrics"
    }
    ```

## Local Development Setup

### Node Version

This project requires Node.js version 23.6.0.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Modify the values in `.env` if needed

3. Start PostgreSQL:

   ```bash
   docker-compose up postgres -d
   ```

4. Run the service:

   Development mode with auto-reload:

   ```bash
   npm start
   ```

   Run tests:

   ```bash
   npm test
   ```

## Docker Setup

To run the entire application stack in Docker:

1. Build and start all services:

   ```bash
   docker-compose up -d
   ```

2. The application will be available at:

   - HTTP: http://localhost:3000

3. Stop all services:
   ```bash
   docker-compose down
   ```
