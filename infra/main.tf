#############################
# VPC y Subnets
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
  bucket = "frontend-bucket-cloudbooktable-grupo4"

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

#############################
# Cognito
#############################

# User pool
resource "aws_cognito_user_pool" "my_user_pool" {
  name = "userpool-booktable"  

  username_attributes = ["email"]
  auto_verified_attributes = ["email"] 

  mfa_configuration = "OPTIONAL"

  software_token_mfa_configuration {
    enabled = true
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  user_attribute_update_settings {
    attributes_require_verification_before_update = ["email"]
  }

  schema {
    attribute_data_type = "String"
    name     = "userType" 
    developer_only_attribute = false
    required                 = false
    mutable                  = true
    string_attribute_constraints {}
  }

  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

}

resource "aws_cognito_user_pool_client" "react_client" {
  
  name         = "react-client"
  user_pool_id = aws_cognito_user_pool.my_user_pool.id

  explicit_auth_flows = [
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  prevent_user_existence_errors = "ENABLED"
  generate_secret = false
    
  depends_on = [ aws_cognito_user_pool.my_user_pool ]

}

resource "null_resource" "frontend_deployment" {
  triggers = {
    api_gateway_url = aws_api_gateway_deployment.my_api_deployment.invoke_url
    file_hash       = data.archive_file.frontend.output_base64sha256
    user_pool_id    = aws_cognito_user_pool.my_user_pool.id,
    client_id = aws_cognito_user_pool_client.react_client.id
    build_number    = timestamp() 
  }

  provisioner "local-exec" {
    command = <<EOT
      cd ${path.module}/../frontend
      echo "NEXT_PUBLIC_BACKEND_URL=${aws_api_gateway_deployment.my_api_deployment.invoke_url}" > .env
      echo "NEXT_PUBLIC_AWS_REGION=us-east-1" >> .env
      echo "NEXT_PUBLIC_COGNITO_USER_POOL_ID=${aws_cognito_user_pool.my_user_pool.id}" >> .env
      echo "NEXT_PUBLIC_COGNITO_CLIENT_ID=${aws_cognito_user_pool_client.react_client.id}" >> .env
      rm -rf out/
      npm run build
      aws s3 rm s3://${aws_s3_bucket.frontend_bucket.id} --recursive
      aws s3 sync out s3://${aws_s3_bucket.frontend_bucket.id}
    EOT
  }

  depends_on = [
    aws_api_gateway_deployment.my_api_deployment,
    aws_s3_bucket.frontend_bucket,
    aws_s3_bucket_policy.frontend_bucket_policy,
    aws_cognito_user_pool.my_user_pool,
    aws_cognito_user_pool_client.react_client,
  ]
}

#############################
# DynamoDB Table
#############################

module "dynamodb_tables" {
  source = "./dynamodb_module"

  tables = {
    "MESAS" = {
      pk            = "Localidad#Categoria#Nombre_restaurant"
      pk_data_type  = "S"     
      sk            = "ID_Mesa"
      sk_data_type  = "S"      
    }
    "RESTAURANTES" = {
      pk            = "Localidad"
      pk_data_type  = "S"    
      sk            = "Categoria#Nombre_restaurant"
      sk_data_type  = "S"     
    }
    "USUARIOS" = {
      pk            = "ID_Usuario"
      pk_data_type  = "S"    
      sk            = "Fecha_hora"
      sk_data_type  = "N"  
    }
    "RESERVAS" = {
      pk            = "Localidad#Categoria#Nombre_restaurant"
      pk_data_type  = "S"    
      sk            = "Fecha_hora#ID_Mesa"
      sk_data_type  = "S"      
    }
  }
}

#############################
# Lambdas
#############################

# Creacion de las lambdas con modulo

module "my_lambdas" {
  source = "./lambda_module"

  lambda_functions = {
    admin_crear_mesa = {
      name = "CrearMesaLambda"
      code = data.archive_file.admin_crear_mesa_zip.output_path
      source_code_hash = data.archive_file.admin_crear_mesa_zip.output_base64sha256
    }
    delete_reserva = {
      name = "DeleteReservaLambda"
      code = data.archive_file.delete_reserva_zip.output_path
      source_code_hash = data.archive_file.delete_reserva_zip.output_base64sha256
    }
    crear_reserva = {
      name = "CrearReservaLambda"
      code = data.archive_file.crear_reserva_zip.output_path
      source_code_hash = data.archive_file.crear_reserva_zip.output_base64sha256
    }
    admin_crear_restaurant = {
      name = "CrearRestaurantLambda"
      code = data.archive_file.admin_crear_restaurant_zip.output_path
      source_code_hash = data.archive_file.admin_crear_restaurant_zip.output_base64sha256
    }
    obtener_reservas = {
      name = "ObtenerReservasLambda"
      code = data.archive_file.obtener_reservas_zip.output_path
      source_code_hash = data.archive_file.obtener_reservas_zip.output_base64sha256
    }
    admin_obtener_reservas = {
      name = "AdminObtenerReservasLambda"
      code = data.archive_file.admin_obtener_reservas_zip.output_path
      source_code_hash = data.archive_file.admin_obtener_reservas_zip.output_base64sha256
    }
  }

  lambda_role_arn  = data.aws_iam_role.labrole.arn
  vpc_subnets      = module.vpc.private_subnets
  security_groups  = [aws_security_group.lambda_sg.id]
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
  source = "./api_gateway_cors"

  rest_api = {
    id            = "${aws_api_gateway_rest_api.my_api.id}"
    execution_arn = "${aws_api_gateway_rest_api.my_api.execution_arn}"
  }
  resource_id    = aws_api_gateway_resource.reservas.id
  methods   = {
    POST = module.my_lambdas.lambda_functions["crear_reserva"],
    GET = module.my_lambdas.lambda_functions["obtener_reservas"],
    DELETE = module.my_lambdas.lambda_functions["delete_reserva"]
  }
  path        = "reservas"
  stage       = "prod"
  lambdaName  = "Reserva"
  depends_on = [ 
   aws_api_gateway_resource.reservas,
   aws_api_gateway_rest_api.my_api,
   module.my_lambdas.lambda_functions
  ]
}

module "admin_restaurant" {
  source = "./api_gateway_cors"

  rest_api = {
    id            = "${aws_api_gateway_rest_api.my_api.id}"
    execution_arn = "${aws_api_gateway_rest_api.my_api.execution_arn}"
  }

  resource_id    = aws_api_gateway_resource.admin_restaurant.id
  methods = {
    POST = module.my_lambdas.lambda_functions["admin_crear_restaurant"]
  }
  path        = "admin/restaurant"
  stage       = "prod"
  lambdaName  = "CrearRestaurant"
  depends_on = [ 
   aws_api_gateway_resource.admin_restaurant,
   aws_api_gateway_rest_api.my_api,
   module.my_lambdas.lambda_functions
  ]
}

module "admin_mesas" {
  source = "./api_gateway_cors" 

  rest_api = {
    id            = "${aws_api_gateway_rest_api.my_api.id}"
    execution_arn = "${aws_api_gateway_rest_api.my_api.execution_arn}"
  }

  resource_id    = aws_api_gateway_resource.admin_mesas.id
  methods = {
    POST = module.my_lambdas.lambda_functions["admin_crear_mesa"]
  }
  path        = "admin/mesas"
  stage       = "prod"
  lambdaName  = "CrearMesa"
  depends_on = [ 
   aws_api_gateway_resource.admin_mesas,
   aws_api_gateway_rest_api.my_api,
   module.my_lambdas.lambda_functions
  ]
}

module "admin_reservas"{
   source = "./api_gateway_cors"

  rest_api = {
    id            = "${aws_api_gateway_rest_api.my_api.id}"
    execution_arn = "${aws_api_gateway_rest_api.my_api.execution_arn}"
  }

  resource_id    = aws_api_gateway_resource.admin_reservas.id
  methods = {
    GET = module.my_lambdas.lambda_functions["admin_obtener_reservas"]
  }
  path        = "admin/reservas"
  stage       = "prod"
  lambdaName  = "AdminObtenerReservas"
  depends_on = [ 
   aws_api_gateway_resource.admin_reservas,
   aws_api_gateway_rest_api.my_api,
   module.my_lambdas.lambda_functions
  ]
}


# Se asegura que el deployment de las lambda dependa primero de las integraciones con el Api Gateway
resource "aws_api_gateway_deployment" "my_api_deployment" {
  depends_on = [
    module.reserva, 
    module.admin_mesas,
    module.admin_reservas,
    module.admin_restaurant
  ]
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  stage_name  = "prod"

  triggers = {
    redeployment = sha1(jsonencode([
      module.reserva, 
      module.admin_mesas,
      module.admin_reservas,
      module.admin_restaurant
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}