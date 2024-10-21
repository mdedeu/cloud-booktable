import boto3
from boto3.dynamodb.conditions import Key, Attr
import uuid  # Para generar IDs únicos
import json
from datetime import datetime  # Importa el módulo datetime

dynamodb = boto3.resource('dynamodb')

def crear_reserva(event, context):
    # Parámetros recibidos del usuario
    restaurant_name = event['restaurant_name']
    fecha_hora = int(datetime.strptime(event['datetime'], "%Y-%m-%dT%H:%M:%SZ").timestamp())  # Asegúrate de que el formato es el correcto (e.g., ISO 8601)
    comensales = event['comensales']
    user_name = event['name']
    user_email = event['email']
    
    # Inicialización de las tablas
    reservas_table = dynamodb.Table('RESERVAS')
    mesas_table = dynamodb.Table('MESAS')
    usuarios_table = dynamodb.Table('USUARIOS')
    
    # Paso 1: Hacer query en tabla RESERVAS para obtener mesas ocupadas
    try:
        response_reservas = reservas_table.query(
            KeyConditionExpression=Key('Nombre_restaurant').eq(restaurant_name) & Key('Fecha_hora').eq(fecha_hora)
        )
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error consultando la tabla RESERVAS: {str(e)}")
        }
    
    # Paso 2: Extraemos los table_ids ocupados
    reservas = response_reservas.get('Items', [])
    table_ids_ocupados = [reserva['ID_Mesa'] for reserva in reservas]
    
    # Paso 3: Hacer query en tabla MESAS para buscar mesas disponibles
    try:
        response_mesas = mesas_table.query(
            KeyConditionExpression=Key('Nombre_restaurant').eq(restaurant_name) & 
                                  Key('Capacidad').gte(comensales)  # Filtra por capacidad como parte de la clave
        )
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error consultando la tabla MESAS: {str(e)}")
        }
    
    # Filtrar las mesas ocupadas
    mesas_disponibles = [mesa for mesa in response_mesas.get('Items', []) if mesa['ID_Mesa'] not in table_ids_ocupados]
    
    # Paso 4: Comprobamos si hay mesas disponibles
    
    if mesas_disponibles:
        # Seleccionamos la primera mesa disponible
        mesa_seleccionada = mesas_disponibles[0]
        table_id = mesa_seleccionada['ID_Mesa']
        
        # Generamos un ID único para la reserva
        reserva_id = str(uuid.uuid4())
        
        # Paso 5a: Crear nueva reserva en la tabla RESERVAS
        try:
            reservas_table.put_item(
                Item={
                    'Nombre_restaurant': restaurant_name,
                    'Fecha_hora': fecha_hora,
                    'ID_Mesa': table_id,
                    'Nombre_usuario': user_name,
                    'Mail_usuario': user_email,
                    'ID_Reserva': reserva_id
                }
            )
        except Exception as e:
            return {
                'statusCode': 500,
                'body': json.dumps(f"Error creando la reserva en la tabla RESERVAS: {str(e)}")
            }
        
        # Paso 5b: Asociar la reserva al usuario en la tabla USUARIO
        try:
            usuarios_table.put_item(
                Item={
                    'ID_Usuario': user_email,
                    'Fecha_hora': fecha_hora,
                    'ID_Reserva': reserva_id
                }
            )
        except Exception as e:
            return {
                'statusCode': 500,
                'body': json.dumps(f"Error creando la reserva en la tabla USUARIO: {str(e)}")
            }
        
        return {
            'statusCode': 200,
            'body': json.dumps(f"Reserva creada exitosamente en la mesa {table_id} para {user_name}.")
        }
    else:
        # No hay mesas disponibles
        return {
            'statusCode': 400,
            'body': json.dumps("No hay mesas disponibles para la cantidad de comensales en el horario seleccionado.")
        }
