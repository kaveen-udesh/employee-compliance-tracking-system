import argparse
import json
import time

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from . import config
from .job import evaluate_records


def _sqs_client():
    kwargs = {"region_name": config.AWS_REGION}
    if config.AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = config.AWS_ENDPOINT_URL
    return boto3.client("sqs", **kwargs)


def run_once() -> None:
    summary = evaluate_records()
    print(json.dumps(summary, indent=2))


def watch() -> None:
    if not config.TRIGGER_QUEUE_URL:
        raise SystemExit("EXPIRY_JOB_TRIGGER_QUEUE_URL is required for --watch")
    client = _sqs_client()
    print(f"Polling trigger queue {config.TRIGGER_QUEUE_URL}")
    while True:
        try:
            response = client.receive_message(
                QueueUrl=config.TRIGGER_QUEUE_URL,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=20,
            )
        except (BotoCoreError, ClientError) as error:
            print(f"Trigger queue unavailable: {error}")
            time.sleep(5)
            continue

        for message in response.get("Messages", []):
            print("Received EventBridge trigger, evaluating records")
            run_once()
            client.delete_message(
                QueueUrl=config.TRIGGER_QUEUE_URL,
                ReceiptHandle=message["ReceiptHandle"],
            )


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate compliance expiry states")
    parser.add_argument(
        "--watch",
        action="store_true",
        help="long-poll the EventBridge trigger queue instead of running once",
    )
    args = parser.parse_args()
    if args.watch:
        watch()
    else:
        run_once()


if __name__ == "__main__":
    main()
