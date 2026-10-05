import json

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from . import config


def main() -> None:
    if config.EVENT_LOG_PATH.exists():
        print(f"Local event log ({config.EVENT_LOG_PATH}):")
        print(config.EVENT_LOG_PATH.read_text(encoding="utf-8"))

    if not config.LIFECYCLE_QUEUE_URL:
        return

    kwargs = {"region_name": config.AWS_REGION}
    if config.AWS_ENDPOINT_URL:
        kwargs["endpoint_url"] = config.AWS_ENDPOINT_URL

    try:
        client = boto3.client("sqs", **kwargs)
        response = client.receive_message(
            QueueUrl=config.LIFECYCLE_QUEUE_URL,
            MaxNumberOfMessages=10,
            WaitTimeSeconds=5,
        )
    except (BotoCoreError, ClientError) as error:
        print(f"Lifecycle queue unavailable: {error}")
        return

    messages = response.get("Messages", [])
    if not messages:
        print("No SQS lifecycle messages waiting")
        return

    print(f"SQS lifecycle messages: {len(messages)}")
    for message in messages:
        print(json.dumps(json.loads(message["Body"]), indent=2))
        client.delete_message(
            QueueUrl=config.LIFECYCLE_QUEUE_URL,
            ReceiptHandle=message["ReceiptHandle"],
        )


if __name__ == "__main__":
    main()
