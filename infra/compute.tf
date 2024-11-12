
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
    buscar_restaurant = {
      name = "BuscarRestaurantLambda"
      code = data.archive_file.buscar_restaurant_zip.output_path
      source_code_hash = data.archive_file.buscar_restaurant_zip.output_base64sha256
    }
  }

  lambda_role_arn  = data.aws_iam_role.labrole.arn
  vpc_subnets      = module.vpc.private_subnets
  security_groups  = [aws_security_group.lambda_sg.id]
  functions_runtime = "python3.12"
}