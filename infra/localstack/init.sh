#!/bin/bash
set -euo pipefail

REGION="${AWS_DEFAULT_REGION:-us-east-1}"
ACCOUNT_ID="000000000000"
BUS_NAME="compliance-events"

awslocal events create-event-bus --name "$BUS_NAME" || true

awslocal sqs create-queue --queue-name expiry-job-trigger-dlq >/dev/null
awslocal sqs create-queue --queue-name compliance-lifecycle-dlq >/dev/null
awslocal sqs create-queue --queue-name expiry-job-trigger >/dev/null
awslocal sqs create-queue --queue-name compliance-lifecycle >/dev/null

TRIGGER_ARN="arn:aws:sqs:${REGION}:${ACCOUNT_ID}:expiry-job-trigger"
LIFECYCLE_ARN="arn:aws:sqs:${REGION}:${ACCOUNT_ID}:compliance-lifecycle"

awslocal events put-rule \
  --name expiry-job-daily \
  --schedule-expression "cron(0 0 * * ? *)"

awslocal events put-targets \
  --rule expiry-job-daily \
  --targets "Id"="trigger-sqs","Arn"="${TRIGGER_ARN}"

awslocal events put-rule \
  --name compliance-status-transitioned \
  --event-bus-name "$BUS_NAME" \
  --event-pattern '{"source":["compliance.scheduler"],"detail-type":["StatusTransitioned"]}'

awslocal events put-targets \
  --event-bus-name "$BUS_NAME" \
  --rule compliance-status-transitioned \
  --targets "Id"="lifecycle-sqs","Arn"="${LIFECYCLE_ARN}"

echo "LocalStack EventBridge + SQS ready"
