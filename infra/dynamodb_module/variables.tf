variable "tables" {
  description = "Mapa de las tablas de DyanmoDB a crear"
  type = map(object({
    pk           = string 
    pk_data_type = string  
    sk           = string 
    sk_data_type = string 
  }))
}
