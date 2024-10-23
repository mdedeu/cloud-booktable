resource "aws_dynamodb_table" "tables" {
  for_each = var.tables

  name         = each.key
  billing_mode = "PAY_PER_REQUEST"

  # Definimos la partition key
  attribute {
    name = each.value.pk
    type = each.value.pk_data_type
  }

  # Definimos la sort key
  attribute {
    name = each.value.sk
    type = each.value.sk_data_type
  }

  # Establecemos los anteriores como hash (pk) y range (sk) keys
  hash_key  = each.value.pk
  range_key = each.value.sk
}
