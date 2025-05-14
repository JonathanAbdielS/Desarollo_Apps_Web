// public/js/cart.js
import { getToken } from './auth.js';
import { showAlert } from './ui.js'; // showAlert puede ser útil aquí

const API_BASE_URL = 'http://localhost:3000/api';

export async function fetchCart() {
    const token = getToken();
    if (!token) {
        // Devolver una estructura de carrito vacía si no hay token,
        // para que la UI no falle al esperar un objeto.
        return { items: [], totalItems: 0, subtotal: 0 };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            // El backend en getCart crea un carrito vacío si no existe,
            // así que un error aquí sería inesperado a menos que sea un error del servidor.
            const errorData = await response.json().catch(() => ({ message: "Error al obtener el carrito." }));
            console.error('fetchCart API error:', errorData);
            throw new Error(errorData.message || 'Error al obtener el carrito.');
        }
        const cartData = await response.json();
        return cartData; // Esperado: { _id, user, items: [...], totalItems, subtotal, ... }
    } catch (error) {
        console.error('Error en fetchCart:', error);
        // Devolver estructura vacía en caso de error para no romper la UI
        return { items: [], totalItems: 0, subtotal: 0, error: error.message };
    }
}

export async function addItemToCart(itemData) { // itemData = { movieId, quantity, tipo }
    const token = getToken();
    if (!token) throw new Error('Debes iniciar sesión para agregar al carrito.');

    const response = await fetch(`${API_BASE_URL}/cart/item`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(itemData)
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Error al agregar el ítem al carrito.');
    }
    return data; // Carrito actualizado
}

// --- FUNCIONES AÑADIDAS ---

export async function updateCartItemQuantity(itemData) { // itemData = { movieId, quantity, tipo }
    const token = getToken();
    if (!token) throw new Error('Debes iniciar sesión para modificar el carrito.');

    const response = await fetch(`${API_BASE_URL}/cart/item`, { // Endpoint para actualizar vía PUT
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(itemData) // El backend espera movieId, quantity, tipo
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar la cantidad del ítem.');
    }
    return data; // Carrito actualizado
}

export async function removeCartItem(itemData) { // itemData = { movieId, tipo }
    const token = getToken();
    if (!token) throw new Error('Debes iniciar sesión para modificar el carrito.');

    const response = await fetch(`${API_BASE_URL}/cart/item`, { // Endpoint para eliminar vía DELETE
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json', // Necesario si el backend espera un body para identificar el ítem
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(itemData) // El backend espera movieId y tipo
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar el ítem del carrito.');
    }
    return data; // Carrito actualizado
}

export async function clearCart() {
    const token = getToken();
    if (!token) throw new Error('Debes iniciar sesión para modificar el carrito.');

    const response = await fetch(`${API_BASE_URL}/cart`, { // Endpoint para limpiar todo el carrito
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Error al limpiar el carrito.');
    }
    return data; // Puede devolver { message: '...', cart: {...}}
}

// --- FIN DE FUNCIONES AÑADIDAS ---

export async function updateCartCount() {
    const cartCountElementGlobal = document.getElementById('cart-count'); // Para el navbar general
    // El contador específico de la página del carrito ('cart-count-cart') se maneja en cart-page.js

    // Si no hay token, el carrito está vacío.
    if (!getToken()) {
        if (cartCountElementGlobal) {
            cartCountElementGlobal.textContent = '0';
            cartCountElementGlobal.style.display = 'none';
        }
        return { totalItems: 0 }; // Devuelve la estructura esperada
    }

    try {
        const cart = await fetchCart(); // fetchCart ahora devuelve una estructura válida incluso en error/no token
        const count = cart && cart.totalItems !== undefined ? cart.totalItems : 0;
        
        if (cartCountElementGlobal) {
            cartCountElementGlobal.textContent = count;
            cartCountElementGlobal.style.display = count > 0 ? 'inline-block' : 'none';
        }
        return { totalItems: count }; // Devuelve el conteo para uso en otras funciones si es necesario
    } catch (error) {
        // Este catch es menos probable que se active si fetchCart maneja sus propios errores,
        // pero se mantiene por si acaso.
        if (cartCountElementGlobal) {
            cartCountElementGlobal.textContent = '0';
            cartCountElementGlobal.style.display = 'none';
        }
        return { totalItems: 0 };
    }
}

// Función combinada para añadir y luego actualizar el contador global
export async function addItemToCartAndUpdateCount(itemData) {
    const updatedCart = await addItemToCart(itemData); // Lanza error si falla
    await updateCartCount(); // Actualiza el contador global en la UI
    return updatedCart;
}