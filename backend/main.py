from fastapi import FastAPI

app = FastAPI()


@app.get("/table/{table_id}/availability")
async def get_table_availability():
    return {"message": "Hello World"}


@app.get("/table/{table_id}")
async def get_tables():
    return {"message": "Tables"}


@app.post("/table")
async def create_table():
    return {"message": "Table created"}


@app.put("/table/{table_id}")
async def update_table_availability():
    return {"message": "Table updated"}

@app.post("/table/{table_id}/reservation")
async def create_reservation():
    return {"message": "Reservation created"}
