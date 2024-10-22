import boto3
import json
import uuid

dynamodb = boto3.resource('dynamodb')

def admin_crear_mesa(event, context):
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
    capacidad = int(event['capacidad'])
    
    # Inicialización de las tablas
    mesas_table = dynamodb.Table('MESAS')
    restaurantes_table = dynamodb.Table('RESTAURANTES')
    
    # Paso 1: Verificar si el restaurante existe en la tabla RESTAURANTES
    try:
        response_restaurante = restaurantes_table.get_item(
            Key={
                'Localidad': localidad,                # PK
                'Categoria#Nombre_restaurant': f"{categoria}#{nombre_restaurant}"     # SK como combinación
            }
        )
        # Verificar si existe el restaurante
        if 'Item' not in response_restaurante:
            return {
                'statusCode': 404,
                'body': json.dumps(f"Error: El restaurante '{nombre_restaurant}' con categoria '{categoria}' no existe en la localidad '{localidad}'.")
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error consultando la tabla RESTAURANTES: {str(e)}")
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
            'body': json.dumps(f"Error agregando la mesa: {str(e)}")
        }
    
    return {
        'statusCode': 201,
        'body': json.dumps("Mesa agregada exitosamente.")
    }
