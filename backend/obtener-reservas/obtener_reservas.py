import boto3
from boto3.dynamodb.conditions import Key
import json
from datetime import datetime

dynamodb = boto3.resource('dynamodb')

def obtener_reservas(event, context):
    params = event.get('queryStringParameters')
    
    campos_requeridos = ['user_id']
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

    user_id = params.get('user_id')
    
    # Obtener la fecha y hora actual como timestamp
    fecha_hora_actual = int(datetime.now().timestamp()) 
    
    usuarios_table = dynamodb.Table('USUARIOS')
    
    # Paso 1: Hacer query en tabla USUARIOS
    try:
        response = usuarios_table.query(
            KeyConditionExpression=Key('ID_Usuario').eq(user_id) & Key('Fecha_hora').gte(fecha_hora_actual)
        )
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error consultando la tabla USUARIOS: {str(e)}"),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }
        }
    
    # Paso 2: Extraer las reservas vigentes
    reservas_vigentes = response.get('Items', [])
    json_data = boto3.dynamodb.types.TypeSerializer().serialize(reservas_vigentes)

    if reservas_vigentes:
        return {
            'statusCode': 200,
            'body': json.dumps(json_data),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }
        }
    else:
        return {
            'statusCode': 404,
            'body': json.dumps("No hay reservas vigentes para el usuario."),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }
        }
