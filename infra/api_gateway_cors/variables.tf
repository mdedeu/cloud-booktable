variable "rest_api" {
  description = "REST API del API Gateway con su id y arn"
  type = object({
    id            = string
    execution_arn = string
  })
}

variable "resource_id" {
  description = "ID del recurso del API Gateway"
  type        = string
}

variable "methods" {
  description = "Mapa de los metodos HTTP a las funciones lambda"
  type = map(any)
}

variable "path" {
  description = "Path del recurso del API Gateway"
  type        = string
}

variable "stage" {
  description = "Nombre del stage para API Gateway"
  type        = string
}

variable "lambdaName" {
  description = "Nombre de la funcion Lambda"
  type        = string
}
