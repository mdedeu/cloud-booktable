import boto3
import json

dynamodb = boto3.resource('dynamodb')

def admin_crear_restaurant(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        localidad = body.get('localidad')
        categoria = body.get('categoria')
        nombre_restaurant = body.get('nombre_restaurant')
        id_usuario = body.get('id_usuario')
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'body': json.dumps("Error: El cuerpo de la solicitud no es un JSON válido."),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }
        }

    # Validar los parametros requeridos
    if not all([localidad, categoria, nombre_restaurant, id_usuario]):
        return {
            'statusCode': 400,
            'body': json.dumps("Error: 'localidad', 'categoria', 'nombre_restaurant' y 'id_usuario' son requeridos."),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }
        }

    # Inicializacion de la tabla
    restaurant_table = dynamodb.Table('RESTAURANTES')

    # Crear el nuevo item de restaurante
    nuevo_restaurant = {
        'Localidad': localidad,
        'Categoria_Restaurant': f"{categoria}_{nombre_restaurant}",
        'ID_Usuario': id_usuario
    }

    # Insertar el nuevo restaurante en la tabla RESTAURANTES
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
