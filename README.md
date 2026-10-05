# Employee Compliance Tracking System

ABC Company uses this platform to track employee visas, certifications, background checks, and training so credentials cannot lapse unnoticed.

The system has three parts: a NestJS API, a SvelteKit dashboard, and a Python job that updates expiry status and publishes lifecycle events to Amazon EventBridge and SQS.

## Components

| Path | Purpose |
| --- | --- |
| `api/` | REST API for employees, compliance records, validation, archive, and live reports |
| `dashboard/` | Operations UI for dashboards, records, and employees |
| `scheduler/` | Daily expiry evaluation and EventBridge event publishing |
| `infra/` | Terraform for the event bus, schedule, and queues |
| `docs/ARCHITECTURE.md` | Design decisions: archive vs delete, live reporting, and queue layout |

## Run locally

Requires Node 20+ and Python 3.11+.

```bash
cp .env.example .env
cp api/.env.example api/.env
cp scheduler/.env.example scheduler/.env
cp dashboard/.env.example dashboard/.env

cd api
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run start:dev
```

In a second terminal:

```bash
cd dashboard
npm install
npm run dev
```

- Dashboard: [http://localhost:5173](http://localhost:5173)
- API health: [http://localhost:3000/health](http://localhost:3000/health)

Sample employees and records are loaded by the seed script.

### Expiry job

```bash
python3 -m venv scheduler/.venv
scheduler/.venv/bin/pip install -r scheduler/requirements.txt
scheduler/.venv/bin/python -m scheduler
```

The job is idempotent: a second run on the same day does not emit duplicate alerts. Use the project virtualenv (`scheduler/.venv/bin/python`), not system Python.

```bash
scheduler/.venv/bin/python -m scheduler.receive
```

If EventBridge is unavailable, events are written to `.local-events.jsonl`.

## API

Base URL: `http://localhost:3000`

### Employees

- `POST /employees`
- `GET /employees?q=&department=`
- `GET /employees/:id`
- `PATCH /employees/:id`
- `DELETE /employees/:id`

### Compliance records

- `POST /compliance-records`
- `GET /compliance-records?employeeId=&status=active,expiring&type=visa&department=engineering&archived=hide|include|only`
- `GET /compliance-records/:id`
- `PATCH /compliance-records/:id`
- `DELETE /compliance-records/:id` (archive)
- `DELETE /compliance-records/:id?hard=true` (permanent delete)
- `POST /compliance-records/:id/evaluate` (used by the expiry job)

Status is computed from dates. `expiryDate` must be after `issuedDate`.

### Reports

`GET /reports/dashboard?days=30`

or

`GET /reports/dashboard?from=2026-10-04&to=2026-11-03`

Returns live totals, department and type breakdowns, and the impending-expiry list. Date parameters apply only to that list; KPI totals stay company-wide.

`GET /reports/stream` is a server-sent event feed. Creates, updates, archives, and job evaluations push a `changed` event so the dashboard refreshes without a full page reload. If the stream drops, the UI polls every 15 seconds.

## EventBridge and SQS

Terraform in `infra/` provisions:

1. Custom bus `compliance-events`
2. Daily schedule `cron(0 0 * * ? *)` targeting the job trigger queue
3. Rule `source = compliance.scheduler` targeting the lifecycle queue
4. Dead-letter queues on both SQS queues

AWS account identifiers are resolved at apply time and are not hardcoded.

```bash
cd infra
terraform init
terraform plan
terraform apply
```

Local emulator:

```bash
docker compose up -d localstack
python -m scheduler --watch
```

The default database is SQLite so the application can run without RDS. Docker Compose also includes Postgres and LocalStack.
