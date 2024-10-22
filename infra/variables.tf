/*

variable "lambda_execution_role_arn" {
  description = "ARN del rol de IAM existente para la ejecución de Lambda"
  type        = string
}

*/

variable "region" {
  description = "La región de AWS donde se desplegarán los recursos"
  type = string
}