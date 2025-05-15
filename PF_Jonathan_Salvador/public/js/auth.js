// public/js/auth.js
import { API_BASE_URL } from './config.js';

export async function registerUser(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Error al registrar usuario.');
        }
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
            _id: data._id,
            username: data.username,
            nombre: data.nombre,
            tipo_usuario: data.tipo_usuario
        }));
        return data;
    } catch (error) {
        console.error('Error en registerUser:', error);
        throw error;
    }
}

export async function loginUser(credentials) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Error al iniciar sesión.');
        }
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
            _id: data._id,
            username: data.username,
            nombre: data.nombre,
            tipo_usuario: data.tipo_usuario
        }));
        return data;
    } catch (error) {
        console.error('Error en loginUser:', error);
        throw error;
    }
}

export function logoutUser() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Podrías también llamar a un endpoint de logout en el backend si implementas invalidación de tokens del lado del servidor.
}

export function getToken() {
    return localStorage.getItem('token');
}

export function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

export function isLoggedIn() {
    return !!getToken();
}