// public/js/ui.js
import { logoutUser, getCurrentUser, isLoggedIn } from './auth.js';

export function updateNavbar() {
    const userSessionControls = document.getElementById('user-session-controls');
    const cartLinkContainer = document.getElementById('cart-link-container'); // Necesitarás un div contenedor para el enlace del carrito

    if (!userSessionControls) return;

    if (isLoggedIn()) {
        const user = getCurrentUser();
        userSessionControls.innerHTML = `
            <span class="navbar-text me-3">
                Hola, ${user.nombre.split(' ')[0]} ${user.tipo_usuario === 'admin' ?  '<span class="badge bg-warning text-dark">Admin</span>' : ''}
            </span>
            <div class="nav-item dropdown me-3">
                <a class="nav-link dropdown-toggle" href="#" id="accountDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Mi Cuenta
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdown">
                    <li><a class="dropdown-item" href="my_profile.html">Mi Perfil</a></li>
                    <li><a class="dropdown-item" href="orders.html">Mis Compras</a></li>
                    ${user.tipo_usuario === 'admin' ? `
                        <li><a class="dropdown-item" href="admin_movies.html">Gestionar Películas</a></li>
                        <li><a class="dropdown-item" href="admin_users.html">Gestionar Usuarios</a></li>
                        <li><a class="dropdown-item" href="admin_sales.html">Ver Ventas</a></li>
                        <li><hr class="dropdown-divider"></li>
                    ` : ''}
                    <li><button id="logoutButton" class="dropdown-item" type="button">Cerrar Sesión</button></li>
                </ul>
            </div>
        `;
        // Carrito siempre visible si está logueado
        if(cartLinkContainer) {
            cartLinkContainer.innerHTML = `
                <a href="cart.html" class="nav-link" role="button">
                    <img id="Basket_img" src="img/Basket_img.png" alt="Carrito" style="width:30px; height:30px;"/>
                    <span></span> <span id="cart-count" class="badge bg-danger ms-1">0</span>
                </a>
            `;
        }

        const logoutButton = document.getElementById('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                logoutUser();
                updateNavbar(); // Actualiza la UI inmediatamente
                window.location.href = 'index.html'; // Redirige a la página principal o de login
            });
        }
    } else {
        userSessionControls.innerHTML = `
            <button type="button" class="btn btn-outline-primary me-2" data-bs-toggle="modal" data-bs-target="#loginModal">
                Login
            </button>
            <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#registerModal">
                Registro
            </button>
        `;
        // Ocultar o deshabilitar el carrito si no está logueado
        if (cartLinkContainer) cartLinkContainer.innerHTML = '';
    }
}

// Función para mostrar alertas/mensajes de error
export function showAlert(message, type = 'danger', containerId = 'alert-container') {
    const alertContainer = document.getElementById(containerId);
    if (!alertContainer) {
        console.error(`Contenedor de alerta con id '${containerId}' no encontrado.`);
        // Como fallback, usar alert()
        alert(`${type.toUpperCase()}: ${message}`);
        return;
    }
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertContainer.prepend(alertDiv); // Añade al principio para que las más nuevas estén arriba

    // Auto-dismiss después de 5 segundos
    setTimeout(() => {
        const bootstrapAlert = bootstrap.Alert.getOrCreateInstance(alertDiv);
        if (bootstrapAlert) {
            bootstrapAlert.close();
        }
    }, 5000);
}