import React, { useState } from 'react';

export default function Home() {
  const backend_url = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [reservaData, setReservaData] = useState({
    restaurant_name: '',
    date: '',
    time: '',
    comensales: '',
    name: '',
    email: ''
  });
  const [mesaData, setMesaData] = useState({
    restaurant_name: '',
    capacidad: ''
  });
  const [restaurantData, setRestaurantData] = useState({
    localidad: '',
    categoria: '',
    nombre_restaurant: '',
    id_usuario: ''
  });
  const [reservaId, setReservaId] = useState('');
  const [result, setResult] = useState('');

  const timeOptions = [
    '13:00', '14:00', '15:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  const handleReservaSubmit = async (e) => {
    e.preventDefault();
    try {
      const dateTime = new Date(`${reservaData.date}T${reservaData.time}:00`);
      const timestamp = Math.floor(dateTime.getTime() / 1000);

      const reservaPayload = {
        ...reservaData,
        datetime: timestamp.toString()
      };

      const response = await fetch(`${backend_url}/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservaPayload)
      });
      const data = await response.json();
      setResult(JSON.stringify(data));
    } catch (error) {
      setResult('Error: ' + error.message);
    }
  };

  const handleGetReservas = async () => {
    try {
      const response = await fetch(`${backend_url}/reservas`);
      const data = await response.json();
      setResult(JSON.stringify(data));
    } catch (error) {
      setResult('Error: ' + error.message);
    }
  };

  const handleDeleteReserva = async () => {
    try {
      const response = await fetch(`${backend_url}/reservas/${reservaId}`, { method: 'DELETE' });
      const data = await response.json();
      setResult(JSON.stringify(data));
    } catch (error) {
      setResult('Error: ' + error.message);
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${backend_url}/admin/restaurant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurantData)
      });
      const data = await response.json();
      setResult(JSON.stringify(data));
    } catch (error) {
      setResult('Error: ' + error.message);
    }
  };

  const handleCreateMesa = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${backend_url}/admin/mesas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mesaData)
      });
      const data = await response.json();
      setResult(JSON.stringify(data));
    } catch (error) {
      setResult('Error: ' + error.message);
    }
  };

  const handleGetAdminReservas = async () => {
    try {
      const response = await fetch(`${backend_url}/admin/reservas`);
      const data = await response.json();
      setResult(JSON.stringify(data));
    } catch (error) {
      setResult('Error: ' + error.message);
    }
  };

  return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">API Testing Frontend</h1>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Create Reserva</h2>
          <form onSubmit={handleReservaSubmit} className="space-y-2">
            <input
                type="text"
                placeholder="Restaurant Name"
                value={reservaData.restaurant_name}
                onChange={(e) => setReservaData({...reservaData, restaurant_name: e.target.value})}
                className="w-full p-2 border rounded"
            />
            <input
                type="date"
                value={reservaData.date}
                onChange={(e) => setReservaData({...reservaData, date: e.target.value})}
                className="w-full p-2 border rounded"
            />
            <select
                value={reservaData.time}
                onChange={(e) => setReservaData({...reservaData, time: e.target.value})}
                className="w-full p-2 border rounded"
            >
              <option value="">Select Time</option>
              {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
              ))}
            </select>
            <input
                type="number"
                placeholder="Comensales"
                value={reservaData.comensales}
                onChange={(e) => setReservaData({...reservaData, comensales: e.target.value})}
                className="w-full p-2 border rounded"
            />
            <input
                type="text"
                placeholder="Name"
                value={reservaData.name}
                onChange={(e) => setReservaData({...reservaData, name: e.target.value})}
                className="w-full p-2 border rounded"
            />
            <input
                type="email"
                placeholder="Email"
                value={reservaData.email}
                onChange={(e) => setReservaData({...reservaData, email: e.target.value})}
                className="w-full p-2 border rounded"
            />
            <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded">Create Reserva</button>
          </form>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Get Reservas</h2>
          <button onClick={handleGetReservas} className="w-full p-2 bg-green-500 text-white rounded">Get Reservas</button>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Delete Reserva</h2>
          <input
              type="text"
              placeholder="Reserva ID"
              value={reservaId}
              onChange={(e) => setReservaId(e.target.value)}
              className="w-full p-2 border rounded mb-2"
          />
          <button onClick={handleDeleteReserva} className="w-full p-2 bg-red-500 text-white rounded">Delete Reserva</button>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Create Restaurant</h2>
          <form onSubmit={handleCreateRestaurant} className="space-y-2">
            <input
                type="text"
                placeholder="Localidad"
                value={restaurantData.localidad}
                onChange={(e) => setRestaurantData({...restaurantData, localidad: e.target.value})}
                className="w-full p-2 border rounded"
            />
            <input
                type="text"
                placeholder="Categoria"
                value={restaurantData.categoria}
                onChange={(e) => setRestaurantData({...restaurantData, categoria: e.target.value})}
                className="w-full p-2 border rounded"
            />
            <input
                type="text"
                placeholder="Nombre Restaurant"
                value={restaurantData.nombre_restaurant}
                onChange={(e) => setRestaurantData({...restaurantData, nombre_restaurant: e.target.value})}
                className="w-full p-2 border rounded"
            />
            <input
                type="text"
                placeholder="ID Usuario"
                value={restaurantData.id_usuario}
                onChange={(e) => setRestaurantData({...restaurantData, id_usuario: e.target.value})}
                className="w-full p-2 border rounded"
            />
            <button type="submit" className="w-full p-2 bg-purple-500 text-white rounded">Create Restaurant</button>
          </form>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Create Mesa</h2>
          <form onSubmit={handleCreateMesa} className="space-y-2">
            <input
                type="text"
                placeholder="Restaurant Name"
                value={mesaData.restaurant_name}
                onChange={(e) => setMesaData({...mesaData, restaurant_name: e.target.value})}
                className="w-full p-2 border rounded"
            />
            <input
                type="number"
                placeholder="Capacidad"
                value={mesaData.capacidad}
                onChange={(e) => setMesaData({...mesaData, capacidad: e.target.value})}
                className="w-full p-2 border rounded"
            />
            <button type="submit" className="w-full p-2 bg-yellow-500 text-white rounded">Create Mesa</button>
          </form>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Get Admin Reservas</h2>
          <button onClick={handleGetAdminReservas} className="w-full p-2 bg-indigo-500 text-white rounded">Get Admin Reservas</button>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto">{result}</pre>
        </div>
      </div>
  );
}