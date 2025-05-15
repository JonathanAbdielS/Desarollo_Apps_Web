// public/js/cart.js
import { getToken } from './auth.js';
import { API_BASE_URL } from './config.js';
import { showAlert } from './ui.js';

export async function fetchCart() {
    const token = getToken();
    if (!token) {
        return { items: [], totalItems: 0, subtotal: 0 };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Error al obtener el carrito." }));
            console.error('fetchCart API error:', errorData);
            throw new Error(errorData.message || 'Error al obtener el carrito.');
        }
        const cartData = await response.json();
        return cartData;
    } catch (error) {
        console.error('Error en fetchCart:', error);
        return { items: [], totalItems: 0, subtotal: 0, error: error.message };
    }
}

export async function addItemToCart(itemData) {
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
    return data;
}

export async function updateCartItemQuantity(itemData) {
    const token = getToken();
    if (!token) throw new Error('Debes iniciar sesión para modificar el carrito.');

    const response = await fetch(`${API_BASE_URL}/cart/item`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(itemData)
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar la cantidad del ítem.');
    }
    return data;
}

export async function removeCartItem(itemData) {
    const token = getToken();
    if (!token) throw new Error('Debes iniciar sesión para modificar el carrito.');

    const response = await fetch(`${API_BASE_URL}/cart/item`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(itemData)
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar el ítem del carrito.');
    }
    return data;
}

export async function clearCart() {
    const token = getToken();
    if (!token) throw new Error('Debes iniciar sesión para modificar el carrito.');

    const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'Error al limpiar el carrito.');
    }
    return data;
}

export async function updateCartCount() {
    const cartCountElementGlobal = document.getElementById('cart-count'); 
    if (!getToken()) {
        if (cartCountElementGlobal) {
            cartCountElementGlobal.textContent = '0';
            cartCountElementGlobal.style.display = 'none';
        }
        return { totalItems: 0 };
    }

    try {
        const cart = await fetchCart();
        const count = cart && cart.totalItems !== undefined ? cart.totalItems : 0;
        
        if (cartCountElementGlobal) {
            cartCountElementGlobal.textContent = count;
            cartCountElementGlobal.style.display = count > 0 ? 'inline-block' : 'none';
        }
        return { totalItems: count };
    } catch (error) {
        if (cartCountElementGlobal) {
            cartCountElementGlobal.textContent = '0';
            cartCountElementGlobal.style.display = 'none';
        }
        return { totalItems: 0 };
    }
}

export async function addItemToCartAndUpdateCount(itemData) {
    const updatedCart = await addItemToCart(itemData);
    await updateCartCount();
    return updatedCart;
}