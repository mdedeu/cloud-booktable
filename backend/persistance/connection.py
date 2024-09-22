import os
import psycopg2
from psycopg2 import pool

DATABASE_PARAMS = {
    "host": os.getenv('DB_HOST', 'localhost'),
    "dbname": os.getenv('DB_NAME', 'booktable'),
    "user": os.getenv('DB_USER', 'postgres'),
    "password": os.getenv('DB_PASS', "postgres")
}

conn_pool = None


def init_connection_pool(minconn, maxconn):
    global conn_pool
    if conn_pool is None:
        conn_pool = psycopg2.pool.ThreadedConnectionPool(minconn, maxconn, **DATABASE_PARAMS)


def get_connection():
    global conn_pool
    if conn_pool is None:
        raise Exception("Connection pool is not initialized")
    return conn_pool.getconn()


def put_connection(conn):
    global conn_pool
    if conn_pool:
        conn_pool.putconn(conn)
