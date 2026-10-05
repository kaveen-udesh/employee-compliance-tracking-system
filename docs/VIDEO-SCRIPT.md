# Video demo script

Record at **http://localhost:5173** with the API running. Target length **4–5 minutes**. Speak to the camera / voiceover; the **Do** lines are what you click.

Before you hit record:

1. API on `:3000`, dashboard on `:5173`
2. Re-seed so the numbers match this script: `cd api && npx prisma db seed`
3. Browser at ~1280×800, dashboard open, **Live** pill green
4. Terminal ready in the project root for the job (optional last beat)

---

## 0:00 — Open

**Do:** Dashboard.

**Say:**  
ABC Company uses this to keep visas, certifications, background checks, and training from lapsing. There is a NestJS API, this SvelteKit desk, and a Python job that re-evaluates expiry and publishes events to EventBridge and SQS.

---

## 0:25 — Live overview

**Do:** Hover Active / Expiring / Expired / Renewed. Point at By department and By type. Do not touch the date filters yet.

**Say:**  
These totals are live, not a nightly rollup. Status is computed from dates, so nobody can mark an expired visa as active. Engineering, HR, Finance — you can see where the risk sits. Same breakdown by type: visas versus training versus background checks.

The date controls only affect Impending expiry. Company-wide KPIs stay the full live set.

---

## 0:55 — Impending expiry

**Do:** Scroll to Impending expiry. Set **Next N days** to `14`, click **Apply**. Then **Clear**.

**Say:**  
This list is the working queue. Tightening the window to fourteen days drops anything that is still a month out. Clear puts it back to the default thirty-day warning.

---

## 1:15 — Records

**Do:** Open **Records**. Filter **Status → expired**. Then **Archived → Archived only**. Then **Clear**. Click Alice Chen’s visa (or any open row).

**Say:**  
Operations can filter by status, type, department, and archive state. Archive is the default delete — the row stays in the audit trail. Hard delete is only for a bad data-entry. Archived records drop out of KPIs and the expiry job, which is why you look them up here with Archived only.

---

## 1:45 — Employees

**Do:** Open **Employees**. Type `alice` in search. Clear. Filter **Department → engineering**. Click **Add employee**.

Fill:

- Full name: `Jordan Lee`
- Email: `jordan.lee@abccompany.example`
- Department: `engineering`

Create employee. Close is automatic.

**Say:**  
People are searchable by name or email, and you can slice by department. New hires are added in this modal — they are then available on any compliance record.

---

## 2:20 — Create a record (and prove live)

**Do:** Open **Records → Add record**. Next to Employee, click **Add employee** if you want to show the same modal here; otherwise select **Jordan Lee**.

- Type: `training`
- Issued: today
- Expiry: 10 days from today  
  (date picker: about **15 Oct 2026** if you record on 5 Oct)

Create record. Wait for the detail page. Then go back to **Dashboard** without refreshing.

**Say:**  
Expiry must be after issued. The API sets status from those dates — this one should land as expiring because it falls inside the thirty-day window.

I am not refreshing the dashboard. Creates, updates, archives, and job runs push a change over SSE, so the Live pill stays on and the totals move. If the stream drops, the UI polls every fifteen seconds.

**Do:** Point at Expiring (should be +1) and Engineering in By department. Scroll Impending expiry — Jordan should be there.

---

## 3:15 — Archive

**Do:** Open Jordan’s record. Click **Archive**. Confirm. Dashboard again.

**Say:**  
Archive removes it from the live picture — KPIs, breakdowns, impending expiry — without destroying history. You can still find it under Records with Archived only.

---

## 3:35 — Expiry job (terminal)

**Do:** Split the screen: dashboard on the left, terminal on the right.

```bash
scheduler/.venv/bin/python -m scheduler
```

**Say:**  
This is the daily job. It loads live records, computes status from UTC today, and only writes when something actually changed. Each alert has a fingerprint of record, new status, and date — so a second run today will not double-fire.

**Do:** Run it again immediately.

```bash
scheduler/.venv/bin/python -m scheduler
```

**Say:**  
Second run: no duplicate events. If EventBridge is not up locally, the same payload is appended to `.local-events.jsonl` so you can still see what would have been published. Terraform in `infra` wires the bus, the midnight schedule, the trigger queue, the lifecycle queue, and DLQs — no account IDs hardcoded.

Optional, if you have a few extra seconds:

```bash
scheduler/.venv/bin/python -m scheduler.receive
```

---

## 4:15 — Close

**Do:** Full-screen dashboard, Live pill visible.

**Say:**  
So: live desk for people and credentials, status always derived from dates, archive instead of silent delete, and an idempotent job that fans out through EventBridge and SQS. That is the system.

---

## Recording notes

- Keep the mouse slow. Pause a beat after Apply / Create / Archive so the Live refresh is visible.
- If the pill says Reconnecting, wait — do not start talking about live updates until it is green.
- Skip the terminal beat if you only want a product walkthrough; the UI alone is enough for a 3-minute cut.
- Do not mention assignment extras (zip, scorecard). Talk as if this is ABC Company’s internal desk.
