import boto3
from boto3.dynamodb.conditions import Key
import json
from datetime import datetime, timedelta  # Importa el módulo datetime

dynamodb = boto3.resource('dynamodb')

def delete_reserva(event, context):
    try:

        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'body': json.dumps("Error: Cuerpo de la solicitud no es un JSON válido."),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,DELETE'
            }
        }
    
    # Verificar si todos los campos están presentes y no vacíos
    campos_requeridos = ['user_id', 'datetime']
    campos_vacios = [campo for campo in campos_requeridos if not body.get(campo)]

    if campos_vacios:
        return {
            'statusCode': 400,
            'body': json.dumps(f"Error: Todos los campos son requeridos. Los siguientes campos estan vacios o ausentes: {', '.join(campos_vacios)}"),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,DELETE'
            }
        }
        
    user_id = body['user_id']
    fecha_hora_timestamp = int(body['datetime'])
    fecha_hora_utc = datetime.utcfromtimestamp(fecha_hora_timestamp)
    fecha_hora_gmt3 = (fecha_hora_utc - timedelta(hours=3)).isoformat()

    usuarios_table = dynamodb.Table('USUARIOS')
    reservas_table = dynamodb.Table('RESERVAS')
    
    # Paso 1: Buscar la reserva en la tabla USUARIOS usando la fecha_hora
    try:
        response_usuario = usuarios_table.query(
            KeyConditionExpression=Key('ID_Usuario').eq(user_id) & Key('Fecha_hora').eq(fecha_hora_timestamp)  # Buscar por ID_Usuario y Fecha_hora
        )
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error consultando la tabla USUARIOS: {str(e)}"),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,DELETE'
            }
        }
    
    # Extraer los detalles de la reserva
    reservas_usuario = response_usuario.get('Items', [])
    
    if not reservas_usuario:
        return {
            'statusCode': 404,
            'body': json.dumps("No se encontró la reserva para el usuario."),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,DELETE'
            }
        }
    
    # Obtener detalles de la reserva
    reserva = reservas_usuario[0]
    
    # Extraer atributos de la reserva
    localidad = reserva['Localidad']
    categoria = reserva['Categoria']
    nombre_restaurant = reserva['Nombre_restaurant']
    id_mesa = reserva['ID_Mesa']

    # Clave compuesta para la tabla RESERVAS
    clave_compuesta = f"{localidad}#{categoria}#{nombre_restaurant}"
    
    # Paso 2: Borrar la reserva de la tabla RESERVAS
    try:
        reservas_table.delete_item(
            Key={
                'Localidad#Categoria#Nombre_restaurant': clave_compuesta, #PK
                'Fecha_hora#ID_Mesa': f"{fecha_hora_gmt3}#{id_mesa}"  #SK
            }
        )
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error borrando la reserva de la tabla RESERVAS: {str(e)}"),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,DELETE'
            }
        }
    
    # Paso 3: Borrar la entrada del usuario en la tabla USUARIOS
    try:
        usuarios_table.delete_item(
            Key={
                'ID_Usuario': user_id, 
                'Fecha_hora': fecha_hora_timestamp 
            }
        )
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error borrando la reserva de la tabla USUARIOS: {str(e)}"),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,DELETE'
            }
        }
    
    return {
        'statusCode': 200,
        'body': json.dumps("Reserva borrada exitosamente."),
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'OPTIONS,DELETE'
        }
    }
