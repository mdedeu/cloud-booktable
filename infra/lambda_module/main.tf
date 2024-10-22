resource "aws_lambda_function" "this" {
  for_each = var.lambda_functions

  function_name = each.value.name
  handler       = "${each.key}.${each.key}"
  runtime       = "python3.12"
  filename      = each.value.code
  source_code_hash = each.value.source_code_hash

  role = var.lambda_role_arn

  vpc_config {
    subnet_ids         = var.vpc_subnets
    security_group_ids = var.security_groups
  }
}