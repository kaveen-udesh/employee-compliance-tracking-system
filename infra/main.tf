locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = data.aws_region.current.name
}

resource "aws_cloudwatch_event_bus" "compliance" {
  name = "${var.name_prefix}-events"
}

resource "aws_sqs_queue" "trigger_dlq" {
  name = "${var.name_prefix}-expiry-job-trigger-dlq"
}

resource "aws_sqs_queue" "lifecycle_dlq" {
  name = "${var.name_prefix}-lifecycle-dlq"
}

resource "aws_sqs_queue" "trigger" {
  name = "${var.name_prefix}-expiry-job-trigger"

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.trigger_dlq.arn
    maxReceiveCount     = 5
  })
}

resource "aws_sqs_queue" "lifecycle" {
  name = "${var.name_prefix}-lifecycle"

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.lifecycle_dlq.arn
    maxReceiveCount     = 5
  })
}

resource "aws_cloudwatch_event_rule" "daily_trigger" {
  name                = "${var.name_prefix}-expiry-job-daily"
  description         = "Kick the Python expiry evaluator once a day"
  schedule_expression = var.schedule_expression
}

resource "aws_cloudwatch_event_target" "daily_trigger" {
  rule = aws_cloudwatch_event_rule.daily_trigger.name
  arn  = aws_sqs_queue.trigger.arn
}

resource "aws_sqs_queue_policy" "trigger" {
  queue_url = aws_sqs_queue.trigger.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowEventBridgeSchedule"
      Effect    = "Allow"
      Principal = { Service = "events.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.trigger.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_cloudwatch_event_rule.daily_trigger.arn
        }
      }
    }]
  })
}

resource "aws_cloudwatch_event_rule" "lifecycle" {
  name           = "${var.name_prefix}-status-transitioned"
  event_bus_name = aws_cloudwatch_event_bus.compliance.name
  event_pattern = jsonencode({
    source        = ["compliance.scheduler"]
    "detail-type" = ["StatusTransitioned"]
  })
}

resource "aws_cloudwatch_event_target" "lifecycle" {
  rule           = aws_cloudwatch_event_rule.lifecycle.name
  event_bus_name = aws_cloudwatch_event_bus.compliance.name
  arn            = aws_sqs_queue.lifecycle.arn
}

resource "aws_sqs_queue_policy" "lifecycle" {
  queue_url = aws_sqs_queue.lifecycle.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Sid       = "AllowEventBridgeLifecycle"
      Effect    = "Allow"
      Principal = { Service = "events.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.lifecycle.arn
      Condition = {
        ArnEquals = {
          "aws:SourceArn" = aws_cloudwatch_event_rule.lifecycle.arn
        }
      }
    }]
  })
}
