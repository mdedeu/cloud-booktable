import boto3
import json
from datetime import datetime
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')

def admin_obtener_reservas(event, context):
    try:
        # Analizar el cuerpo de la solicitud
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'body': json.dumps("Error: Cuerpo de la solicitud no es un JSON válido."),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }
        }
    campos_requeridos =['localidad', 'categoria', 'nombre_restaurant']
    # Verificar si todos los campos están presentes y no vacíos
    campos_vacios = [campo for campo in campos_requeridos if not body.get(campo)]

    if campos_vacios:
        return {
            'statusCode': 400,
            'body': json.dumps(f"Error: Todos los campos son requeridos. Los siguientes campos estan vacios o ausentes: {', '.join(campos_vacios)}"),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }
        }
    
    # Parámetros recibidos del usuario
    localidad = body['localidad']
    categoria = body['categoria']
    nombre_restaurant = body['nombre_restaurant']
    
    # Construir la clave de partición
    clave_compuesta = f'{localidad}#{categoria}#{nombre_restaurant}'
    
    # Obtener la fecha de hoy en formato ISO 8601 (solo la fecha, sin la hora)
    fecha_hoy = datetime.now().strftime('%Y-%m-%d')  # Formato: 'YYYY-MM-DD'
    
    # Inicialización de la tabla
    reservas_table = dynamodb.Table('RESERVAS')
    
    # Paso 1: Realizar la consulta
    try:
        response = reservas_table.query(
            KeyConditionExpression=Key('Localidad#Categoria#Nombre_restaurant').eq(clave_compuesta) & 
                                   Key('Fecha_hora#ID_Mesa').begins_with(f'{fecha_hoy}')  # Solo reservas de hoy (YYYY-MM-DD)
        )
        reservas = response.get('Items', [])
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error al obtener las reservas: {str(e)}"),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }
        }
    
    # Paso 2: Devolver las reservas
    return {
        'statusCode': 200,
        'body': json.dumps(reservas),
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'OPTIONS,POST'
        }
    }
