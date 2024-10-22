import boto3
import json

dynamodb = boto3.resource('dynamodb')


def obtener_reservas(event, context):
    response = {
        'statusCode': 200,
        'headers' : {
            'Access-Control-Allow-Origin' : '*'
        },
        'body': json.dumps({'message': 'Success'})
    }
    return response