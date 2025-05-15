// public/js/orders-page.js
import { getToken, getCurrentUser, isLoggedIn, loginUser, registerUser } from './auth.js';
import { showAlert } from './ui.js';
import { API_BASE_URL } from './config.js';
import { updateCartCount } from './cart.js'; // Para actualizar el contador en el navbar

const ordersListContainer = document.getElementById('orders-list-container');
const noOrdersMessage = document.getElementById('no-orders-message');

// --- Funciones para actualizar la UI del Navbar específicas de esta página ---
function updateOrdersPageNavbar() {
    const userSessionControls = document.getElementById('user-session-controls-orders');
    const cartLinkContainer = document.getElementById('cart-link-container-orders');

    if (!userSessionControls) {
        // console.warn("Elemento 'user-session-controls-orders' no encontrado.");
        return;
    }

    if (isLoggedIn()) {
        const user = getCurrentUser();
        userSessionControls.innerHTML = `
            <span class="navbar-text me-3">
                Hola, ${user.nombre.split(' ')[0]} ${user.tipo_usuario === 'admin' ? '<span class="badge bg-warning text-dark">Admin</span>' : ''}
            </span>
            <div class="nav-item dropdown me-3">
                <a class="nav-link dropdown-toggle active" href="#" id="accountDropdownOrders" role="button" data-bs-toggle="dropdown" aria-expanded="false"> Mi Cuenta
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdownOrders">
                    <li><a class="dropdown-item active" href="orders.html">Mis Compras</a></li>
                    ${user.tipo_usuario === 'admin' ? `
                        <li><a class="dropdown-item" href="admin_movies.html">Gestionar Películas</a></li>
                        <li><a class="dropdown-item" href="admin_users.html">Gestionar Usuarios</a></li>
                        <li><a class="dropdown-item" href="admin_sales.html">Ver Ventas</a></li>
                        <li><hr class="dropdown-divider"></li>
                    ` : ''}
                    <li><button id="logoutButtonOrders" class="dropdown-item" type="button">Cerrar Sesión</button></li>
                </ul>
            </div>
        `;
        if (cartLinkContainer) {
            cartLinkContainer.innerHTML = `
                <a href="cart.html" class="nav-link position-relative" role="button">
                    <img src="img/Basket_img.png" alt="Carrito" style="width:30px; height:30px;"/>
                    <span class="visually-hidden">Carrito</span>
                    <span id="cart-count-orders" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        0 <span class="visually-hidden">ítems en el carrito</span>
                    </span>
                </a>
            `;
        }

        const logoutButton = document.getElementById('logoutButtonOrders');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                updateOrdersPageNavbar();
                updateCartCountOnOrdersNavbar(); // Actualiza el contador a 0
                window.location.href = 'index.html'; // O la página de inicio que hayas definido
            });
        }
    } else {
        userSessionControls.innerHTML = `
            <button type="button" class="btn btn-outline-primary me-2" data-bs-toggle="modal" data-bs-target="#loginModalOrders">
                Login
            </button>
            <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#registerModalOrders">
                Registro
            </button>
        `;
        if (cartLinkContainer) cartLinkContainer.innerHTML = '';
        if (ordersListContainer) ordersListContainer.innerHTML = '<p class="text-center mt-5">Debes <a href="#" data-bs-toggle="modal" data-bs-target="#loginModalOrders">iniciar sesión</a> para ver tu historial de compras.</p>';
        if (noOrdersMessage) noOrdersMessage.style.display = 'none';
    }
}

async function updateCartCountOnOrdersNavbar() {
    const cartCountEl = document.getElementById('cart-count-orders');
    if (!cartCountEl) return;

    if (!isLoggedIn()) {
        cartCountEl.textContent = '0';
        cartCountEl.classList.add('d-none'); // Ocultar si es 0 y no logueado
        return;
    }
    try {
        // Reutilizamos updateCartCount de cart.js que actualiza el global y devuelve el conteo
        const cartData = await updateCartCount(); // Esta función ya maneja el fetchCart internamente
        const count = cartData && cartData.totalItems !== undefined ? cartData.totalItems : 0;
        
        cartCountEl.textContent = count;
        if (count > 0) {
            cartCountEl.classList.remove('d-none');
        } else {
            cartCountEl.classList.add('d-none');
        }
    } catch (error) {
        // console.warn("No se pudo actualizar contador del carrito en navbar (orders-page):", error.message);
        cartCountEl.textContent = '0';
        cartCountEl.classList.add('d-none');
    }
}


async function fetchSalesHistory() {
    const token = getToken();
    if (!token) {
        // Esto ya se maneja en renderSalesHistory
        return null;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/sales/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error al obtener el historial de compras.' }));
            throw new Error(errorData.message);
        }
        return await response.json(); // Array de ventas
    } catch (error) {
        console.error('Error fetching sales history:', error);
        showAlert(error.message || 'No se pudo cargar el historial de compras.', 'danger', 'alert-container-orders');
        return null; // Devuelve null en caso de error para que renderSalesHistory pueda manejarlo
    }
}

function getStatusBadgeClass(status) {
    switch (status.toLowerCase()) {
        case 'completada': return 'bg-success';
        case 'pendiente': return 'bg-warning text-dark';
        case 'cancelada': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

async function renderSalesHistory() {
    if (!isLoggedIn()) {
        updateOrdersPageNavbar(); // Asegura que se muestre el mensaje de "iniciar sesión"
        return;
    }
    if (!ordersListContainer || !noOrdersMessage) {
        console.error("Elementos del DOM para el historial de órdenes no encontrados.");
        return;
    }

    ordersListContainer.innerHTML = '<div class="d-flex justify-content-center mt-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando historial...</span></div></div>';
    noOrdersMessage.style.display = 'none';

    const sales = await fetchSalesHistory();

    if (sales === null) { // Error durante el fetch, showAlert ya fue llamado
        ordersListContainer.innerHTML = '<p class="text-center text-danger mt-5">No se pudo cargar tu historial de compras. Intenta de nuevo más tarde.</p>';
        return;
    }

    if (sales.length === 0) {
        ordersListContainer.innerHTML = ''; // Limpiar spinner
        noOrdersMessage.style.display = 'block';
        return;
    }

    ordersListContainer.innerHTML = ''; // Limpiar spinner
    sales.forEach(sale => {
        const saleDate = new Date(sale.fecha_compra);
        // Formato de fecha más robusto y legible
        const formattedDate = saleDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
        const formattedTime = saleDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: true });
        const shortId = sale._id.substring(sale._id.length - 7).toUpperCase(); // Un poco más largo para unicidad visual

        const accordionItem = document.createElement('div');
        accordionItem.className = 'accordion-item mb-2 shadow-sm';
        accordionItem.innerHTML = `
            <h2 class="accordion-header" id="heading-${sale._id}">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${sale._id}" aria-expanded="false" aria-controls="collapse-${sale._id}">
                    <span class="fw-bold me-2">Orden #${shortId}</span>
                    <span class="me-auto">Fecha: ${formattedDate}</span>
                    <span class="me-3">Total: <span class="fw-semibold">$${sale.totalVenta.toFixed(2)}</span></span>
                    Estatus: <span class="badge ${getStatusBadgeClass(sale.estatus)} ms-1">${sale.estatus.toUpperCase()}</span>
                </button>
            </h2>
            <div id="collapse-${sale._id}" class="accordion-collapse collapse" aria-labelledby="heading-${sale._id}" data-bs-parent="#orders-list-container">
                <div class="accordion-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <p class="mb-1"><strong>ID Completo de Orden:</strong> ${sale._id}</p>
                            <p class="mb-1"><strong>Fecha y Hora:</strong> ${formattedDate} - ${formattedTime}</p>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <p class="mb-1"><strong>Estatus:</strong> <span class="badge ${getStatusBadgeClass(sale.estatus)} fs-6">${sale.estatus.toUpperCase()}</span></p>
                        </div>
                    </div>
                    <h6 class="mt-3 mb-2">Ítems:</h6>
                    <ul class="list-group list-group-flush">
                        ${sale.items.map(item => `
                            <li class="list-group-item px-0 py-2">
                                <div class="row align-items-center">
                                    <div class="col-md-8">
                                        <h6 class="mb-0">${item.titulo} 
                                            <span class="badge bg-info text-dark fw-normal small">${item.tipo === 'renta' ? 'Renta' : 'Compra'}</span>
                                        </h6>
                                        <small class="text-muted d-block">ID Película: ${item.movie ? (item.movie._id || item.movie) : 'N/A'}</small>
                                    </div>
                                    <div class="col-md-2 text-md-center">
                                        <small>Cant: ${item.quantity}</small>
                                        <p class="mb-0"><small>Unit.: $${item.precioUnitario.toFixed(2)}</small></p>
                                    </div>
                                    <div class="col-md-2 text-md-end">
                                        <small class="fw-semibold">Subtotal: $${item.subtotalItem.toFixed(2)}</small>
                                    </div>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                    <hr class="my-3">
                    <div class="text-end">
                        <h5 class="mb-0">Total Pagado: <span class="text-primary fw-bold">$${sale.totalVenta.toFixed(2)}</span></h5>
                    </div>
                </div>
            </div>
        `;
        ordersListContainer.appendChild(accordionItem);
    });
}

// --- Lógica para los modales de login/registro en esta página ---
function setupAuthModalsOrdersPage() {
    const loginFormOrders = document.getElementById('loginFormOrders');
    const registerFormOrders = document.getElementById('registerFormOrders');

    if (loginFormOrders) {
        loginFormOrders.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmailInputOrders').value;
            const password = document.getElementById('loginPasswordInputOrders').value;
            const loginButton = loginFormOrders.querySelector('button[type="submit"]');
            const originalButtonText = loginButton.innerHTML;
            loginButton.disabled = true;
            loginButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Iniciando...`;
            try {
                await loginUser({ email, password }); // de auth.js
                const modalInstance = bootstrap.Modal.getInstance(document.getElementById('loginModalOrders'));
                if (modalInstance) modalInstance.hide();
                
                updateOrdersPageNavbar();
                renderSalesHistory(); // Recargar historial
                updateCartCountOnOrdersNavbar(); // Actualizar contador de carrito
                showAlert('Inicio de sesión exitoso!', 'success', 'alert-container-orders');
            } catch (error) {
                showAlert(error.message || 'Error al iniciar sesión.', 'danger', 'login-alert-container-orders');
            } finally {
                loginButton.disabled = false;
                loginButton.innerHTML = originalButtonText;
            }
        });
    }
    if (registerFormOrders) {
        registerFormOrders.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsernameInputOrders').value;
            const nombre = document.getElementById('registerNombreInputOrders').value;
            const email = document.getElementById('registerEmailInputOrders').value;
            const password = document.getElementById('registerPasswordInputOrders').value;
            const confirmPassword = document.getElementById('registerConfirmPasswordInputOrders').value;
            const fecha_nacimiento = document.getElementById('registerFechaNacimientoInputOrders').value;
            
            const registerButton = registerFormOrders.querySelector('button[type="submit"]');
            const originalButtonText = registerButton.innerHTML;

            if (password !== confirmPassword) {
                showAlert('Las contraseñas no coinciden.', 'danger', 'register-alert-container-orders');
                return;
            }
            registerButton.disabled = true;
            registerButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrando...`;
            try {
                await registerUser({ username, nombre, email, password, fecha_nacimiento }); // de auth.js
                const modalInstance = bootstrap.Modal.getInstance(document.getElementById('registerModalOrders'));
                if (modalInstance) modalInstance.hide();
                
                showAlert('Registro exitoso! Ahora puedes iniciar sesión.', 'success', 'alert-container-orders');
                const loginModalElement = document.getElementById('loginModalOrders');
                if (loginModalElement) { // Abrir modal de login después del registro
                    const loginModal = bootstrap.Modal.getOrCreateInstance(loginModalElement);
                    loginModal.show();
                }
            } catch (error) {
                showAlert(error.message || 'Error en el registro.', 'danger', 'register-alert-container-orders');
            } finally {
                registerButton.disabled = false;
                registerButton.innerHTML = originalButtonText;
            }
        });
    }
}

// --- Inicialización de la página de historial ---
document.addEventListener('DOMContentLoaded', () => {
    // console.log("orders-page.js: DOMContentLoaded");
    updateOrdersPageNavbar(); // Siempre actualiza el navbar primero
    renderSalesHistory();   // Luego carga el historial (que depende de si está logueado)
    setupAuthModalsOrdersPage(); // Configura los modales
    updateCartCountOnOrdersNavbar(); // Actualiza el contador del carrito
});