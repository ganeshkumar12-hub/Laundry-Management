# Security Specification - BubbleFlow Laundry Manager

## Data Invariants
1. An order must have at least one garment.
2. The `totalAmount` must be the sum of `quantity * pricePerItem` for all garments.
3. Status transitions must be logical (no jumping from RECEIVED to DELIVERED directly, though for simplicity we might just allow any status update by authorized users if they are the creator or an admin).
4. `createdBy` must match the authenticated user's UID.
5. `createdAt` and `updatedAt` must be server-side timestamps.

## The "Dirty Dozen" Payloads (Unauthorized/Malicious)

1. **Identity Spoofing**: Create an order with `createdBy` set to another user's UID.
2. **Shadow Update**: Update an order to change `totalAmount` without changing garments.
3. **ID Poisoning**: Create an order with a document ID that is 2KB long.
4. **Status Skip**: Normal users trying to update `status` to "DELIVERED" without going through "READY".
5. **PII Leak**: A user trying to `get` an order they didn't create (and aren't an admin).
6. **Query Scraping**: Authenticated user trying to list ALL orders without a `createdBy` filter.
7. **Resource Poisoning**: Adding 5000 garments to a single order.
8. **Invalid Types**: Setting `quantity` as a string "10".
9. **Negative Billing**: Setting `pricePerItem` to -100.
10. **Timestamp Fraud**: Providing a client-side `createdAt` in the past.
11. **Phantom Fields**: Adding `isVerified: true` to the order object.
12. **Orphaned Write**: Creating an order without being logged in.

## Test Runner (Logic)
The following fields must be validated:
- `customerName` (string, 1-100 chars)
- `customerPhone` (string, matches regex)
- `garments` (list, 1-50 items)
- `totalAmount` (number, positive)
- `status` (enum: RECEIVED, PROCESSING, READY, DELIVERED)
- `createdAt` (server timestamp)
- `updatedAt` (server timestamp)
- `createdBy` (matches request.auth.uid)
