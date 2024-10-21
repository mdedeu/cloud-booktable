#############################
# Outputs
#############################

output "api_gateway_url" {
  description = "URL del API Gateway"
  value       = aws_api_gateway_deployment.my_api_deployment.invoke_url
}

output "s3_bucket_name" {
  description = "Nombre del bucket S3"
  value       = aws_s3_bucket.frontend_bucket.bucket
}

output "website_endpoint" {
  value = aws_s3_bucket_website_configuration.frontend_bucket.website_endpoint
}

#############################
# DynamoDB Tables
############################# 

output "dynamodb_usuarios_name" {
  description = "Nombre de la tabla Usuarios DynamoDB"
  value       = aws_dynamodb_table.usuarios_table.name
}

output "dynamodb_restaurantes_name" {
  description = "Nombre de la tabla Restaurantes DynamoDB"
  value       = aws_dynamodb_table.restaurantes_table.name
}

output "dynamodb_reservas_name" {
  description = "Nombre de la tabla Reservas DynamoDB"
  value       = aws_dynamodb_table.reservas_table.name
}

output "dynamodb_mesas_name" {
  description = "Nombre de la tabla Mesas DynamoDB"
  value       = aws_dynamodb_table.mesas_table.name
}

#############################

output "lambda_hello_function_name" {
  description = "Nombre de la función Lambda"
  value       = aws_lambda_function.crear_mesa_lambda.function_name
}