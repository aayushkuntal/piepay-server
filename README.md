# PiePay Backend Assignment

This repository implements a backend service for the PiePay take-home assignment. It processes Flipkart offer API responses, stores extracted offers in MongoDB, and calculates the highest applicable discount based on user parameters. The service supports the required endpoints and the bonus payment instrument feature.

Key features:
- **POST /offer**: Extracts and stores offers from Flipkart API responses.
- **GET /highest-discount**: Computes the highest discount for given amount, bank, and optional payment instrument.

The implementation uses Node.js, Express, MongoDB, and node-cache for efficiency.

## Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- npm (included with Node.js)
- MongoDB (local instance or cloud URI, e.g., MongoDB Atlas)

### Installation
1. Clone the repository:
```
  git clone https://github.com/yourusername/piepay-backend.git
  cd piepay-backend
```
text

2. Install dependencies:
npm install

text

3. Configure environment variables:
- Create a `.env` file in the root:
  ```
  MONGODB_URI=mongodb://localhost:27017/piepay
  PORT=3000
  ```

4. Start the server:
- Development mode (with auto-restart):
  ```
  npm install -g nodemon
  nodemon server.js
  ```
- Production mode:
  ```
  node server.js
  ```

The server starts at `http://localhost:3000`. No migrations are needed—Mongoose handles schema creation automatically.

5. Test endpoints:
- Insert offers:
  ```
  curl -X POST http://localhost:3000/api/vi/offer -H "Content-Type: application/json" -d '{"flipkartOfferApiResponse": { ... Flipkart JSON ... }}'
  ```
- Get highest discount:
  ```
  curl -G http://localhost:3000/api/v1/highest-discount --data-urlencode "amountToPay=10000" --data-urlencode "bankName=AXIS" --data-urlencode "paymentInstrument=CREDIT"
  ```

## Assumptions Made
- **Offer Extraction**: Offers are parsed from `adjustments.adjustment_list` in the Flipkart response. Bank names, payment instruments, discount types/values, and limits are extracted from `title` and `summary` using keyword matching and regex (e.g., "5%" for percentage, "Flat ₹10" for fixed). If parsing fails, the offer is skipped.
- **Uniqueness**: Offers are unique by `adjustment_id`. Duplicates are handled via upsert; "new" offers are detected by comparing timestamps.
- **Activity Status**: All extracted offers are stored as `isActive: true`, assuming their presence in the response indicates availability.
- **Discount Logic**: Percentage discounts use `(amountToPay * discountValue) / 100`, capped at `maximumDiscount`. Flat discounts apply `discountValue` directly. Amounts are in paise (e.g., 50000 = ₹500), treated as integers without conversion.
- **Payment Instruments**: Extracted from keywords in `summary`/`title` (e.g., "Credit Card" → "CREDIT"). Empty if none detected.
- **Edge Cases**: Invalid inputs return 400 errors. No authentication, assuming internal use.

## Design Choices
- **Framework**: Node.js with Express for its simplicity, speed, and robust middleware support—ideal for API services handling high throughput.
- **Database**: MongoDB via Mongoose for flexible, schema-less storage of variable offer data. The schema includes `adjustmentId` (unique index), enums for `bankName`/`discountType` (consistency), and arrays for `paymentInstruments`. Compound indexes on `bankName`, `paymentInstruments`, `minimumAmount`, and `maxTxnValue` ensure fast queries.
- **Modularity**: Code is separated into controllers (API handlers), services (business logic), models (schemas), routes, and utils (cache). CommonJS exports for broad compatibility.
- **Caching**: node-cache for in-memory storage of discount results (keyed by params, 10-min TTL) to optimize repeated queries; extensible to Redis.
- **Validation & Errors**: express-validator for input checks; centralized error handler for clean responses.
- **Performance**: Async operations, lean queries, and bulk upserts for efficiency.

## Scaling the GET /highest-discount Endpoint to 1,000 Requests/Second
To handle 1,000 RPS:
- **Horizontal Scaling**: Run multiple Node.js instances with PM2 clustering or Docker/Kubernetes, behind a load balancer (e.g., NGINX or AWS ELB).
- **Caching**: Upgrade to Redis for distributed caching, targeting 80-90% hit rates on common queries.
- **Database**: Use MongoDB read replicas/sharding for query distribution; optimize with connection pooling (already implemented).
- **Optimizations**: Add rate limiting (express-rate-limit), async/await for non-blocking I/O, and CDN for static assets if needed.
- **Monitoring**: Integrate Prometheus/Grafana for metrics; auto-scale based on CPU/load. This setup should achieve <50ms latency at scale.

## Improvements with More Time
- **Testing**: Add unit/integration tests with Jest for parsing, calculations, and edge cases.
- **Advanced Parsing**: Use NLP (e.g., natural.js) for robust extraction from unstructured text.
- **API Docs**: Integrate Swagger for interactive endpoint documentation.
- **Security**: Add JWT auth, HTTPS, and SQL injection protections.
- **Enhancements**: Support pagination for offers, return full offer details in discount responses, and add logging (Winston) with error tracking (Sentry).
- **CI/CD**: Set up GitHub Actions for automated testing and deployment.
