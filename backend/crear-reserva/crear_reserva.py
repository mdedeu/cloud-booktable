import boto3
from boto3.dynamodb.conditions import Key, Attr
import json
from datetime import datetime, timedelta

dynamodb = boto3.resource('dynamodb')

def crear_reserva(event, context):
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
    campos_requeridos = ['localidad', 'categoria', 'nombre_restaurant', 'datetime', 'comensales', 'user_id', 'user_name', 'email']
    campos_vacios = [campo for campo in campos_requeridos if not body.get(campo)]

    if campos_vacios:
        return {
            'statusCode': 400,
            'body': json.dumps(f"Error: Todos los campos son requeridos. Los siguientes campos están vacíos o ausentes: {', '.join(campos_vacios)}"),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }
        }
 
    localidad = body['localidad']
    categoria = body['categoria']
    nombre_restaurant = body['nombre_restaurant']
    fecha_hora_timestamp = int(body['datetime'])
    fecha_hora_utc = datetime.utcfromtimestamp(fecha_hora_timestamp)
    fecha_hora_gmt3 = (fecha_hora_utc - timedelta(hours=3)).isoformat()
    comensales = int(body['comensales'])
    user_id = body['user_id']
    user_name = body['user_name']
    user_email = body['email']
    

    reservas_table = dynamodb.Table('RESERVAS')
    mesas_table = dynamodb.Table('MESAS')
    usuarios_table = dynamodb.Table('USUARIOS')
    restaurantes_table = dynamodb.Table('RESTAURANTES')
    
    # Paso 0: Verificar si el usuario ya tiene una reserva en esa fecha y hora
    try:
        response_usuario = usuarios_table.get_item(
            Key={
                'ID_Usuario': user_id,
                'Fecha_hora': fecha_hora_timestamp
            }
        )
        
        # Verificar si existe una reserva
        if 'Item' in response_usuario:
            return {
                'statusCode': 400,
                'body': json.dumps(f"Error: El usuario '{user_name}' ya tiene una reserva en la fecha y hora seleccionadas."),
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST'
                }
            }
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
    
    # Paso 1: Verificar si el restaurante existe en la tabla RESTAURANTES
    try:
        response_restaurante = restaurantes_table.get_item(
            Key={
                'Localidad': localidad,            
                'Categoria#Nombre_restaurant': f"{categoria}#{nombre_restaurant}"  
            }
        )
        # Verificar si existe el restaurante
        if 'Item' not in response_restaurante:
            return {
                'statusCode': 404,
                'body': json.dumps(f"Error: El restaurante '{nombre_restaurant}' con categoria '{categoria}' no existe en la localidad '{localidad}'."),
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
    
    # Paso 2: Hacer query en tabla RESERVAS para obtener mesas ocupadas
    clave_compuesta = f"{localidad}#{categoria}#{nombre_restaurant}"
    
    try:
        # Vamos a consultar todas las reservas que coinciden con la clave primaria y tienen la misma fecha
        response_reservas = reservas_table.query(
            KeyConditionExpression=Key('Localidad#Categoria#Nombre_restaurant').eq(clave_compuesta) & 
                                   Key('Fecha_hora#ID_Mesa').begins_with(f"{fecha_hora_gmt3}#")
        )
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error consultando la tabla RESERVAS: {str(e)}"),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }

        }
    
    # Paso 3: Extraemos los table_ids ocupados del atributo ID_Mesa
    reservas = response_reservas.get('Items', [])
    table_ids_ocupados = [reserva['ID_Mesa'] for reserva in reservas]
    
    # Paso 4: Hacer query en tabla MESAS para buscar mesas disponibles
    try:
        response_mesas = mesas_table.query(
            KeyConditionExpression=Key('Localidad#Categoria#Nombre_restaurant').eq(clave_compuesta),
            FilterExpression=Attr('Capacidad').gte(comensales)  # Filtra por capacidad como atributo
        )
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error consultando la tabla MESAS: {str(e)}"),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }
        }
    
    # Filtrar las mesas ocupadas
    mesas_disponibles = [mesa for mesa in response_mesas.get('Items', []) if mesa['ID_Mesa'] not in table_ids_ocupados]
    
    # Paso 5: Comprobamos si hay mesas disponibles
    
    if mesas_disponibles:
        # Seleccionamos la primera mesa disponible
        mesa_seleccionada = mesas_disponibles[0]
        table_id = mesa_seleccionada['ID_Mesa']
        
        # Paso 6a: Crear nueva reserva en la tabla RESERVAS
        try:
            reservas_table.put_item(
                Item={
                    'Localidad#Categoria#Nombre_restaurant': clave_compuesta,
                    'Fecha_hora#ID_Mesa': f"{fecha_hora_gmt3}#{table_id}",
                    'Fecha_hora': fecha_hora_gmt3,
                    'ID_Mesa': table_id,
                    'Nombre_usuario': user_name,
                    'Mail_usuario': user_email,
                    'Comensales': comensales
                }
            )
        except Exception as e:
            return {
                'statusCode': 500,
                'body': json.dumps(f"Error creando la reserva en la tabla RESERVAS: {str(e)}"),
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST'
                }
            }
        
        # Paso 6b: Asociar la reserva al usuario en la tabla USUARIOS
        try:
            usuarios_table.put_item(
                Item={
                    'ID_Usuario': user_id,
                    'Fecha_hora': fecha_hora_timestamp,
                    'Localidad': localidad,
                    'Categoria': categoria,
                    'Nombre_restaurant': nombre_restaurant,
                    'Nombre_usuario': user_name,
                    'Mail_usuario': user_email,
                    'Comensales': comensales,
                    'ID_Mesa': table_id
                }
            )
        except Exception as e:
            return {
                'statusCode': 500,
                'body': json.dumps(f"Error creando la reserva en la tabla USUARIO: {str(e)}"),
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST'
                }
            }
        
        return {
            'statusCode': 200,
            'body': json.dumps(f"Reserva creada exitosamente en la mesa {table_id} para {user_name}."),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }
        }
    else:
        # No hay mesas disponibles
        return {
            'statusCode': 400,
            'body': json.dumps("No hay mesas disponibles para la cantidad de comensales en el horario seleccionado."),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }
        }
