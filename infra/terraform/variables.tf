variable "aws_region" {
  type        = string
  description = "AWS region for deployment."
  default     = "us-east-1"
}

variable "project_name" {
  type        = string
  description = "Project name used in resource naming."
  default     = "whiteboard"
}

variable "environment" {
  type        = string
  description = "Environment name, e.g. dev/staging/prod."
  default     = "prod"
}

variable "availability_zones" {
  type        = list(string)
  description = "AZs used for subnet spread."
  default     = []
}

variable "vpc_cidr" {
  type        = string
  description = "VPC CIDR block."
  default     = "10.40.0.0/16"
}

variable "container_port" {
  type        = number
  description = "Realtime websocket container port."
  default     = 5000
}

variable "container_image" {
  type        = string
  description = "Optional override image URI for websocket service."
  default     = ""
}

variable "desired_count" {
  type        = number
  description = "Desired ECS task count."
  default     = 2
}

variable "task_cpu" {
  type        = number
  description = "Fargate task CPU."
  default     = 1024
}

variable "task_memory" {
  type        = number
  description = "Fargate task memory."
  default     = 2048
}

variable "socket_allowed_origin" {
  type        = string
  description = "Allowed CORS origin for websocket server."
  default     = "*"
}

variable "board_storage_dir" {
  type        = string
  description = "Autosave storage directory inside container."
  default     = "/tmp/boards"
}

variable "redis_node_type" {
  type        = string
  description = "ElastiCache node type."
  default     = "cache.t4g.small"
}
