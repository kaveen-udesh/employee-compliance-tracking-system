import json
from datetime import datetime, timezone
from typing import Any

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from . import config


def _events_client():
    kwargs: dict[str, Any] = {"region_name": config.AWS_REGION}
    if config.AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = config.AWS_ENDPOINT_URL
    return boto3.client("events", **kwargs)


def _append_local(payload: dict) -> None:
    config.EVENT_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with config.EVENT_LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(payload) + "\n")


def publish(detail: dict) -> dict:
    envelope = {
        "source": config.SOURCE,
        "detailType": config.DETAIL_TYPE,
        "publishedAt": datetime.now(timezone.utc).isoformat(),
        "detail": detail,
    }
    print(json.dumps(envelope, indent=2))
    _append_local(envelope)

    try:
        client = _events_client()
        result = client.put_events(
            Entries=[
                {
                    "Source": config.SOURCE,
                    "DetailType": config.DETAIL_TYPE,
                    "EventBusName": config.EVENT_BUS_NAME,
                    "Detail": json.dumps(detail),
                }
            ]
        )
        failed = result.get("FailedEntryCount", 0)
        if failed:
            raise RuntimeError(f"EventBridge rejected {failed} entries: {result}")
        envelope["eventBridge"] = "published"
    except (BotoCoreError, ClientError, RuntimeError) as error:
        envelope["eventBridge"] = f"skipped: {error}"
        print(f"EventBridge unavailable, kept local log only: {error}")

    return envelope
