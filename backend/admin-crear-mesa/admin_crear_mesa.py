import boto3
import json
import uuid
from boto3.dynamodb.conditions import Key, Attr

dynamodb = boto3.resource('dynamodb')

def admin_crear_mesa(event, context):

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
    campos_requeridos = ['localidad', 'categoria', 'nombre_restaurant', 'capacidad', 'id_usuario']
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
    capacidad = int(body['capacidad'])
    id_usuario = body['id_usuario']
    
    # Inicialización de las tablas
    mesas_table = dynamodb.Table('MESAS')
    restaurantes_table = dynamodb.Table('RESTAURANTES')
    
    # Paso 1: Verificar si el restaurante existe en la tabla RESTAURANTES
    try:
        response_restaurante = restaurantes_table.query(
            KeyConditionExpression =Key('Localidad').eq(localidad) & Key('Categoria#Nombre_restaurant').eq(f"{categoria}#{nombre_restaurant}"),
            FilterExpression=Attr('ID_Usuario').eq(id_usuario))

        if not response_restaurante['Items']:
            return {
                'statusCode': 404,
                'body': json.dumps(f"Error: El restaurante '{nombre_restaurant}' con categoria '{categoria}' no existe en la localidad '{localidad}' para este usuario."),
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
    
    # Paso 2: Generar un ID único para la mesa dentro del contexto del restaurante
    clave_compuesta = f"{localidad}#{categoria}#{nombre_restaurant}"
    
    table_id = str(uuid.uuid4())  # ID único basado solo en el UUID
    
    # Paso 3: Crear el nuevo item de mesa
    nueva_mesa = {
        'Localidad#Categoria#Nombre_restaurant': clave_compuesta,  # Partition Key
        'ID_Mesa': table_id,                # Sort Key
        'Capacidad': capacidad,                # Capacidad de la mesa
    }
    
    # Paso 4: Insertar la nueva mesa en la tabla MESAS
    try:
        mesas_table.put_item(Item=nueva_mesa)
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error agregando la mesa: {str(e)}"),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }
        }
    
    return {
        'statusCode': 201,
        'body': json.dumps("Mesa agregada exitosamente."),
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'OPTIONS,POST'
        }
    }
