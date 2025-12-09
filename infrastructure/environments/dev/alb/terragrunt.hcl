include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/alb"
}

dependency "vpc" {
  config_path = "../vpc"
  
  mock_outputs = {
    vpc_id            = "vpc-mock-id"
    public_subnet_ids = ["subnet-mock-1", "subnet-mock-2"]
  }
}

inputs = {
  vpc_id            = dependency.vpc.outputs.vpc_id
  public_subnet_ids = dependency.vpc.outputs.public_subnet_ids
  
  enable_https    = false
  certificate_arn = ""
}
