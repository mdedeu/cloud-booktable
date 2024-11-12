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

# Recurso API Gateway para "/restaurantes"
resource "aws_api_gateway_resource" "restaurantes" {
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  parent_id   = aws_api_gateway_rest_api.my_api.root_resource_id
  path_part   = "restaurantes"
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

module "restaurantes" {
  source = "./api_gateway_cors"

  rest_api = {
    id            = "${aws_api_gateway_rest_api.my_api.id}"
    execution_arn = "${aws_api_gateway_rest_api.my_api.execution_arn}"
  }
  resource_id    = aws_api_gateway_resource.restaurantes.id
  methods   = {
    GET = module.my_lambdas.lambda_functions["buscar_restaurant"]
  }
  path        = "restaurantes"
  stage       = "prod"
  lambdaName  = "BuscarRestaurant"
  depends_on = [ 
   aws_api_gateway_resource.restaurantes,
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
    module.admin_restaurant,
    module.restaurantes
  ]
  rest_api_id = aws_api_gateway_rest_api.my_api.id
  stage_name  = "prod"

  triggers = {
    redeployment = sha1(jsonencode([
      module.reserva, 
      module.admin_mesas,
      module.admin_reservas,
      module.admin_restaurant,
      module.restaurantes
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}