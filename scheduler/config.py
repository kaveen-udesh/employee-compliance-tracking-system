import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")
load_dotenv(ROOT.parent / ".env")


def env(name: str, default: str | None = None) -> str | None:
    value = os.getenv(name, default)
    return value if value not in ("", None) else default


API_BASE_URL = env("API_BASE_URL", "http://localhost:3000")
AWS_REGION = env("AWS_REGION", "us-east-1")
AWS_ENDPOINT_URL = env("AWS_ENDPOINT_URL")
EVENT_BUS_NAME = env("EVENT_BUS_NAME", "compliance-events")
TRIGGER_QUEUE_URL = env("EXPIRY_JOB_TRIGGER_QUEUE_URL")
LIFECYCLE_QUEUE_URL = env("LIFECYCLE_QUEUE_URL")
EXPIRING_SOON_DAYS = int(env("EXPIRING_SOON_DAYS", "30"))
EVENT_LOG_PATH = Path(env("EVENT_LOG_PATH", str(ROOT.parent / ".local-events.jsonl")))
SOURCE = "compliance.scheduler"
DETAIL_TYPE = "StatusTransitioned"
