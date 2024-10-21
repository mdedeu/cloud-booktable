import boto3
import json
import uuid

dynamodb = boto3.resource('dynamodb')


def crear_mesa(event, context):
    # Parámetros recibidos del usuario
    restaurant_name = event['restaurant_name']
    capacidad = event['capacidad']

    if not restaurant_name or capacidad is None:  # Cambiar a None para verificar un número
        return {
            'statusCode': 400,
            'body': json.dumps("Error: restaurant_name y capacidad son requeridos."),
             'headers': {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'OPTIONS,POST'
    }

        }

    # Inicialización de la tabla
    mesas_table = dynamodb.Table('MESAS')

    # Paso 1: Generar un ID único para la mesa dentro del contexto del restaurante
    table_id = f"{restaurant_name}_{uuid.uuid4()}"  # ID único basado en el nombre del restaurante y un UUID

    # Paso 2: Crear el nuevo item de mesa
    nueva_mesa = {
        'Nombre_restaurant': f'{restaurant_name}',  # Partition Key
        'Capacidad': capacidad,  # Sort Key (puedes cambiar la lógica si necesitas otro criterio)
        'ID_Mesa': table_id
    }

    # Paso 3: Insertar la nueva mesa en la tabla MESAS
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
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Headers': '*'
        }
    }
