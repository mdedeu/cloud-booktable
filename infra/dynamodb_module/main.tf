resource "aws_dynamodb_table" "tables" {
  for_each = var.tables  # Use the variable defined in variables.tf

  name         = each.key
  billing_mode = "PAY_PER_REQUEST"

  # Define the partition key (primary key)
  attribute {
    name = each.value.pk
    type = each.value.pk_data_type
  }

  # Define the sort key
  attribute {
    name = each.value.sk
    type = each.value.sk_data_type
  }

  # Define the key schema
  hash_key  = each.value.pk
  range_key = each.value.sk
}
