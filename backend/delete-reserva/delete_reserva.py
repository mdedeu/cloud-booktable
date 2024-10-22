import boto3
from boto3.dynamodb.conditions import Key
import json
from datetime import datetime  # Importa el módulo datetime

dynamodb = boto3.resource('dynamodb')

def delete_reserva(event, context):
    # Verificar si todos los campos están presentes y no vacíos
    campos_vacios = [key for key, value in event.items() if not value]

    if campos_vacios:
        return {
            'statusCode': 400,
            'body': json.dumps(f"Error: Todos los campos son requeridos. Los siguientes campos estan vacios o ausentes: {', '.join(campos_vacios)}")
        }
        
    # Parámetros recibidos del usuario
    user_id = event['user_id']
    fecha_hora = event['datetime']
    fecha_hora_timestamp = int(datetime.strptime(fecha_hora, "%Y-%m-%dT%H:%M:%SZ").timestamp()) # Asegúrate de que el formato es el correcto (e.g., ISO 8601)
    
    # Inicialización de las tablas
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
            'body': json.dumps(f"Error consultando la tabla USUARIOS: {str(e)}")
        }
    
    # Extraer los detalles de la reserva
    reservas_usuario = response_usuario.get('Items', [])
    
    if not reservas_usuario:
        return {
            'statusCode': 404,
            'body': json.dumps("No se encontró la reserva para el usuario.")
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
                'Fecha_hora#ID_Mesa': f"{fecha_hora}#{id_mesa}"  #SK
            }
        )
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error borrando la reserva de la tabla RESERVAS: {str(e)}")
        }
    
    # Paso 3: Borrar la entrada del usuario en la tabla USUARIOS
    try:
        usuarios_table.delete_item(
            Key={
                'ID_Usuario': user_id,  # PK
                'Fecha_hora': fecha_hora_timestamp  # SK
            }
        )
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error borrando la reserva de la tabla USUARIOS: {str(e)}")
        }
    
    return {
        'statusCode': 200,
        'body': json.dumps("Reserva borrada exitosamente.")
    }
