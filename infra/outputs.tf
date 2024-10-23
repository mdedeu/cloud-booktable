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

output "website_url" {
  value = "http://${aws_s3_bucket.frontend_bucket.bucket}.s3-website-${data.aws_region.current.name}.amazonaws.com"
}