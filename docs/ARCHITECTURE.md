# Architecture

This document explains the main product and infrastructure choices.

## Data model

Compliance records belong to employees. Department is stored on the employee so dashboard breakdowns stay consistent when one person holds several visas or certificates.

Status is computed from dates on create and update. Clients cannot mark a lapsed visa as `active`. `renewed` is set when a previously `expiring` or `expired` record is given new dates that are still valid.

The default warning window is 30 days, controlled by `EXPIRING_SOON_DAYS`.

## Archive vs hard delete

`DELETE /compliance-records/:id` archives the row (`archivedAt`). The purpose of the product is to keep credentials visible; deleting by default would hide the same risk the system is meant to catch.

`?hard=true` permanently removes a row, for data-entry mistakes. Lists hide archived rows unless `archived=include` or `archived=only`.

Employees who still have records cannot be deleted.

Archived records are excluded from dashboard KPIs, department and type breakdowns, the impending-expiry list, and the expiry job. They remain in the database for audit.

## Live reports vs pre-aggregation

`GET /reports/dashboard` is computed on read.

- The working set is operational, not a warehouse-scale fact table.
- A write must appear on the next refresh. A nightly rollup could hide a visa that expired this morning.
- Extra cache or warehouse services are unnecessary at this scale.

The cost is extra database work per request. If reporting later becomes company-wide BI, a scheduled aggregation table would be the next step. The response includes `"strategy": "live"` so that change stays explicit.

Date filters (`days` or `from` / `to`) apply only to the impending-expiry list. KPI totals and breakdowns always cover every live record.

## EventBridge and SQS

```
EventBridge schedule (daily 00:00 UTC)
        -> expiry-job-trigger SQS
        -> Python job
        -> EventBridge custom bus (compliance-events)
        -> compliance-lifecycle SQS
```

The trigger queue keeps scheduling separate from notifications. The job can also be run directly (`python -m scheduler`) for retries without waiting for cron.

The lifecycle queue is the notification sink. Email or chat workers can subscribe later without changing the evaluator.

Terraform reads account and region from the AWS provider. No account identifier is hardcoded.

The stack stays on EventBridge and SQS. There is no Lambda, RDS, or NAT gateway in this deployment.

## Idempotency

The evaluator is safe to run twice in the same window.

1. Load live `active`, `expiring`, and `renewed` records.
2. Compute the desired status from `expiryDate` and UTC today.
3. Build `fingerprint = {recordId}:{newStatus}:{YYYY-MM-DD}`.
4. Skip if that fingerprint is already stored, or if the record is already in the desired state.
5. Otherwise write status and fingerprint through `POST /compliance-records/:id/evaluate`, then publish one EventBridge event.

A second run on the same day performs no writes and emits no alerts.

## Local operation

SQLite is the default database so the API can start without a managed database. Docker Compose provides Postgres and LocalStack when those are needed.

If EventBridge is unreachable, the job still writes the payload to `.local-events.jsonl`.

## Notification payload

```json
{
  "recordId": "...",
  "employeeId": "...",
  "employeeName": "Alice Chen",
  "department": "engineering",
  "type": "certification",
  "previousStatus": "active",
  "newStatus": "expiring",
  "expiryDate": "2026-10-16",
  "fingerprint": "…:expiring:2026-10-04"
}
```

Event metadata: `source = compliance.scheduler`, `detail-type = StatusTransitioned`.
