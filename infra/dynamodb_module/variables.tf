variable "tables" {
  description = "Map of DynamoDB tables to create."
  type = map(object({
    pk           = string  # Partition key
    pk_data_type = string  # Partition key data type
    sk           = string  # Sort key
    sk_data_type = string  # Sort key data type
  }))
}
