#############################
# Empaquetar el Código de Lambda
#############################
data "archive_file" "admin_crear_mesa_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/admin-crear-mesa"
  output_path = "${path.module}/../backend/admin-crear-mesa/admin_crear_mesa.zip"
}

data "archive_file" "crear_reserva_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/crear-reserva"
  output_path = "${path.module}/../backend/crear-reserva/crear_reserva.zip"
}

data "archive_file" "admin_crear_restaurant_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/admin-crear-restaurant"
  output_path = "${path.module}/../backend/admin-crear-restaurant/admin_crear_restaurant.zip"
}

data "archive_file" "delete_reserva_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/delete-reserva"
  output_path = "${path.module}/../backend/delete-reserva/delete_reserva.zip"
}

data "archive_file" "obtener_reservas_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/obtener-reservas"
  output_path = "${path.module}/../backend/obtener-reservas/obtener_reservas.zip"
}

data "archive_file" "admin_obtener_reservas_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/admin-obtener-reservas"
  output_path = "${path.module}/../backend/admin-obtener-reservas/admin_obtener_reservas.zip"
}

data "archive_file" "frontend" {
  type        = "zip"
  source_dir  = "${path.module}/../frontend"
  output_path = "${path.module}/../frontend/frontend.zip"
}

####### Datasource para reutilizar el LabRole #######
data "aws_iam_role" "labrole" {
  name = "LabRole"
}

####### Region actual ############
data "aws_region" "current" {}