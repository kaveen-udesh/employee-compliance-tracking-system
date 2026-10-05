output "event_bus_name" {
  value = aws_cloudwatch_event_bus.compliance.name
}

output "event_bus_arn" {
  value = aws_cloudwatch_event_bus.compliance.arn
}

output "trigger_queue_url" {
  value = aws_sqs_queue.trigger.id
}

output "lifecycle_queue_url" {
  value = aws_sqs_queue.lifecycle.id
}

output "account_id" {
  value       = local.account_id
  description = "Resolved at apply time. Never hardcoded in source."
}

output "region" {
  value = local.region
}
