import boto3
from boto3.dynamodb.conditions import Key
import json
from datetime import datetime

dynamodb = boto3.resource('dynamodb')

def obtener_reservas(event, context):
    # Parámetros recibidos del usuario
    user_id = event['user_id']
    
    # Obtener la fecha y hora actual como timestamp
    fecha_hora_actual = int(datetime.now().timestamp())  # Convertir a timestamp
    
    # Inicialización de la tabla
    usuarios_table = dynamodb.Table('USUARIOS')
    
    # Paso 1: Hacer query en tabla USUARIOS
    try:
        response = usuarios_table.query(
            KeyConditionExpression=Key('ID_Usuario').eq(user_id) & Key('Fecha_hora').gte(fecha_hora_actual)
        )
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error consultando la tabla USUARIOS: {str(e)}")
        }
    
    # Paso 2: Extraer las reservas vigentes
    reservas_vigentes = response.get('Items', [])
    
    if reservas_vigentes:
        return {
            'statusCode': 200,
            'body': json.dumps(reservas_vigentes)
        }
    else:
        return {
            'statusCode': 404,
            'body': json.dumps("No hay reservas vigentes para el usuario.")
        }
