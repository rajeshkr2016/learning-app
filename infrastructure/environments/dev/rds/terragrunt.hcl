include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/rds"
}

dependency "vpc" {
  config_path = "../vpc"
  
  mock_outputs = {
    vpc_id             = "vpc-mock-id"
    private_subnet_ids = ["subnet-mock-1", "subnet-mock-2"]
  }
}

dependency "ecs" {
  config_path = "../ecs"
  
  mock_outputs = {
    task_security_group_id = "sg-mock-ecs"
  }
}

locals {
  env_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
}

inputs = {
  vpc_id                      = dependency.vpc.outputs.vpc_id
  private_subnet_ids          = dependency.vpc.outputs.private_subnet_ids
  allowed_security_group_ids  = [dependency.ecs.outputs.task_security_group_id]
  
  db_name               = local.env_vars.locals.db_name
  db_instance_class     = local.env_vars.locals.db_instance_class
  db_allocated_storage  = local.env_vars.locals.db_allocated_storage
  multi_az              = false
}
