import boto3
import json
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('RESTAURANTES')  # Replace with your DynamoDB table name

def buscar_restaurant(event, context):
    params = event.get('queryStringParameters', {}) or {}
    
    localidad = params.get('localidad')
    categoria = params.get('categoria')  

    if not localidad:
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,GET',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Missing "localidad" parameter'})
        }

    try:
        key_condition = Key('Localidad').eq(localidad)
        
        if categoria:
            key_condition &= Key('Categoria#Nombre_restaurant').begins_with(categoria)
        
        response = table.query(
            KeyConditionExpression=key_condition
        )

        items = response.get('Items', [])
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',  
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,GET',
                'Content-Type': 'application/json'
            },
            'body': json.dumps(items)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'OPTIONS,GET',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': str(e)})
        }
