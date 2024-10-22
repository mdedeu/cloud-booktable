#############################
# VPC y Subnets (ya existente)
#############################
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name = "my-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b"] //se pueden buscar 2 disponibles, con datasources
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
    to_port     = 443
    protocol    = "tcp"
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
  bucket = "frontend-bucket-cloudbooktable-matias"  

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
    file_hash       = data.archive_file.frontend.output_base64sha256
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
##########LAMBDAS 

#Lambda para Crear Mesa                                                                     
resource "aws_lambda_function" "admin_crear_mesa_lambda" {
  filename         = data.archive_file.admin_crear_mesa_zip.output_path
  function_name    = "CrearMesaLambda"
  role             = var.lambda_execution_role_arn
  handler          = "admin_crear_mesa.admin_crear_mesa"
  runtime          = "python3.12"    
  source_code_hash = data.archive_file.admin_crear_mesa_zip.output_base64sha256

 vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = {
    Name        = "Crear Mesa Lambda"
    Environment = "Dev"
  }
}

#Lambda para delete Reserva

resource "aws_lambda_function" "delete_reserva_lambda" {
  filename         = data.archive_file.delete_reserva_zip.output_path
  function_name    = "DeleteReservaLambda"
  role             = var.lambda_execution_role_arn
  handler          = "delete_reserva.delete_reserva"  
  runtime          = "python3.12"    
  source_code_hash = data.archive_file.delete_reserva_zip.output_base64sha256

 vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = {
    Name        = "Delete Reserva Lambda"
    Environment = "Dev"
  }
}

#Lambda para Crear Reserva                                                                   
resource "aws_lambda_function" "crear_reserva_lambda" {
  filename         = data.archive_file.crear_reserva_zip.output_path
  function_name    = "CrearReservaLambda"
  role             = var.lambda_execution_role_arn
  handler          = "crear_reserva.crear_reserva"
  runtime          = "python3.12"    
  source_code_hash = data.archive_file.crear_reserva_zip.output_base64sha256

 vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = {
    Name        = "Crear Reserva Lambda"
    Environment = "Dev"
  }
}

#Lambda para Crear Restaurante                                                                 
resource "aws_lambda_function" "admin_crear_restaurant_lambda" {
  filename         = data.archive_file.admin_crear_restaurant_zip.output_path
  function_name    = "CrearRestaurantLambda"
  role             = var.lambda_execution_role_arn
  handler          = "admin_crear_restaurant.admin_crear_restaurant"
  runtime          = "python3.12"    
  source_code_hash = data.archive_file.admin_crear_restaurant_zip.output_base64sha256

 vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = {
    Name        = "Crear Restaurant Lambda"
    Environment = "Dev"
  }
}

resource "aws_lambda_function" "obtener_reservas_lambda" {
  filename         = data.archive_file.obtener_reservas_zip.output_path
  function_name    = "ObtenerReservasLambda"
  role             = var.lambda_execution_role_arn
  handler          = "obtener_reservas.obtener_reservas"  
  runtime          = "python3.12"    
  source_code_hash = data.archive_file.obtener_reservas_zip.output_base64sha256

 vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = {
    Name        = "Obtener Reservas del Usuario Lambda"
    Environment = "Dev"
  }
}

resource "aws_lambda_function" "admin_obtener_reservas_lambda" {
  filename         = data.archive_file.admin_obtener_reservas_zip.output_path
  function_name    = "AdminObtenerReservasLambda"
  role             = var.lambda_execution_role_arn
  handler          = "admin_obtener_reservas.admin_obtener_reservas"  
  runtime          = "python3.12"    
  source_code_hash = data.archive_file.admin_obtener_reservas_zip.output_base64sha256

 vpc_config {
    subnet_ids         = module.vpc.private_subnets
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tags = {
    Name        = "Obtener Reservas del Restaurnt del dia Lambda"
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


# Recurso API Gateway para "/reservas"
resource "aws_api_gateway_resource" "reservas" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "reservas"
}

# Recurso API Gateway para /reservas/_id
resource "aws_api_gateway_resource" "delete_reserva" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_resource.reservas.id
  path_part   = "{id}"
}

# Recurso API Gateway para "/admin"
resource "aws_api_gateway_resource" "admin" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "admin"
}

# Recurso API Gateway para "/admin/restaurant"
resource "aws_api_gateway_resource" "admin_restaurant" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "restaurant"
}

# Recurso API Gateway para "/admin/mesas"
resource "aws_api_gateway_resource" "admin_mesas" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "mesas"
}

# Recurso API Gateway para "/admin/reservas"
resource "aws_api_gateway_resource" "admin_reservas" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "reservas"
}

module "reserva" {
  source = "./api_gateway_cors"  # Path to your module

  rest_api = {
    id            = "${aws_api_gateway_rest_api.my_api.id}"
    execution_arn = "${aws_api_gateway_rest_api.my_api.execution_arn}"
  }
  resource_id    = aws_api_gateway_resource.reservas.id
  methods   = {
    POST = aws_lambda_function.crear_reserva_lambda,
    GET = aws_lambda_function.obtener_reservas_lambda
  }  # List of HTTP methods you want to configure
  path        = "reservas"
  stage       = "prod"
  lambdaName  = "Reserva"
  depends_on = [ 
   aws_api_gateway_resource.reservas,
   aws_api_gateway_rest_api.my_api,
   aws_lambda_function.crear_reserva_lambda,
   aws_lambda_function.obtener_reservas_lambda
  ]
}

module "delete_reserva" {
  source = "./api_gateway_cors"  # Path to your module

  rest_api = {
    id            = "${aws_api_gateway_rest_api.my_api.id}"
    execution_arn = "${aws_api_gateway_rest_api.my_api.execution_arn}"
  }

  resource_id    = aws_api_gateway_resource.delete_reserva.id
  methods = {
    DELETE = aws_lambda_function.delete_reserva_lambda
  }
  path        = "reservas/{id}"
  stage       = "prod"
  lambdaName  = "DeleteReserva"
}

module "admin_restaurant" {
  source = "./api_gateway_cors"  # Path to your module

  rest_api = {
    id            = "${aws_api_gateway_rest_api.my_api.id}"
    execution_arn = "${aws_api_gateway_rest_api.my_api.execution_arn}"
  }

  resource_id    = aws_api_gateway_resource.admin_restaurant.id
  methods = {
    POST = aws_lambda_function.admin_crear_restaurant_lambda
  }
  path        = "admin/restaurant"
  stage       = "prod"
  lambdaName  = "CrearRestaurant"
}

module "admin_mesas" {
  source = "./api_gateway_cors"  # Path to your module

  rest_api = {
    id            = "${aws_api_gateway_rest_api.my_api.id}"
    execution_arn = "${aws_api_gateway_rest_api.my_api.execution_arn}"
  }

  resource_id    = aws_api_gateway_resource.admin_mesas.id
  methods = {
    POST = aws_lambda_function.admin_crear_mesa_lambda
  }
  path        = "admin/mesas"
  stage       = "prod"
  lambdaName  = "CrearMesa"
}

module "admin_reservas"{
   source = "./api_gateway_cors"  # Path to your module

  rest_api = {
    id            = "${aws_api_gateway_rest_api.my_api.id}"
    execution_arn = "${aws_api_gateway_rest_api.my_api.execution_arn}"
  }

  resource_id    = aws_api_gateway_resource.admin_reservas.id
  methods = {
    GET = aws_lambda_function.admin_obtener_reservas_lambda
  }
  path        = "admin/reservas"
  stage       = "prod"
  lambdaName  = "AdminObtenerReservas"
}


# Se asegura que el deployment de las lambda dependa primero de las integraciones con el Api Gateway
resource "aws_api_gateway_deployment" "my_api_deployment" {
  depends_on = [
    module.reserva, 
    module.admin_mesas,
    module.admin_reservas,
    module.admin_restaurant, 
    module.delete_reserva
  ]
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  stage_name  = "prod"

  triggers = {
    redeployment = sha1(jsonencode([
      module.reserva, 
      module.admin_mesas,
      module.admin_reservas,
      module.admin_restaurant, 
      module.delete_reserva
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}
