import boto3
import json
import uuid

dynamodb = boto3.resource('dynamodb')

def admin_crear_mesa(event, context):
    try:
        # Analizar el cuerpo de la solicitud
        body = json.loads(event.get('body', '{}'))
        restaurant_name = body.get('restaurant_name')
        capacidad = body.get('capacidad')
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

    if not restaurant_name or capacidad is None:
        return {
            'statusCode': 400,
            'body': json.dumps("Error: 'restaurant_name' y 'capacidad' son requeridos."),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }
        }

    # Inicialización de la tabla
    mesas_table = dynamodb.Table('MESAS')

    # Generar un ID único para la mesa dentro del contexto del restaurante
    table_id = f"{restaurant_name}_{uuid.uuid4()}"

    # Crear el nuevo item de mesa
    nueva_mesa = {
        'Nombre_restaurant': restaurant_name,  # Partition Key
        'Capacidad': int(capacidad),           # Asegurar que es un entero
        'ID_Mesa': table_id
    }

    # Insertar la nueva mesa en la tabla MESAS
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

