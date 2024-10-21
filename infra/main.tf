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

resource "aws_s3_bucket" "frontend_bucket" {
  bucket = "frontend-bucket-cloudbooktable-marcos"  

  tags = {
    Name        = "Frontend Bucket"
    Environment = "Dev"
  }
}

resource "aws_s3_bucket_website_configuration" "frontend_bucket" {
  bucket = aws_s3_bucket.frontend_bucket.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

resource "aws_s3_bucket_public_access_block" "frontend_bucket_public_access" {
  bucket = aws_s3_bucket.frontend_bucket.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# Make sure the bucket policy depends on the public access block
resource "aws_s3_bucket_policy" "frontend_bucket_policy" {
  bucket = aws_s3_bucket.frontend_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.frontend_bucket.arn}/*"
      },
    ]
  })
  depends_on = [aws_s3_bucket_public_access_block.frontend_bucket_public_access]
}

# Null resource for building and deploying frontend
resource "null_resource" "frontend_deployment" {
  triggers = {
    api_gateway_url = aws_api_gateway_deployment.my_api_deployment.invoke_url
  }

  provisioner "local-exec" {
    command = <<EOT
      cd ${path.module}/../frontend
      echo "NEXT_PUBLIC_BACKEND_URL=${aws_api_gateway_deployment.my_api_deployment.invoke_url}" > .env
      npm run build
      aws s3 sync out s3://${aws_s3_bucket.frontend_bucket.id} --delete
    EOT
  }

  depends_on = [
    aws_api_gateway_deployment.my_api_deployment,
    aws_s3_bucket.frontend_bucket,
    aws_s3_bucket_policy.frontend_bucket_policy
  ]
}
#############################
# DynamoDB Table
#############################
# RESERVAS Table
resource "aws_dynamodb_table" "reservas_table" {
  name         = "RESERVAS"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Nombre_restaurant"
  range_key    = "Fecha_hora"

  attribute {
    name = "Nombre_restaurant"
    type = "S"
  }
  
  attribute {
    name = "Fecha_hora"
    type = "N"
  }

  tags = {
    Name        = "Tabla Reservas"
    Environment = "Dev"
  }
}

# MESAS Table
resource "aws_dynamodb_table" "mesas_table" {
  name         = "MESAS"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Nombre_restaurant"
  range_key    = "Capacidad"

  attribute {
    name = "Nombre_restaurant"
    type = "S"
  }

  attribute {
    name = "Capacidad"
    type = "N"
  }

  tags = {
    Name        = "Tabla Mesas"
    Environment = "Dev"
  }
}

# USUARIOS Table
resource "aws_dynamodb_table" "usuarios_table" {
  name         = "USUARIOS"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ID_Usuario"
  range_key    = "Fecha_hora"

  attribute {
    name = "ID_Usuario"
    type = "S"
  }

  attribute {
    name = "Fecha_hora"
    type = "N"
  }

  tags = {
    Name        = "Tabla Usuarios"
    Environment = "Dev"
  }
}

# RESTAURANTES Table
resource "aws_dynamodb_table" "restaurantes_table" {
  name         = "RESTAURANTES"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "Localidad"
  range_key    = "Categoria_Restaurant"
  
  attribute {
    name = "Localidad"
    type = "S"
  }

  attribute {
    name = "Categoria_Restaurant"
    type = "S"
  }

  tags = {
    Name        = "Tabla Restaurantes"
    Environment = "Dev"
  }
}

#############################
# Lambda Functions
#############################

#Lambda para Hello                                                                     
resource "aws_lambda_function" "crear_mesa_lambda" {
  filename         = data.archive_file.crear_mesa_zip.output_path
  function_name    = "CrearMesaLambda"
  role             = var.lambda_execution_role_arn
  handler          = "crear_mesa.crear_mesa"  
  runtime          = "python3.12"    
  source_code_hash = data.archive_file.crear_mesa_zip.output_base64sha256

 vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = {
    Name        = "Crear Mesa Lambda"
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
  http_method   = "POST"
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

resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  resource_id = aws_api_gateway_resource.hello.id
  http_method = aws_api_gateway_method.hello_method.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.crear_mesa_lambda.invoke_arn
}

# Make sure the deployment depends on the integration
resource "aws_api_gateway_deployment" "my_api_deployment" {
  depends_on = [aws_api_gateway_integration.lambda_integration]

  rest_api_id = aws_api_gateway_rest_api.my_api.id
  stage_name  = "prod"
}