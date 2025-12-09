include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/ecs"
}

dependency "vpc" {
  config_path = "../vpc"
  
  mock_outputs = {
    vpc_id             = "vpc-mock-id"
    private_subnet_ids = ["subnet-mock-1", "subnet-mock-2"]
  }
}

dependency "alb" {
  config_path = "../alb"
  
  mock_outputs = {
    alb_security_group_id = "sg-mock-alb"
    target_group_arn      = "arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/mock/1234567890123456"
  }
}

dependency "rds" {
  config_path = "../rds"
  
  mock_outputs = {
    db_instance_address    = "mock-db.region.rds.amazonaws.com"
    db_instance_port       = 5432
    db_name                = "learningapp"
    db_password_secret_arn = "arn:aws:secretsmanager:us-west-2:123456789012:secret:mock-secret"
  }
}

dependency "cognito" {
  config_path = "../cognito"
  
  mock_outputs = {
    user_pool_id     = "us-west-2_mock123"
    user_pool_client_id = "mock-client-id"
  }
}

locals {
  env_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
}

inputs = {
  vpc_id                = dependency.vpc.outputs.vpc_id
  private_subnet_ids    = dependency.vpc.outputs.private_subnet_ids
  alb_security_group_id = dependency.alb.outputs.alb_security_group_id
  target_group_arn      = dependency.alb.outputs.target_group_arn
  
  db_host                 = dependency.rds.outputs.db_instance_address
  db_port                 = dependency.rds.outputs.db_instance_port
  db_name                 = dependency.rds.outputs.db_name
  db_password_secret_arn  = dependency.rds.outputs.db_password_secret_arn
  
  cognito_user_pool_id = dependency.cognito.outputs.user_pool_id
  cognito_client_id    = dependency.cognito.outputs.user_pool_client_id
  
  task_cpu      = local.env_vars.locals.ecs_task_cpu
  task_memory   = local.env_vars.locals.ecs_task_memory
  desired_count = local.env_vars.locals.ecs_desired_count
}
