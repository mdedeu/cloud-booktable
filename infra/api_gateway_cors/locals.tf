# Set de la lista de metodos HTTP para eliminar duplicados
locals {
  http_methods_set = toset(keys(var.methods))
  allowed_methods = join(",", concat(keys(var.methods), ["OPTIONS"]))
}