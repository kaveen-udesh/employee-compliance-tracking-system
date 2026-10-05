from . import config
from .api import ComplianceApi
from .dates import fingerprint, target_status, utc_today
from .events import publish


def evaluate_records(api: ComplianceApi | None = None) -> dict:
    client = api or ComplianceApi()
    today = utc_today()
    records = client.list_evaluable()
    summary = {
        "evaluatedAt": today,
        "scanned": len(records),
        "transitioned": 0,
        "skipped": 0,
        "events": [],
    }

    for record in records:
        desired = target_status(
            record["expiryDate"],
            today,
            config.EXPIRING_SOON_DAYS,
        )
        key = fingerprint(record["id"], desired, today)

        if record.get("lastAlertFingerprint") == key:
            summary["skipped"] += 1
            continue
        if record["status"] == desired:
            summary["skipped"] += 1
            continue
        if record["status"] == "renewed" and desired == "active":
            # still valid outside the buffer; leave the renewed marker alone
            summary["skipped"] += 1
            continue

        result = client.evaluate(record["id"], desired, key)
        if not result.get("changed"):
            summary["skipped"] += 1
            continue

        event = {
            "recordId": record["id"],
            "employeeId": record["employeeId"],
            "employeeName": record.get("employee", {}).get("fullName"),
            "department": record.get("employee", {}).get("department"),
            "type": record["type"],
            "previousStatus": result["previousStatus"],
            "newStatus": desired,
            "expiryDate": record["expiryDate"][:10],
            "fingerprint": key,
        }
        publish(event)
        summary["transitioned"] += 1
        summary["events"].append(event)

    return summary
