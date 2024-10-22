variable "rest_api" {
  description = "The API Gateway Rest API object, including 'id' and 'execution_arn'."
  type = object({
    id            = string
    execution_arn = string
  })
}

variable "resource_id" {
  description = "The ID of the API Gateway resource."
  type        = string
}

variable "methods" {
  description = "Map of HTTP methods to Lambda function objects."
  type = map(any)
}

variable "path" {
  description = "The path of the API Gateway resource (e.g., 'admin/restaurant')."
  type        = string
}

variable "stage" {
  description = "The stage name of the API Gateway (e.g., 'prod')."
  type        = string
}

variable "lambdaName" {
  description = "The name of the Lambda function."
  type        = string
}
