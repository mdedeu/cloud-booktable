#############################
# Empaquetar el Código de Lambda
#############################
data "archive_file" "crear_mesa_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/crear-mesa"
  output_path = "${path.module}/../backend/crear-mesa/crear_mesa.zip"
}