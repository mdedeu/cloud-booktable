import boto3
import json
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Key, Attr
import boto3.dynamodb.types


dynamodb = boto3.resource('dynamodb')


def admin_obtener_reservas(event, context):
    try:
        # Access query parameters with safe fallback
        params = event.get('queryStringParameters', {}) or {}

        campos_requeridos = ['localidad', 'categoria', 'nombre_restaurant', 'id_usuario']
        # Verify that all required fields are present and not empty
        campos_vacios = [campo for campo in campos_requeridos if not params.get(campo)]

        if campos_vacios:
            return {
                'statusCode': 400,
                'body': json.dumps(
                    f"Error: Todos los campos son requeridos. Los siguientes campos están vacíos o ausentes: {', '.join(campos_vacios)}"),
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'GET,OPTIONS'
                }
            }

        # Parameters received from the query string using get() for safety
        localidad = params.get('localidad')
        categoria = params.get('categoria')
        nombre_restaurant = params.get('nombre_restaurant')
        id_usuario = params.get('id_usuario')

        # Construct the partition key
        clave_compuesta = f'{localidad}#{categoria}#{nombre_restaurant}'

        today = datetime.utcnow() - timedelta(hours=3)  # Adjusting to GMT-3 as in creation
        today_str = today.strftime('%Y-%m-%d')

        # Initialize the table
        reservas_table = dynamodb.Table('RESERVAS')
        restaurantes_table = dynamodb.Table('RESTAURANTES')

        # Step 0: Verify that the restaurant exists in the RESTAURANTES table and belongs to user
        try:
            response_restaurante = restaurantes_table.get_item(
                KeyConditionExpression=Key('Localidad').eq(localidad) & Key('Categoria#Nombre_restaurant').eq(
                    f"{categoria}#{nombre_restaurant}"),
                FilterExpression=Attr('ID_Usuario').eq(id_usuario))

            if 'Item' not in response_restaurante:
                return {
                    'statusCode': 404,
                    'body': json.dumps(
                        f"Error: El restaurante '{nombre_restaurant}' con categoria '{categoria}' no existe en la localidad '{localidad}' para este usuario."),
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                        'Access-Control-Allow-Methods': 'OPTIONS,POST'
                    }
                }
        except Exception as e:
            return {
                'statusCode': 500,
                'body': json.dumps(f"Error consultando la tabla RESTAURANTES: {str(e)}"),
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST'
                }
            }

        # Step 1: Perform the query
        try:
            response = reservas_table.query(
                KeyConditionExpression=Key('Localidad#Categoria#Nombre_restaurant').eq(clave_compuesta) &
                                       Key('Fecha_hora#ID_Mesa').begins_with(today_str)
            )
            reservas = response.get('Items', [])
            json_data = boto3.dynamodb.types.TypeSerializer().serialize(reservas)

        except Exception as e:
            print(f"Query error: {str(e)}")  # Print the error for debugging
            return {
                'statusCode': 500,
                'body': json.dumps(f"Error al obtener las reservas: {str(e)}"),
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'GET,OPTIONS'
                }
            }

        # Step 2: Return the reservations
        return {
            'statusCode': 200,
            'body': json.dumps(json_data),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            }
        }
    except Exception as e:
        print(f"Unexpected error: {str(e)}")  # Print the error for debugging
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error inesperado: {str(e)}"),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            }
        }