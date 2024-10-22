import boto3
import json

dynamodb = boto3.resource('dynamodb')

def admin_crear_restaurant(event, context):
    # Parámetros recibidos del usuario
    localidad = event['localidad']
    categoria = event['categoria']
    nombre_restaurant = event['nombre_restaurant']
    id_usuario = event['id_usuario']
    
    # Inicialización de la tabla
    restaurant_table = dynamodb.Table('RESTAURANTES')
    
    # Paso 1: Crear el nuevo restaurante
    nuevo_restaurant = {
        'Localidad': localidad,
        'Categoria_Restaurant': f"{categoria}_{nombre_restaurant}",
        'ID_Usuario': id_usuario
    }
    
    try:
        restaurant_table.put_item(Item=nuevo_restaurant)
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error creando el restaurante: {str(e)}"),
             'headers': {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST'
    }

        }
    
    return {
        'statusCode': 201,
        'body': json.dumps("Restaurante creado exitosamente."),
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Headers': '*'
        }
    }