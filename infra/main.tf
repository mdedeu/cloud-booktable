#############################
# VPC y Subnets (ya existente)
#############################
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "my-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]

  enable_nat_gateway = false
  enable_vpn_gateway = false

  tags = {
    Terraform = "true"
    Environment = "dev"
  }
}

# Security Groups
resource "aws_security_group" "lambda_sg" {
  name        = "lambda_sg"
  description = "Security group for Lambda functions"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [module.vpc.vpc_cidr_block]
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

# VPC Endpoints
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.us-east-1.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = module.vpc.private_route_table_ids

  tags = {
    Name = "S3 VPC Endpoint"
  }
}

resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.us-east-1.dynamodb"
  vpc_endpoint_type = "Gateway"

  route_table_ids = module.vpc.private_route_table_ids

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
  range_key = "Fecha_hora"

  attribute {
    name = "Nombre_restaurant"
    type = "S"
  }
  
  attribute {
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
  range_key = "Capacidad"

  attribute {
    name = "Nombre_restaurant"
    type = "S"
  }

  attribute {
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
  range_key = "Fecha_hora"

  attribute {
    name = "ID_Usuario"
    type = "S"
  }

  attribute {
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
    name = "Localidad"
    type = "S"
  }

  attribute {
    name = "Categoria_Restaurant"
    type = "S"
  }

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
data "archive_file" "crear_mesa_zip" {
  type        = "zip"
  source_dir  = "${path.module}/crear-mesa"
  output_path = "${path.module}/crear_mesa_code/crear_mesa.zip"
}

#############################
# Lambda Functions
#############################

#En esta parte hago lambda para una ruta en especifico o para un proxy que basicamente te redirige cualquier endpoint que le metas a la funcion lambda (el proxy)
#Lambda para Hello                                                                     
resource "aws_lambda_function" "crear_mesa_lambda" {
  filename         = data.archive_file.crear_mesa_zip.output_path
  function_name    = "CrearMesaLambda"
  role             = var.lambda_execution_role_arn
  handler          = "index.handler"  
  runtime          = "nodejs20.x"    
  source_code_hash = data.archive_file.crear_mesa_zip.output_base64sha256

 vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = {
    Name        = "Mi Función Lambda Hello"
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

# Permisos para que API Gateway invoque Lambda
resource "aws_lambda_permission" "api_gateway_hello" {
  statement_id  = "AllowAPIGatewayInvokeHello"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.crear_mesa_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn = "${aws_api_gateway_rest_api.my_api.execution_arn}/prod/GET/hello"

}

resource "aws_api_gateway_deployment" "my_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  stage_name  = "prod"
}
