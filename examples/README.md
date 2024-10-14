# Examples

This document provides a step-by-step guide to manually test the application starting from a clean database. Each step includes:

- **The HTTP request** (method, endpoint, headers, body).
- **Expected response** from the server.
- **Explanation** of what's being tested and how the expected result is calculated.

---

## **Prerequisites**

- **Base URL:** Assuming the application is running locally on port `3000`, the base URL is `http://localhost:3000`.
- **Content-Type:** All POST and PATCH requests should include the header `Content-Type: application/json`.

---

## Step 1: Query Tax Position When No Events Are Present

Request:

```http
GET /tax-position?date=2024-02-22T08:00:00Z HTTP/1.1
Host: localhost:3000
```

Expected response:

```json
{
  "date": "2024-02-22T08:00:00.000Z",
  "taxPosition": 0
}
```

Explanation: Since the database is empty (no sales events or tax payments), the tax position is 0.

## Step 2: Add a Tax Payment Event

Request:

```http
POST /transactions HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "eventType": "TAX_PAYMENT",
  "date": "2024-02-22T09:00:00Z",
  "amount": 500
}
```

Expected Response:

```
    Status Code: 202 Accepted
    Body: Empty
```

Explanation:

- Action: Adds a tax payment of 500 at 2024-02-22T09:00:00Z.
- Effect: The tax position will decrease by 500 because of this payment.

## Step 3: Query Tax Position After the Tax Payment Event

Request:

```http

GET /tax-position?date=2024-02-22T09:30:00Z HTTP/1.1
Host: localhost:3000
```

Expected Response:

```json
{
  "date": "2024-02-22T09:30:00.000Z",
  "taxPosition": -500
}
```

Explanation

- Tax Position Calculation:
  - Total Tax from Sales: 0 (no sales events yet).
  - Total Tax Payments: 500.
  - Tax Position: 0 - 500 = -500.
    - Interpretation: The company has overpaid 500 in taxes.

## Step 4: Add a Sales Event

Request:

```http
POST /transactions HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "eventType": "SALES",
  "date": "2024-02-22T10:00:00Z",
  "invoiceId": "7dc7e1f1-4331-4650-8740-60058621f449",
  "items": [
    {
      "itemId": "52b9ebd5-4015-48ae-a368-ff51563f40e4",
      "cost": 1000,
      "taxRate": 0.2
    },
    {
      "itemId": "80f4d3b9-0299-40ec-9c22-0730481f02d6",
      "cost": 2000,
      "taxRate": 0.2
    }
  ]
}
```

Expected Response:

```
    Status Code: 202 Accepted
    Body: Empty
```

Explanation:

- Action: Records a sales event with two items.
- Effect: Increases the tax liability due to the sales.

## Step 5: Query Tax Position After the Sales Event

Request:

```http
GET /tax-position?date=2024-02-22T11:00:00Z HTTP/1.1
Host: localhost:3000
```

Expected Response:

```json
{
  "date": "2024-02-22T11:00:00.000Z",
  "taxPosition": 100
}
```

Explanation:

- Tax Position Calculation:
  - Total Tax from Sales:
    - Item 001: 1000 \* 0.2 = 200
    - Item 002: 2000 \* 0.2 = 400
    - Total Sales Tax: 200 + 400 = 600
  - Total Tax Payments: 500
  - Tax Position: 600 - 500 = 100
- Interpretation: The company owes 100 in taxes.

## Step 6: Add a Second Sales Event

Request

```http
POST /transactions HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "eventType": "SALES",
  "date": "2024-02-23T12:00:00Z",
  "invoiceId": "a8a9e8fb-1a5f-4112-8ac7-1694d7e2354d",
  "items": [
    {
      "itemId": "e511e143-f298-4f1d-afb6-75f8ab6828ce",
      "cost": 1500,
      "taxRate": 0.1
    }
  ]
}
```

Expected Response:

```
    Status Code: 202 Accepted
    Body: Empty
```

Explanation:

- Action: Adds another sales event with one item.
- Effect: Increases the tax liability.

## Step 7: Query Tax Position After the Second Sales Event

Request:

```http
GET /tax-position?date=2024-02-23T13:00:00Z HTTP/1.1
Host: localhost:3000
```

Expected Response:

```json
{
  "date": "2024-02-23T13:00:00.000Z",
  "taxPosition": 250
}
```

Explanation:

- Tax Position Calculation:
  - Previous Sales Tax: 600 (from previous calculation).
  - New Sales Tax:
    - Item 003: 1500 \* 0.1 = 150
  - Total Sales Tax: 600 + 150 = 750
  - Total Tax Payments: 500
  - Tax Position: 750 - 500 = 250
- Interpretation: The company now owes 250 in taxes.

## Step 8: Add an Amendment to the First Sales Event

Request

```http
PATCH /sale HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "date": "2024-02-23T10:00:00Z",
  "invoiceId": "7dc7e1f1-4331-4650-8740-60058621f449",
  "itemId": "80f4d3b9-0299-40ec-9c22-0730481f02d6",
  "cost": 1800,
  "taxRate": 0.17
}
```

Expected Response:

```
    Status Code: 202 Accepted
    Body: Empty
```

Explanation:

- Action: Amends the cost and tax rate of 80f4d3b9-0299-40ec-9c22-0730481f02d6 in 7dc7e1f1-4331-4650-8740-60058621f449.
- Effect: Adjusts the tax liability for that item.

## Step 9: Query Tax Position After the Amendment

Request:

```http
GET /tax-position?date=2024-02-23T13:00:00Z HTTP/1.1
Host: localhost:3000
```

Expected Response:

```json
{
  "date": "2024-02-23T13:00:00.000Z",
  "taxPosition": 156
}
```

Explanation:

- Tax Position Calculation:
  - Item 001 Tax: 1000 \* 0.2 = 200
  - Item 002 Tax (Amended): 1800 \* 0.17 = 306
  - Item 003 Tax: 1500 \* 0.1 = 150
  - Total Sales Tax: 200 + 306 + 150 = 656
  - Total Tax Payments: 500
  - Tax Position: 656 - 500 = 156
- Interpretation: The amendment reduced the tax liability, so the company now owes 156.

## Step 10: Add a Second Tax Payment

Request:

```http
POST /transactions HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "eventType": "TAX_PAYMENT",
  "date": "2024-02-24T14:00:00Z",
  "amount": 1000
}
```

Expected Response:

```
    Status Code: 202 Accepted
    Body: Empty
```

Explanation:

- Action: Records an additional tax payment of 1000.
- Effect: Decreases the tax position further.

## Step 11: Query Tax Position Before the Third Sales Event

Request:

```http
GET /tax-position?date=2024-02-24T14:30:00Z HTTP/1.1
Host: localhost:3000
```

Expected Response:

```json
{
  "date": "2024-02-24T14:30:00.000Z",
  "taxPosition": -844
}
```

Explanation:

- Tax Position Calculation:
  - Total Sales Tax: 656 (no new sales events).
  - Total Tax Payments: 500 + 1000 = 1500
  - Tax Position: 656 - 1500 = -844
- Interpretation: The company has overpaid 844 in taxes.

## Step 12: Add a Third Sales Event

Request:

```http
POST /transactions HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "eventType": "SALES",
  "date": "2024-02-24T15:00:00Z",
  "invoiceId": "61c8b37b-e09a-4acc-8fcc-0c8428b13961",
  "items": [
    {
      "itemId": "71a07026-d075-438e-9862-ca061fb682a8",
      "cost": 2500,
      "taxRate": 0.15
    },
    {
      "itemId": "91009206-d745-4d56-b977-3fb1031c21cf",
      "cost": 3000,
      "taxRate": 0.18
    }
  ]
}
```

Expected Response:

```
    Status Code: 202 Accepted
    Body: Empty
```

Explanation:

- Action: Adds a new sales event with two items.
- Effect: Increases the tax liability.

## Step 13: Add an Amendment to the Third Sales Event

Request:

```http
PATCH /sale HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
"date": "2024-02-24T16:30:00Z",
  "invoiceId": "61c8b37b-e09a-4acc-8fcc-0c8428b13961",
  "itemId": "91009206-d745-4d56-b977-3fb1031c21cf",
  "cost": 2800,
  "taxRate": 0.15
}
```

Expected Response:

```
    Status Code: 202 Accepted
    Body: Empty
```

Explanation:

- Action: Amends 91009206-d745-4d56-b977-3fb1031c21cf in 61c8b37b-e09a-4acc-8fcc-0c8428b13961.
- Effect: Adjusts the tax liability for that item.

## Step 14: Query Tax Position After the Third Sales Event and Amendment

Request:

```http
GET /tax-position?date=2024-02-24T17:00:00Z HTTP/1.1
Host: localhost:3000
```

Expected Response:

```json
{
  "date": "2024-02-24T17:00:00.000Z",
  "taxPosition": -49
}
```

Explanation:

- Tax Position Calculation:
  - Previous Sales Tax: 656
  - New Sales Tax:
    - Item 004 Tax: 2500 \* 0.15 = 375
    - Item 005 Tax (Amended): 2800 \* 0.15 = 420
  - Total Sales Tax: 656 + 375 + 420 = 1451
  - Total Tax Payments: 1500
  - Tax Position: 1451 - 1500 = -49
- Interpretation: The company has overpaid 49 in taxes.

## Step 15: Add an Amendment to a Non-Existent Sales Event

Request:

```http
PATCH /sale HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "date": "2024-02-25T10:00:00Z",
  "invoiceId": "non-existent-invoice",
  "itemId": "non-existent-item",
  "cost": 500,
  "taxRate": 0.1
}
```

Expected Response:

```
    Status Code: 202 Accepted
    Body: Empty
```

Explanation:

- Action: Adds an amendment for an invoice and item that do not exist.
- Effect: Since amendments are treated as events, they will create new entries even if the original sales event doesn't exist.

## Step 16: Query Tax Position After Amendment to Non-Existent Sales Event

Request:

```http
GET /tax-position?date=2024-02-25T11:00:00Z HTTP/1.1
Host: localhost:3000
```

Expected Response:

```json
{
  "date": "2024-02-25T11:00:00.000Z",
  "taxPosition": 1
}
```

Explanation:

- Tax from Amendment: 500 \* 0.1 = 50
- Previous Tax Position: -49 (from previous calculation)
- New Tax Position: 1451 + 50 - 1500 = 1
- Interpretation: The company now owes 1 in taxes.

## Step 17: Add Multiple Amendments to the Same Item

Request:

First Amendment

```http
PATCH /sale HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "date": "2024-02-25T12:00:00Z",
  "invoiceId": "61c8b37b-e09a-4acc-8fcc-0c8428b13961",
  "itemId": "91009206-d745-4d56-b977-3fb1031c21cf",
  "cost": 2600,
  "taxRate": 0.14
}
```

Second Amendment

```http
PATCH /sale HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "date": "2024-02-25T13:00:00Z",
  "invoiceId": "61c8b37b-e09a-4acc-8fcc-0c8428b13961",
  "itemId": "91009206-d745-4d56-b977-3fb1031c21cf",
  "cost": 2400,
  "taxRate": 0.12
}
```

Expected Response:

```
    Status Code: 202 Accepted for each request
    Body: Empty
```

Explanation

- Action: Applies two amendments to 91009206-d745-4d56-b977-3fb1031c21cf in 61c8b37b-e09a-4acc-8fcc-0c8428b13961.
- Effect: Adjusts the tax liability for that item multiple times.

## Step 18: Query Tax Position After Multiple Amendments

Request:

```http
GET /tax-position?date=2024-02-25T14:00:00Z HTTP/1.1
Host: localhost:3000
```

Expected Response:

```json
{
  "date": "2024-02-25T14:00:00.000Z",
  "taxPosition": -131
}
```

Explanation:

- Item 005 Tax (Latest Amendment): 2400 \* 0.12 = 288
- Previous Tax from Item 005: 420 (from previous calculation)
- Adjustment: 288 - 420 = -132 (tax liability decreased)
- New Total Sales Tax: 1451 - 132 = 1319
- Total Tax Payments: 1500
- Tax Position: 1319 - 1500 = -181
- Include Tax from Amendment to Non-Existent Invoice: 50
- Final Tax Position: -181 + 50 = -131
- Interpretation: The company has overpaid 131 in taxes.
