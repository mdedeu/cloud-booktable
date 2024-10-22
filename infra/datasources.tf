#############################
# Empaquetar el Código de Lambda
#############################
data "archive_file" "crear_mesa_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/crear-mesa"
  output_path = "${path.module}/../backend/crear-mesa/crear_mesa.zip"
}

data "archive_file" "crear_reserva_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/crear-reserva"
  output_path = "${path.module}/../backend/crear-reserva/crear_reserva.zip"
}

data "archive_file" "crear_restaurant_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/crear-restaurant"
  output_path = "${path.module}/../backend/crear-restaurant/crear_restaurant.zip"
}

data "archive_file" "frontend" {
  type        = "zip"
  source_dir  = "${path.module}/../frontend"
  output_path = "${path.module}/../frontend.zip"
}