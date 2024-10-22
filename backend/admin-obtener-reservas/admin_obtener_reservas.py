import boto3
import json
from datetime import datetime
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')

def admin_obtener_reservas(event, context):
    # Verificar si todos los campos están presentes y no vacíos
    campos_vacios = [key for key, value in event.items() if not value]

    if campos_vacios:
        return {
            'statusCode': 400,
            'body': json.dumps(f"Error: Todos los campos son requeridos. Los siguientes campos estan vacios o ausentes: {', '.join(campos_vacios)}")
        }
    
    # Parámetros recibidos del usuario
    localidad = event['localidad']
    categoria = event['categoria']
    nombre_restaurant = event['nombre_restaurant']
    
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
            'body': json.dumps(f"Error al obtener las reservas: {str(e)}")
        }
    
    # Paso 2: Devolver las reservas
    return {
        'statusCode': 200,
        'body': json.dumps(reservas)
    }
