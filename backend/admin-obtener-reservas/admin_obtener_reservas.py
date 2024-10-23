import boto3
import json
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Key, Attr
import boto3.dynamodb.types


dynamodb = boto3.resource('dynamodb')


def admin_obtener_reservas(event, context):
    try:
        params = event.get('queryStringParameters', {}) or {}

        campos_requeridos = ['localidad', 'categoria', 'nombre_restaurant', 'id_usuario']

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


        localidad = params.get('localidad')
        categoria = params.get('categoria')
        nombre_restaurant = params.get('nombre_restaurant')
        id_usuario = params.get('id_usuario')


        clave_compuesta = f'{localidad}#{categoria}#{nombre_restaurant}'

        today = datetime.utcnow() - timedelta(hours=3)
        today_str = today.strftime('%Y-%m-%d')


        reservas_table = dynamodb.Table('RESERVAS')
        restaurantes_table = dynamodb.Table('RESTAURANTES')

        # Paso 0: Verificar que exista el restaurant en la tabla RESTAURANTES y que sea de ese user
        try:
            response_restaurante = restaurantes_table.query(
                KeyConditionExpression=Key('Localidad').eq(localidad) & Key('Categoria#Nombre_restaurant').eq(
                    f"{categoria}#{nombre_restaurant}"),
                FilterExpression=Attr('ID_Usuario').eq(id_usuario))

            if not response_restaurante['Items']:
                return {
                    'statusCode': 404,
                    'body': json.dumps(
                        f"Error: El restaurante '{nombre_restaurant}' con categoria '{categoria}' no existe en la localidad '{localidad}' para este usuario."),
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

        # Paso 1: Buscar las reservas del dia de hoy para el restaurante en la tabla RESERVAS
        try:
            response = reservas_table.query(
                KeyConditionExpression=Key('Localidad#Categoria#Nombre_restaurant').eq(clave_compuesta) &
                                       Key('Fecha_hora#ID_Mesa').begins_with(today_str)
            )
            reservas = response.get('Items', [])
            json_data = boto3.dynamodb.types.TypeSerializer().serialize(reservas)

        except Exception as e:
            print(f"Query error: {str(e)}")
            return {
                'statusCode': 500,
                'body': json.dumps(f"Error al obtener las reservas: {str(e)}"),
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'GET,OPTIONS'
                }
            }

        # Paso 2: Devolver las reservas al front
        return {
            'statusCode': 200,
            'body': json.dumps(json_data),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            }
        }
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error inesperado: {str(e)}"),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,OPTIONS'
            }
        }