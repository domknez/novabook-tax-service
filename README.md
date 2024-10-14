# Event Service Application

This application processes sales events, tax payments, and amendments to calculate the tax position at any given point in time.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
  - [Running with Seed Data](#running-with-seed-data)
- [Running Tests](#running-tests)
- [API Endpoints](#api-endpoints)
- [Notes](#notes)
- [Observability](#observability)

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Getting Started

### Environment Variables

Create a `.env` file (you can start by copying the existing `.env.example` file and simply renaming it) in the root directory of the project to configure your environment variables. An example `.env` file:

```env
DB_HOST=db
DB_PORT=5432
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=your_db_name

# Set this variable to true if you want to run the application with seed data. This will populate the database with predefined events for testing purposes.
SEED_DATA=true
```

### Running the Application

Build and run the Docker containers:

```bash
docker compose up --build
```

Access the application:
This command will build the Docker images and start the containers defined in the `docker-compose.yml` file.

### Running with Seed Data

If you want to run the application with seed data, ensure that the SEED_DATA environment variable is set to true in your .env file.

When the application starts, it will check the SEED_DATA variable and, if true, will populate the database with seed events, including sales events, tax payments, and amendments.

## Running Tests

To run the test suite, execute the following command: `npm run test`.
This will run all the unit tests, including the edge cases, to ensure the application is functioning correctly.

## API Endpoints

The application exposes the following API endpoints:

- Ingest Endpoint:

  - `POST /transactions`: Allows a user to end sales and tax payment events to the service. It receives both `SALES` and `TAX_PAYMENT` events.

- Query Tax Position Endpoint:

  - `GET /tax-position`: Allows a user to query their tax position at any given point in time. This endpoint calculates the tax position from ingested events and any furhter user interaction..

- Amend Sale Endpoint:
  - `PATCH /sale`: Allows a user to modify an item within a sale at a specific point in time. The sevice accepts all amendments even if the sale does not exist yet.

## Notes

- **Amendments Before Sales Events**:

  - The application allows amendments to be applied to sales events that have not yet been received. This means that an amendment can exist with a date before the sales event's date. The system will correctly apply such amendments when calculating the tax position.

- **Event Ordering**:

  - Events are processed based on their dates and times. Amendments take precedence over sales events when determining the latest state of an item for a given date.

- **Validation**:

  - Currently, validation is pretty basic. It would be better to implement the validation middleware that would be handling the validation logic for the controllers.

## Observability

In this application, observability is achieved through:

- Logging with Morgan:

  - Morgan is a middleware that logs HTTP requests and responses. It provides detailed logs of incoming requests, which helps in monitoring the application's behavior and diagnosing issues.

- Why Morgan over `console.log`:
  - **Structured Logging**: Morgan provides structured logs that are easier to read and parse compared to unstructured `console.log` statements.
  - **Request Details**: Morgan automatically logs important details about each HTTP request, such as the method, URL, status code, response time, and more.
  - **Middleware Integration**: Being a middleware, it seamlessly integrates into the request-response cycle without requiring manual logging in each route handler.
  - **Customization**: Morgan allows for customizable logging formats and can be extended to log additional information if needed.

**Note**: While Morgan provides basic observability, more advanced tools should be considered for logging, metrics, and tracing in the production environment.

## Additional Information

- **Database Migrations**:
  - The application uses TypeORM for database interactions. Ensure that migrations are run to keep the database schema up to date.
- **Stopping the Application**:
  - `docker compose down`: This will stop and remove the containers.
- **Rebuilding the Application**:
  - `docker compose up --build`
- **Development**
  - Source code is mounted in the Docker container and all file changes are monitored with `nodemon` and applied automatically.
