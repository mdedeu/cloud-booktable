import boto3
import json
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')


def admin_obtener_reservas(event, context):
    # Access query parameters
    params = event.get('queryStringParameters', {}) or {}

    campos_requeridos = ['localidad', 'categoria', 'nombre_restaurant']
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

    # Parameters received from the query string
    localidad = params.get('localidad')
    categoria = params.get('categoria')
    nombre_restaurant = params.get('nombre_restaurant')

    # Construct the partition key
    clave_compuesta = f'{localidad}#{categoria}#{nombre_restaurant}'

    # Get today's date in ISO 8601 format (only date, without time)
    fecha_hoy = (datetime.now() - timedelta(hours=3)).strftime('%Y-%m-%d')

    # Initialize the table
    reservas_table = dynamodb.Table('RESERVAS')

    # Step 1: Perform the query
    try:
        response = reservas_table.query(
            KeyConditionExpression=Key('Localidad#Categoria#Nombre_restaurant').eq(clave_compuesta) &
                                   Key('Fecha_hora#ID_Mesa').begins_with(f'{fecha_hoy}')  # Only today's reservations
        )
        reservas = response.get('Items', [])
    except Exception as e:
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
        'body': json.dumps(reservas),
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,OPTIONS'
        }
    }
