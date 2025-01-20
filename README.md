# Call Tracking Service

A service for tracking phone calls, recording their start and end times, and providing metrics about unfinished calls.

## Features

- Track call start events with caller and recipient information
- Record call end events
- Query unfinished calls from the last 2 hours
- Find stale unfinished calls
- PostgreSQL persistence
- Error handling for invalid events and database operations

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
