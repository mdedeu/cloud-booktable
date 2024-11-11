import boto3
import json

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

def get_topic_arn(topic_name):
    sns = boto3.client('sns')
    topics = sns.list_topics()['Topics']
    for topic in topics:
        if topic['TopicArn'].split(':')[-1] == topic_name:
            return topic['TopicArn']
    return None

def format_restaurant_message(restaurant_data):
    return f"""
¡Nuevo restaurante creado exitosamente!

Detalles del restaurante:
Nombre: {restaurant_data['nombre_restaurant']}
Localidad: {restaurant_data['localidad']}
Categoría: {restaurant_data['categoria']}
ID Usuario Creador: {restaurant_data['id_usuario']}
"""

def admin_crear_restaurant(event, context):
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

    campos_requeridos = ['localidad', 'categoria', 'nombre_restaurant', 'id_usuario']   
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
    id_usuario = body['id_usuario']
    
    # Inicialización de la tabla
    restaurant_table = dynamodb.Table('RESTAURANTES')
    
    categoria_restaurant = f"{categoria}#{nombre_restaurant}"
    
    # Paso 1: Verificar si ya existe un restaurante con el mismo nombre en la misma localidad y categoría
    try:
        response = restaurant_table.get_item(
            Key={
                'Localidad': localidad,  # PK
                'Categoria#Nombre_restaurant': categoria_restaurant  # SK como combinación
            }
        )
        
        if 'Item' in response:
            return {
                'statusCode': 409,
                'body': json.dumps("Error: Ya existe un restaurante con el mismo nombre en esta localidad y categoria."),
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
    
    # Paso 2: Crear el nuevo restaurante
    nuevo_restaurant = {
        'Localidad': localidad,
        'Categoria#Nombre_restaurant': categoria_restaurant,
        'ID_Usuario': id_usuario
    }
    
    try:
        restaurant_table.put_item(Item=nuevo_restaurant)
        
        # Enviar notificación SNS
        try:
            topic_arn = get_topic_arn('restaurant-creation-notifications')
            if topic_arn:
                restaurant_details = {
                    'nombre_restaurant': nombre_restaurant,
                    'localidad': localidad,
                    'categoria': categoria,
                    'id_usuario': id_usuario
                }
                
                sns.publish(
                    TopicArn=topic_arn,
                    Message=format_restaurant_message(restaurant_details),
                    Subject=f'Nuevo Restaurante Creado - {nombre_restaurant}'
                )
        except Exception as e:
            print(f"Error sending SNS notification: {str(e)}")
            # Don't return error - restaurant was created successfully
            
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error creando el restaurante: {str(e)}"),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,POST'
            }
        }
    
    return {
        'statusCode': 201,
        'body': json.dumps("Restaurante creado exitosamente."),
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'OPTIONS,POST'
        }
    }
