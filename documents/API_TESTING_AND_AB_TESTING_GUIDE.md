# ClubSphere 0.1 — Production API Testing & Real A/B Testing Guide

**Platforms:** Node.js 20+ ESM, Express.js, PostgreSQL 15+ / 16+  
**Postman Collection:** [`documents/ClubSphere_API_Test_Collection.postman_collection.json`](file:///e:/Projects/Active/ClubSphere_0.1/documents/ClubSphere_API_Test_Collection.postman_collection.json)  
**Methodologies:**  
- **A/B Testing:** [`ab-test-setup`](file:///C:/Users/Naveen/.gemini/config/skills/ab-test-setup/SKILL.md) (Hypothesis Lock, Statistical Power, MDE, Guardrail Protection)  
- **API Observability & Mocking:** [`api-testing-observability-api-mock`](file:///C:/Users/Naveen/.gemini/config/skills/api-testing-observability-api-mock/SKILL.md) (Chained Data Flows, Distributed Trace IDs, Sub-200ms Performance)

---

## Part 1: Real A/B Testing Architecture ([`ab-test-setup`](file:///C:/Users/Naveen/.gemini/config/skills/ab-test-setup/SKILL.md))

### 1.1 The Statistical Experimentation Rigor

Every test on ClubSphere is governed by non-negotiable statistical gates to eliminate "peeking" bias, false positives, and margin erosion:

```
┌──────────────────┐     ┌─────────────────────┐     ┌───────────────────────┐
│ Hypothesis Lock  │ ──► │ Sample Size & Power │ ──► │ Execution Gate (Lock) │
│  (Hard Gate 1)   │     │ (alpha=0.05, 80%)   │     │     (Hard Gate 2)     │
└──────────────────┘     └─────────────────────┘     └───────────────────────┘
                                                                 │
                                                                 ▼
┌──────────────────┐     ┌─────────────────────┐     ┌───────────────────────┐
│ Guardrail Check  │ ◄── │   No-Peeking Run    │ ◄── │ Deterministic Hash    │
│ (Margin Defense) │     │   (Fixed Window)    │     │ Bucketing (% 100)     │
└──────────────────┘     └─────────────────────┘     └───────────────────────┘
```

---

### 1.2 Active Production Experiment: `EXP_MERCH_MERCHANDISE_UPSELL`

#### Phase 1: Hypothesis Lock (Committed & Frozen)
* **Problem / Observation:** Non-member students browsing the merchandise catalog encounter retail pricing (`non_member_price_cents`). Approximately **88%** abandon their carts without purchasing.
* **Single Change:** When a non-member student reaches checkout, render an interactive bundle prompt:  
  * *"Join club for ₹500 annual dues and instantly save ₹500 on this order!"*
* **Directional Expectation:** Positive lift in conversion with zero margin penalty.
* **Target Audience:** All unauthenticated or non-member students with >= 1 item in cart.

#### Phase 2: Metrics Definition
* **Primary Metric (Mandatory):**  
  $$\text{Cart-to-Paid Conversion Rate} = \frac{\text{Paid Orders}}{\text{Reserved Carts}} \times 100$$
* **Secondary Metrics:**
  - New Annual Membership Acquisition Rate (%)
  - Average Order Value (AOV in ₹)
* **Guardrail Metric (Hard Stop):**  
  - Net Gross Contribution Margin (Paise). If net margin degrades by > 2.0% due to discount bundling, the experiment triggers an automated halt.

#### Phase 3: Sample Size & Power Parameters
* **Baseline Rate:** 12.0%
* **Minimum Detectable Effect (MDE):** +15% relative (detecting lift from 12.0% to 13.8%)
* **Significance Level ($\alpha$):** 95% (p < 0.05, two-tailed)
* **Statistical Power ($1 - \beta$):** 80%
* **Required Sample Size:** ~4,820 checkouts per variant (~9,640 total sessions)

---

### 1.3 Deterministic Bucketing Engine

Implemented in [`backend/src/utils/experiments.js`](file:///e:/Projects/Active/ClubSphere_0.1/backend/src/utils/experiments.js):
```javascript
// Hash participantId + experimentKey using SHA-256
const bucket = parseInt(hash.substring(0, 8), 16) % 100;
// Buckets 0-49: CONTROL | Buckets 50-99: TREATMENT
```
* **Pure Determinism:** The same user ID or session ID **always** receives the exact same variant across multiple devices and page reloads.
* **No Cache Pollution:** Bucketing logic runs locally in sub-millisecond time with zero external network overhead.

#### Evaluating in Code & Postman:
* `GET /api/experiments/EXP_MERCH_MEMBERSHIP_UPSELL/evaluate?participantId={{userId}}`
* `POST /api/experiments/EXP_MERCH_MEMBERSHIP_UPSELL/track` (Payload: `{ "metricName": "cart_to_paid_conversion_rate", "value": 1 }`)

---

## Part 2: End-to-End Postman API Test Suite ([`api-testing-observability-api-mock`](file:///C:/Users/Naveen/.gemini/config/skills/api-testing-observability-api-mock/SKILL.md))

The Postman collection is organized in sequential workflow order, replicating a complete student and officer lifecycle:

```
01. Health & Gateway Diagnostics
        │
        ▼
02. Authentication & Student Profile (Tokens: {{token}}, {{userId}})
        │
        ▼
03. Multi-Tenant Club Discovery (Tenant: {{clubId}})
        │
        ▼
04. A/B Testing & Real Experimentation (Variant: CONTROL / TREATMENT)
        │
        ▼
05. Membership Lifecycle & Walk-Up QR Pass (HMAC-SHA256 Token)
        │
        ▼
06. Merchandise Catalog & Atomic 10-Min Cart Reservation (Pessimistic Lock)
        │
        ▼
07. Event Ticketing & Sub-200ms Rapid Check-In (Replay Guard)
        │
        ▼
08. Broadcast Hub & Announcement History (Append-Only Revisions)
        │
        ▼
09. Financial General Ledger & Double-Entry Accounting (Debits == Credits)
        │
        ▼
10. Expense Reimbursements & Statutory Dual Sign-Off (Accrual Stage 1 & 2)
```

---

### 2.1 Postman Import & Setup Instructions

1. **Open Postman:**
   - Click **Import** in the top left.
   - Choose [`documents/ClubSphere_API_Test_Collection.postman_collection.json`](file:///e:/Projects/Active/ClubSphere_0.1/documents/ClubSphere_API_Test_Collection.postman_collection.json).
2. **Environment Variables:**
   The collection automatically populates variables across requests:
   - `baseUrl`: `http://localhost:5000`
   - `token`: Extracted automatically from `POST /api/auth/register` or `POST /api/auth/login`.
   - `clubId`: Extracted automatically from `GET /api/clubs`.
   - `variantId`: Extracted automatically from `GET /api/store/catalog`.
   - `orderId`: Extracted automatically from `POST /api/store/checkout/reserve`.
   - `ticketCode`: Extracted automatically from `POST /api/events/:id/tickets/reserve`.
   - `expenseId`: Extracted automatically from `POST /api/ledger/expenses`.
3. **Run Full Collection:**
   - Select the collection folder `ClubSphere 0.1 - End-to-End Enterprise API Lifecycle`.
   - Click **Run Collection**. All requests execute in sequence with automated test assertions passing sequentially.

---

### 2.2 Key Test Invariants & Assertions

#### 1. Ultra-Fast Door Check-In Latency (< 200ms)
```javascript
pm.test('Ultra-fast door latency threshold < 200ms', function () {
    pm.expect(pm.response.responseTime).to.be.below(200);
});
```

#### 2. Replay & Duplicate Scan Protection
```javascript
pm.test('Duplicate scan returns 409 Conflict', function () {
    pm.expect(pm.response.code).to.eql(409);
});
```

#### 3. Mathematical Double-Entry Balance Invariant
```javascript
pm.test('Unbalanced journal entry rejected with 400 Bad Request', function () {
    pm.expect(pm.response.code).to.eql(400);
    pm.expect(pm.response.json().error.message).to.include('out of balance');
});
```

#### 4. Separation of Duties (Anti-Fraud Guardrail)
```javascript
pm.test('Claimant cannot approve their own expense claim', function () {
    pm.expect(pm.response.code).to.eql(403);
    pm.expect(pm.response.json().error.message).to.include('Separation of duties');
});
```

---

## Part 3: Observability & Production Telemetry

Every request processed by the API gateway automatically outputs production telemetry headers:

| Header Name | Type | Description |
| :--- | :--- | :--- |
| `X-Request-Id` | UUID v4 | Unique trace identifier for end-to-end request tracing. |
| `X-Response-Time-Ms` | Float | Sub-millisecond execution duration measured via high-precision `process.hrtime.bigint()`. |
| `X-ClubSphere-Service` | String | Fixed service identifier (`ClubSphere-API`). |

These headers are validated across all integration test suites and Postman assertions.
