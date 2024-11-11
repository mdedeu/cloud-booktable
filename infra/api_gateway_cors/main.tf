# Crear metodo de API Gateway para cada metodo respectivamente
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

# Integrar la lambda con el metodo
resource "aws_api_gateway_integration" "lambda_integration" {
  for_each                = var.methods
  rest_api_id             = var.rest_api.id
  resource_id             = var.resource_id
  http_method             = each.key
  integration_http_method = "POST"  
  type                    = "AWS_PROXY"
  uri                     = each.value.invoke_arn
  depends_on              = [aws_api_gateway_method.resource_method]
}

# Darle permiso al API Gateway para llamar a la lambda
resource "aws_lambda_permission" "api_gateway_permission" {
  for_each      = var.methods
  statement_id  = "AllowAPIGatewayInvoke${var.lambdaName}_${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.rest_api.execution_arn}/${var.stage}/${each.key}${var.path != "" ? "/${var.path}" : ""}"
}

########### Configuracion del CORS ###########

# Metodo OPTIONS
resource "aws_api_gateway_method" "options_lambda" {
  rest_api_id   = var.rest_api.id
  resource_id   = var.resource_id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Integracion metodo OPTIONS
resource "aws_api_gateway_integration" "options_integration_lambda" {
  rest_api_id = var.rest_api.id
  resource_id = var.resource_id
  http_method = aws_api_gateway_method.options_lambda.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# Respuesta metodo OPTIONS
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

# Integracion de la respuesta del metodo OPTIONS
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
