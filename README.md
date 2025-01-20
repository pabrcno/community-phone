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

Used to submit call events (start/end). Expects a JSON payload with the following structure:

```
{
    "call_id": "string",
    "from": "string",
    "to": "string",
    "started": "string",
    "ended": "string (optional)"
}
```

#### Expected Outputs

- **Success Response:**

  - **Code:** 200
  - **Content:**
    ```json
    {
      "status": "ok"
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

## SSL Certificate Generation

To run the service securely, you'll need to generate SSL certificates. Follow these steps:

1. Create a directory for certificates:

   ```bash
   mkdir certs
   ```

2. Generate a private key:

   ```bash
   openssl genrsa -out certs/server.key 2048
   ```

3. Generate a certificate signing request (CSR):

   ```bash
   openssl req -new -key certs/server.key -out certs/server.csr
   ```

4. Generate a self-signed certificate:
   ```bash
   openssl x509 -req -days 365 -in certs/server.csr -signkey certs/server.key -out certs/server.crt
   ```

The certificates will be used by the service for HTTPS connections. The paths to these files should match the SSL_KEY_PATH and SSL_CERT_PATH environment variables in your .env file.

## Local Development Setup

### Node Version

This project requires Node.js version 20.6.0.

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
   - HTTPS: https://localhost:3000

3. Stop all services:
   ```bash
   docker-compose down
   ```
