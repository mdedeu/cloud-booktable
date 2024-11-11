#############################
# DynamoDB Table
#############################

module "dynamodb_tables" {
  source = "./dynamodb_module"

  tables = {
    "MESAS" = {
      pk            = "Localidad#Categoria#Nombre_restaurant"
      pk_data_type  = "S"     
      sk            = "ID_Mesa"
      sk_data_type  = "S"      
    }
    "RESTAURANTES" = {
      pk            = "Localidad"
      pk_data_type  = "S"    
      sk            = "Categoria#Nombre_restaurant"
      sk_data_type  = "S"     
    }
    "USUARIOS" = {
      pk            = "ID_Usuario"
      pk_data_type  = "S"    
      sk            = "Fecha_hora"
      sk_data_type  = "N"  
    }
    "RESERVAS" = {
      pk            = "Localidad#Categoria#Nombre_restaurant"
      pk_data_type  = "S"    
      sk            = "Fecha_hora#ID_Mesa"
      sk_data_type  = "S"      
    }
  }
}