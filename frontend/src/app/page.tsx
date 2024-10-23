'use client';
import React, {useEffect, useState} from 'react';
import {useRouter} from "next/navigation";

interface ReservaData {
  nombre_restaurant: string;
  localidad: string;
  categoria: string;
  date: string;
  time: string;
  comensales: string;
  user_name: string;
  user_id: string;
  email: string;
}

interface DeleteReservaData {
  user_id: string;
  date: string;
  time: string;
}

export default function Home() {
  const [backendUrl, setBackendUrl] = useState('http://localhost:3000');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  const [reservaData, setReservaData] = useState<ReservaData>({
    nombre_restaurant: '',
    localidad: '',
    categoria: '',
    date: '',
    time: '',
    comensales: '',
    user_name: '',
    user_id: '',
    email: ''
  });


  const [deleteReservaData, setDeleteReservaData] = useState<DeleteReservaData>({
    user_id: '',
    date: '',
    time: ''
  });


  const [result, setResult] = useState('');
  const router = useRouter();

  const timeOptions = [
    '13:00', '14:00', '15:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  const decodeJWT = (token: string) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('idToken');
    if (!token) {
      router.push('/login');
      return;
    }

    const decodedToken = decodeJWT(token);
    const userType = decodedToken['custom:userType'];
    if(userType == 'OWNER') {
        router.push('/owner');
        return
    }
    if (decodedToken && decodedToken.email) {
      setUserEmail(decodedToken.email);
      setUserName(decodedToken.email);

      setReservaData(prev => ({
        ...prev,
        user_id: decodedToken.email,
        email: decodedToken.email,
        user_name: decodedToken.email
      }));

      setDeleteReservaData(prev => ({
        ...prev,
        user_id: decodedToken.email
      }));
    }

    if (process.env.NEXT_PUBLIC_BACKEND_URL) {
      setBackendUrl(process.env.NEXT_PUBLIC_BACKEND_URL);
    }
  }, [router]);

  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('idToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/login");
  };

  const handleReservaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dateTime = new Date(`${reservaData.date}T${reservaData.time}:00`);
      const timestamp = Math.floor(dateTime.getTime() / 1000);

      const reservaPayload = {
        nombre_restaurant: reservaData.nombre_restaurant,
        localidad: reservaData.localidad,
        categoria: reservaData.categoria,
        comensales: reservaData.comensales,
        user_name: userName,
        user_id: userEmail,
        email: userEmail,
        datetime: timestamp.toString()
      };

      const response = await fetch(`${backendUrl}/reservas`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(reservaPayload)
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult('Error: ' + (error as Error).message);
    }
  };

  const handleGetReservas = async () => {
    try {
      const queryParams = new URLSearchParams({
        user_id: userEmail
      });

      const response = await fetch(`${backendUrl}/reservas?${queryParams.toString()}`, {
        headers: getAuthHeaders()
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult('Error: ' + (error as Error).message);
    }
  };

  const handleDeleteReserva = async () => {
    try {
      const dateTimeString = `${deleteReservaData.date}T${deleteReservaData.time}:00`;
      const dateTime = new Date(dateTimeString);
      const timestamp = Math.floor(dateTime.getTime() / 1000);

      const body = {
        user_id: userEmail,
        datetime: timestamp.toString()
      };

      const response = await fetch(`${backendUrl}/reservas`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult('Error: ' + (error as Error).message);
    }
  };

  return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">API Testing Frontend</h1>
            {userEmail && (
                <p className="text-gray-600">Logged in as: {userEmail}</p>
            )}
          </div>
          <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-4">Clientes</h2>
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Create Reserva</h2>
          <form onSubmit={handleReservaSubmit} className="space-y-2">
            <input
                type="text"
                placeholder="Location"
                value={reservaData.localidad}
                onChange={(e) => setReservaData({...reservaData, localidad: e.target.value})}
                className="w-full p-2 border rounded text-black"
            />
            <input
                type="text"
                placeholder="Categoría"
                value={reservaData.categoria}
                onChange={(e) => setReservaData({...reservaData, categoria: e.target.value})}
                className="w-full p-2 border rounded text-black"
            />
            <input
                type="text"
                placeholder="Restaurant Name"
                value={reservaData.nombre_restaurant}
                onChange={(e) => setReservaData({...reservaData, nombre_restaurant: e.target.value})}
                className="w-full p-2 border rounded text-black"
            />
            <input
                type="date"
                value={reservaData.date}
                onChange={(e) => setReservaData({...reservaData, date: e.target.value})}
                className="w-full p-2 border rounded text-black"
            />
            <select
                value={reservaData.time}
                onChange={(e) => setReservaData({...reservaData, time: e.target.value})}
                className="w-full p-2 border rounded text-black"
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
                className="w-full p-2 border rounded text-black"
            />
            <div className="p-2 bg-gray-100 rounded">
              <p className="text-sm text-gray-600">Reserving as: {userName}</p>
            </div>
            <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Create Reserva
            </button>
          </form>
        </div>
        <div className="mt-8 mb-8">
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-black whitespace-pre-wrap">
          {result}
        </pre>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">My Reservas</h2>
          <button
              onClick={handleGetReservas}
              className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Get My Reservas
          </button>
        </div>
        <div className="mt-8 mb-8">
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-black whitespace-pre-wrap">
          {result}
        </pre>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Delete Reserva</h2>
          <div className="space-y-2">
            <input
                type="date"
                value={deleteReservaData.date}
                onChange={(e) => setDeleteReservaData({...deleteReservaData, date: e.target.value})}
                className="w-full p-2 border rounded text-black mb-2"
            />
            <select
                value={deleteReservaData.time}
                onChange={(e) => setDeleteReservaData({...deleteReservaData, time: e.target.value})}
                className="w-full p-2 border rounded text-black mb-2"
            >
              <option value="">Select Time</option>
              {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
              ))}
            </select>
            <button
                onClick={handleDeleteReserva}
                className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete Reserva
            </button>
          </div>
        </div>

        <div className="mt-8 mb-8">
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-black whitespace-pre-wrap">
          {result}
        </pre>
        </div>
      </div>
  );
}