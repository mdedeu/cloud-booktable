module "cognito" {
  source = "./cognito"
  
  user_pool_name = "userpool-booktable"
  client_name    = "react-client"
}