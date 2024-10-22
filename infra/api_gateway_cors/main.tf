# Generate a set from the list of HTTP methods to remove duplicates
locals {
  http_methods_set = toset(keys(var.methods))
  allowed_methods = join(",", concat(keys(var.methods), ["OPTIONS"]))
}

# Create API Gateway methods for each HTTP method
resource "aws_api_gateway_method" "resource_method" {
  for_each      = local.http_methods_set
  rest_api_id   = var.rest_api.id
  resource_id   = var.resource_id
  http_method   = each.value
  authorization = "NONE"
}

resource "aws_api_gateway_method_response" "cors_method_response_200" {
  for_each      = local.http_methods_set
  rest_api_id   = var.rest_api.id
  resource_id   = var.resource_id
  http_method   = each.value
  status_code   = "200"
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
  depends_on = [aws_api_gateway_method.resource_method]
}

# Lambda Integration for each method
resource "aws_api_gateway_integration" "lambda_integration" {
  for_each                = var.methods
  rest_api_id             = var.rest_api.id
  resource_id             = var.resource_id
  http_method             = each.key
  integration_http_method = "POST"  # For AWS_PROXY, this is usually 'POST'
  type                    = "AWS_PROXY"
  uri                     = each.value.invoke_arn
  depends_on              = [aws_api_gateway_method.resource_method]
}

# Lambda Permission for each method
resource "aws_lambda_permission" "api_gateway_permission" {
  for_each      = var.methods
  statement_id  = "AllowAPIGatewayInvoke${var.lambdaName}_${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.rest_api.execution_arn}/${var.stage}/${each.key}${var.path != "" ? "/${var.path}" : ""}"
}

########### CORS Configuration ###########


# CORS OPTIONS Method
resource "aws_api_gateway_method" "options_lambda" {
  rest_api_id   = var.rest_api.id
  resource_id   = var.resource_id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# CORS OPTIONS Integration
resource "aws_api_gateway_integration" "options_integration_lambda" {
  rest_api_id = var.rest_api.id
  resource_id = var.resource_id
  http_method = aws_api_gateway_method.options_lambda.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# CORS OPTIONS Method Response
resource "aws_api_gateway_method_response" "options_method_response" {
  rest_api_id = var.rest_api.id
  resource_id = var.resource_id
  http_method = aws_api_gateway_method.options_lambda.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  response_models = {
    "application/json" = "Empty"
  }
}

# CORS OPTIONS Integration Response
resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id  = var.rest_api.id
  resource_id  = var.resource_id
  http_method  = aws_api_gateway_method.options_lambda.http_method
  status_code  = aws_api_gateway_method_response.options_method_response.status_code
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'${local.allowed_methods}'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}
