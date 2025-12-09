# Production Environment Configuration

locals {
  environment = "prod"
  aws_region  = "us-west-2"
  aws_profile = "default"
  
  # Prod-specific settings
  vpc_cidr = "10.1.0.0/16"
  
  # ECS Configuration
  ecs_task_cpu    = "512"
  ecs_task_memory = "1024"
  ecs_desired_count = 2
  
  # RDS Configuration
  db_instance_class = "db.t3.small"
  db_allocated_storage = 50
  db_name = "learningapp"
  
  # Domain and SSL
  domain_name = "learning.example.com"  # Update with your domain
  create_ssl_cert = true
}
