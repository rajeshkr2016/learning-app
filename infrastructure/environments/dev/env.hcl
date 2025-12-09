# Development Environment Configuration

locals {
  environment = "dev"
  aws_region  = "us-west-2"
  aws_profile = "default"
  
  # Dev-specific settings
  vpc_cidr = "10.0.0.0/16"
  
  # ECS Configuration
  ecs_task_cpu    = "256"
  ecs_task_memory = "512"
  ecs_desired_count = 1
  
  # RDS Configuration
  db_instance_class = "db.t3.micro"
  db_allocated_storage = 20
  db_name = "learningapp"
  
  # Domain and SSL (optional for dev)
  domain_name = ""  # Leave empty for dev, will use ALB DNS
  create_ssl_cert = false
}
