output "lambda_functions" {
  value = {
    for k, v in aws_lambda_function.this : k => v
  }
}