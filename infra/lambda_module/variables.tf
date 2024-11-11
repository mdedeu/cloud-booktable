variable "lambda_functions" {
  description = "Mapa de las funciones Lambda con sus respectivos nombres, directorio del codigo y code hash"
  type = map(object({
    name = string
    code = string
    source_code_hash = string
  }))
}

variable "lambda_role_arn" {
  description = "ARN del IAM role (LabRole) que van a usar las Lambdas"
  type        = string
}

variable "vpc_subnets" {
  description = "Subnets donde se guardan las Lambdas"
  type        = list(string)
}

variable "security_groups" {
  description = "Security groups para las Lambdas de la VPC"
  type        = list(string)
}
variable "functions_runtime" {
  description = "Runtime"
  type = string
}