import boto3
from boto3.dynamodb.conditions import Key
import json
from datetime import datetime

dynamodb = boto3.resource('dynamodb')

def obtener_reservas(event, context):
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
    
    # Verificar si todos los campos están presentes y no vacíos
    campos_requeridos = ['user_id']
    campos_vacios = [campo for campo in campos_requeridos if not body.get(campo)]

    # Parámetros recibidos del usuario
    user_id = body['user_id']
    
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
