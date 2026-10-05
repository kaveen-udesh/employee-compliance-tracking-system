from datetime import datetime, timedelta, timezone


def utc_today() -> str:
    return datetime.now(timezone.utc).date().isoformat()


def date_only(value: str) -> str:
    return value[:10]


def add_days(date_value: str, days: int) -> str:
    parsed = datetime.fromisoformat(f"{date_only(date_value)}T00:00:00+00:00")
    return (parsed + timedelta(days=days)).date().isoformat()


def target_status(expiry_date: str, today: str | None = None, buffer_days: int = 30) -> str:
    current = today or utc_today()
    expiry = date_only(expiry_date)
    if expiry < current:
        return "expired"
    if expiry <= add_days(current, buffer_days):
        return "expiring"
    return "active"


def fingerprint(record_id: str, status: str, today: str | None = None) -> str:
    return f"{record_id}:{status}:{today or utc_today()}"
