variable "aws_region" {
  description = "AWS region for EventBridge and SQS. No account id is hardcoded."
  type        = string
  default     = "us-east-1"
}

variable "name_prefix" {
  description = "Prefix for portable resource names."
  type        = string
  default     = "compliance"
}

variable "schedule_expression" {
  description = "EventBridge schedule that triggers the expiry job."
  type        = string
  default     = "cron(0 0 * * ? *)"
}
