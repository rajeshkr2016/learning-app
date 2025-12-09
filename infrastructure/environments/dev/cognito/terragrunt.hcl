include "root" {
  path = find_in_parent_folders()
}

terraform {
  source = "../../../modules/cognito"
}

dependency "alb" {
  config_path = "../alb"
  
  mock_outputs = {
    alb_dns_name = "mock-alb.us-west-2.elb.amazonaws.com"
  }
}

inputs = {
  callback_urls = [
    "http://${dependency.alb.outputs.alb_dns_name}/callback",
    "http://localhost:5173/callback"
  ]
  
  logout_urls = [
    "http://${dependency.alb.outputs.alb_dns_name}",
    "http://localhost:5173"
  ]
}
