#############################
# VPC y Subnets (ya existente)
#############################

resource "aws_vpc" "vpc1" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "VPC1"
  }
}

resource "aws_subnet" "sn1" {
  vpc_id            = aws_vpc.vpc1.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "Subnet_priv1"
  }
}

resource "aws_subnet" "sn2" {
  vpc_id            = aws_vpc.vpc1.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "Subnet_priv2"
  }
}

#############################
# Route Tables Privadas
#############################

resource "aws_route_table" "private_rt" {
  vpc_id = aws_vpc.vpc1.id

  tags = {
    Name = "Private Route Table"
  }
}

# Asocia la tabla de rutas privada a las subnets privadas
resource "aws_route_table_association" "private_a" {
  subnet_id      = aws_subnet.sn1.id
  route_table_id = aws_route_table.private_rt.id
}

resource "aws_route_table_association" "private_b" {
  subnet_id      = aws_subnet.sn2.id
  route_table_id = aws_route_table.private_rt.id
}

#############################
# Security Groups
#############################

resource "aws_security_group" "lambda_sg" {
  name        = "lambda_sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.vpc1.id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "Lambda Security Group"
  }
}

#############################
# VPC Endpoints
#############################

# VPC Endpoint para S3
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.vpc1.id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = [aws_route_table.private_rt.id]

  tags = {
    Name = "S3 VPC Endpoint"
  }
}

# VPC Endpoint para DynamoDB
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = aws_vpc.vpc1.id
  service_name      = "com.amazonaws.us-east-1.dynamodb"
  vpc_endpoint_type = "Gateway"

  route_table_ids = [aws_route_table.private_rt.id]

  tags = {
    Name = "DynamoDB VPC Endpoint"
  }
}

#############################
# S3 Bucket
#############################

resource "aws_s3_bucket" "my_bucket" {
  bucket = "mi-bucket-terraform-de-prueba-1"  

  tags = {
    Name        = "Mi Bucket S3"
    Environment = "Dev"
  }
}

#############################
# DynamoDB Table
#############################

resource "aws_dynamodb_table" "reservas_table" {
  name         = "RESERVAS"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Nombre_restaurant"
  range_key = {
    name= "Fecha_hora"
    type = "N"
  }

  attribute {
    name = "ID_Mesa"
    type = "S"
  }

  tags = {
    Name        = "Tabla Reservas"
    Environment = "Dev"
  }
}

resource "aws_dynamodb_table" "mesas_table" {
  name         = "MESAS"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Nombre_restaurant"
  range_key = {
    name= "Capacidad"
    type = "N"
  }

  attribute {
    name = "ID_Mesa"
    type = "S"
  }

  tags = {
    Name        = "Tabla Mesas"
    Environment = "Dev"
  }
}


resource "aws_dynamodb_table" "usuarios_table" {
  name         = "USUARIOS"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ID_Usuario"
  range_key = {
    name= "Fecha_hora"
    type = "N"
  }
  //faltan los atributos

  attribute {
    name = "ID_Reserva"
    type = "S"
  }

  tags = {
    Name        = "Tabla Usuarios"
    Environment = "Dev"
  }
}

resource "aws_dynamodb_table" "restaurantes_table" {
  name         = "RESTAURANTES"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Localidad"
  range_key = "Categoria_Restaurant"

  attribute {
    name = "ID_Usuario"
    type = "S"
  }

  tags = {
    Name        = "Tabla Restaurantes"
    Environment = "Dev"
  }
}



#############################
# Empaquetar el Código de Lambda
#############################

#Para codigo de lambda hello
data "archive_file" "lambda_hello_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_code_hello"
  output_path = "${path.module}/lambda_code_hello/lambda_hello.zip"
}


#Para codigo de lambda proxy
data "archive_file" "lambda_proxy_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda_code_proxy"
  output_path = "${path.module}/lambda_code_proxy/lambda_proxy.zip"
}

#############################
# Lambda Functions
#############################

                                                                      #En esta parte hago lambda para una ruta en especifico o para un proxy que basicamente te redirige cualquier endpoint que le metas a la funcion lambda (el proxy)
#Lambda para Hello                                                                     
resource "aws_lambda_function" "my_lambda_hello" {
  filename         = data.archive_file.lambda_hello_zip.output_path
  function_name    = "MiFuncionLambdaHello"
  role             = var.lambda_execution_role_arn
  handler          = "index.handler"  
  runtime          = "nodejs20.x"    
  source_code_hash = data.archive_file.lambda_hello_zip.output_base64sha256

  vpc_config {
    subnet_ids         = [aws_subnet.sn1.id, aws_subnet.sn2.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = {
    Name        = "Mi Función Lambda Hello"
    Environment = "Dev"
  }
}

#Lambda para Proxy
resource "aws_lambda_function" "my_lambda_proxy" {
  filename         = data.archive_file.lambda_proxy_zip.output_path
  function_name    = "MiFuncionLambdaProxy"
  role             = var.lambda_execution_role_arn
  handler          = "index.handler"  
  runtime          = "nodejs20.x"    
  source_code_hash = data.archive_file.lambda_proxy_zip.output_base64sha256

  vpc_config {
    subnet_ids         = [aws_subnet.sn1.id, aws_subnet.sn2.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = {
    Name        = "Mi Función Lambda Proxy"
    Environment = "Dev"
  }
}


#############################
# API Gateway
#############################

resource "aws_api_gateway_rest_api" "my_api" {
  name        = "MiAPI"
  description = "API Gateway para mi aplicación"
}



#SIN PROXY##############################################

#Definir un recurso específico, por ejemplo, "hello"
resource "aws_api_gateway_resource" "hello" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "hello"
}

# Definir el método GET para el recurso "hello"
resource "aws_api_gateway_method" "hello_method" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.hello.id
  http_method   = "GET"
  authorization = "NONE"
}

# Integración del método "hello_method" con Lambda
resource "aws_api_gateway_integration" "hello_integration" {
  rest_api_id             = aws_api_gateway_rest_api.my_api.id
  resource_id             = aws_api_gateway_resource.hello.id
  http_method             = aws_api_gateway_method.hello_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.my_lambda_hello.invoke_arn
}

# Permisos para que API Gateway invoque Lambda
resource "aws_lambda_permission" "api_gateway_hello" {
  statement_id  = "AllowAPIGatewayInvokeHello"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.my_lambda_hello.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn = "${aws_api_gateway_rest_api.my_api.execution_arn}/prod/GET/hello"

}
#######################################################


#CON PROXY###########################
resource "aws_api_gateway_resource" "proxy" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "proxy_method" {
  rest_api_id   = aws_api_gateway_rest_api.my_api.id
  resource_id   = aws_api_gateway_resource.proxy.id
  http_method   = "ANY"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.my_api.id
  resource_id             = aws_api_gateway_resource.proxy.id
  http_method             = aws_api_gateway_method.proxy_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.my_lambda_proxy.invoke_arn
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.my_lambda_proxy.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.my_api.execution_arn}/*/*"
}
###############################################


resource "aws_api_gateway_deployment" "my_api_deployment" {
  depends_on = [
    aws_api_gateway_integration.hello_integration,
    aws_api_gateway_integration.lambda_integration
  ]

  rest_api_id = aws_api_gateway_rest_api.my_api.id
  stage_name  = "prod"
}

#############################
# Outputs
#############################

output "api_gateway_url" {
  description = "URL del API Gateway"
  value       = aws_api_gateway_deployment.my_api_deployment.invoke_url
}

output "s3_bucket_name" {
  description = "Nombre del bucket S3"
  value       = aws_s3_bucket.my_bucket.bucket
}

output "dynamodb_table_name" {
  description = "Nombre de la tabla DynamoDB"
  value       = aws_dynamodb_table.my_table.name
}

output "lambda_hello_function_name" {
  description = "Nombre de la función Lambda"
  value       = aws_lambda_function.my_lambda_hello.function_name
}

output "lambda_proxy_function_name" {
  description = "Nombre de la función Lambda"
  value       = aws_lambda_function.my_lambda_proxy.function_name
}


