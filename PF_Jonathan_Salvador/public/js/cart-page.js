// public/js/cart-page.js
import { getToken, getCurrentUser, isLoggedIn, loginUser, registerUser } from './auth.js';
import { API_BASE_URL } from './config.js';
import { updateNavbar as updateGlobalNavbar, showAlert } from './ui.js';
import { fetchCart, updateCartItemQuantity as apiUpdateQty, removeCartItem as apiRemoveItem, clearCart as apiClearCart, updateCartCount } from './cart.js';


const cartItemsContainer = document.getElementById('cart-items-container');
const totalItemsSummary = document.getElementById('total-items-summary');
const subtotalGeneralSummary = document.getElementById('subtotal-general-summary');
const checkoutBtn = document.getElementById('checkout-btn');
const clearCartBtn = document.getElementById('clear-cart-btn');

function updateCartPageNavbar() {
    const userSessionControls = document.getElementById('user-session-controls-cart');
    const cartLinkContainer = document.getElementById('cart-link-container-cart');

    if (!userSessionControls) {
        return;
    }

    if (isLoggedIn()) {
        const user = getCurrentUser();
        userSessionControls.innerHTML = `
            <span class="navbar-text me-3">
                Hola, ${user.nombre.split(' ')[0]} ${user.tipo_usuario === 'admin' ? '<span class="badge bg-warning text-dark">Admin</span>' : ''}
            </span>
            <div class="nav-item dropdown me-3">
                <a class="nav-link dropdown-toggle" href="#" id="accountDropdownCart" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Mi Cuenta
                </a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdownCart">
                    <li><a class="dropdown-item" href="orders.html">Mis Compras</a></li>
                    ${user.tipo_usuario === 'admin' ? `
                        <li><a class="dropdown-item" href="admin_movies.html">Gestionar Películas</a></li>
                        <li><a class="dropdown-item" href="admin_users.html">Gestionar Usuarios</a></li>
                        <li><a class="dropdown-item" href="admin_sales.html">Ver Ventas</a></li>
                        <li><hr class="dropdown-divider"></li>
                    ` : ''}
                    <li><button id="logoutButtonCart" class="dropdown-item" type="button">Cerrar Sesión</button></li>
                </ul>
            </div>
        `;
        if (cartLinkContainer) {
            cartLinkContainer.innerHTML = `
                <a href="cart.html" class="nav-link active position-relative" role="button"> <img src="img/Basket_img.png" alt="Carrito" style="width:30px; height:30px;"/>
                    <span class="visually-hidden">Carrito</span>
                    <span id="cart-count-cart" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                        0 <span class="visually-hidden">ítems en el carrito</span>
                    </span>
                </a>
            `;
        }

        const logoutButton = document.getElementById('logoutButtonCart');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                updateCartPageNavbar();
                updateCartCountOnNavbar(0); // Actualiza el contador específico de esta página a 0
                 window.location.href = 'index.html'; // O la página de inicio que hayas definido
            });
        }
    } else {
        userSessionControls.innerHTML = `
            <button type="button" class="btn btn-outline-primary me-2" data-bs-toggle="modal" data-bs-target="#loginModalCart">
                Login
            </button>
            <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#registerModalCart">
                Registro
            </button>
        `;
        if (cartLinkContainer) cartLinkContainer.innerHTML = '';
        if (cartItemsContainer) cartItemsContainer.innerHTML = '<p class="text-center mt-5">Debes <a href="#" data-bs-toggle="modal" data-bs-target="#loginModalCart">iniciar sesión</a> para ver tu carrito.</p>';
        if (document.getElementById('cart-summary')) document.getElementById('cart-summary').style.display = 'none';
    }
}

async function updateCartCountOnNavbar() {
    const cartCountEl = document.getElementById('cart-count-cart');
    if (!cartCountEl) return;

    if (!isLoggedIn()) {
        cartCountEl.textContent = '0';
        cartCountEl.classList.add('d-none');
        return;
    }
    try {
        const cart = await fetchCart(); // Asumiendo que fetchCart devuelve { totalItems: X } o null/error
        const count = cart && cart.totalItems !== undefined ? cart.totalItems : 0;
        cartCountEl.textContent = count;
        if (count > 0) {
            cartCountEl.classList.remove('d-none');
        } else {
            cartCountEl.classList.add('d-none');
        }
    } catch (error) {
        // console.warn("No se pudo actualizar contador del carrito en navbar:", error.message);
        cartCountEl.textContent = '0';
        cartCountEl.classList.add('d-none');
    }
}


async function renderCartItems() {
    if (!isLoggedIn()) {
        updateCartPageNavbar();
        return;
    }
    if (!cartItemsContainer || !totalItemsSummary || !subtotalGeneralSummary) {
        console.error("Elementos del DOM para el carrito no encontrados.");
        return;
    }

    cartItemsContainer.innerHTML = '<div class="d-flex justify-content-center mt-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando carrito...</span></div></div>';

    try {
        const cartData = await fetchCart();

        if (!cartData || !cartData.items || cartData.items.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-center mt-5">Tu carrito está vacío. <a href="index.html">¡Empieza a añadir películas!</a></p>';
            totalItemsSummary.textContent = '0';
            subtotalGeneralSummary.textContent = '0.00';
            if (checkoutBtn) checkoutBtn.disabled = true;
            if (clearCartBtn) clearCartBtn.disabled = true;
            if (document.getElementById('cart-summary')) document.getElementById('cart-summary').style.display = 'block';
            updateCartCountOnNavbar();
            return;
        }

        cartItemsContainer.innerHTML = '';
        cartData.items.forEach(item => {
            if (!item.movie) { 
                console.warn("Ítem del carrito sin datos de película:", item);
                return;
            }
            const itemSubtotal = item.quantity * item.precioUnitarioAlAgregar;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'card mb-3 cart-item';
            itemDiv.dataset.movieId = item.movie._id;
            itemDiv.dataset.tipo = item.tipo;

            itemDiv.innerHTML = `
                <div class="row g-0">
                    <div class="col-md-2 col-4 text-center p-2">
                        <img src="${item.movie.url_imagen || 'img/placeholder_movie.jpg'}" class="img-fluid rounded-start cart-item-img" alt="${item.movie.titulo}" style="max-height: 150px; width: auto; object-fit: contain;">
                    </div>
                    <div class="col-md-10 col-8">
                        <div class="card-body py-2 px-3">
                            <div class="d-flex justify-content-between align-items-start">
                                <h5 class="card-title cart-item-title mb-1 h6">${item.movie.titulo} <span class="badge bg-secondary fw-normal">${item.tipo === 'renta' ? 'Renta' : 'Compra'}</span></h5>
                                <button class="btn btn-sm btn-outline-danger remove-item-btn border-0" title="Eliminar ítem" data-movie-id="${item.movie._id}" data-tipo="${item.tipo}">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/></svg>
                                </button>
                            </div>
                            <p class="card-text mb-1"><small>Precio Unit.: $${item.precioUnitarioAlAgregar.toFixed(2)}</small></p>
                            <div class="d-flex align-items-center mb-2">
                                <label for="quantity-${item.movie._id}-${item.tipo}" class="form-label me-2 mb-0 small">Cantidad:</label>
                                <input type="number" class="form-control form-control-sm quantity-input" 
                                       value="${item.quantity}" min="1" 
                                       style="width: 80px;" 
                                       id="quantity-${item.movie._id}-${item.tipo}"
                                       data-movie-id="${item.movie._id}" data-tipo="${item.tipo}"
                                       data-stock="${item.tipo === 'renta' ? item.movie.stock_renta : item.movie.stock_compra}">
                            </div>
                            <p class="card-text fw-bold">Subtotal Ítem: $<span class="cart-item-subtotal">${itemSubtotal.toFixed(2)}</span></p>
                        </div>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(itemDiv);
        });

        totalItemsSummary.textContent = cartData.totalItems;
        subtotalGeneralSummary.textContent = cartData.subtotal.toFixed(2);
        if (checkoutBtn) checkoutBtn.disabled = cartData.items.length === 0;
        if (clearCartBtn) clearCartBtn.disabled = cartData.items.length === 0;
        if (document.getElementById('cart-summary')) document.getElementById('cart-summary').style.display = 'block';

        addEventListenersToCartPageItems();
        updateCartCountOnNavbar();

    } catch (error) {
        console.error('Error renderizando carrito:', error);
        cartItemsContainer.innerHTML = `<p class="text-center text-danger mt-5">Error al cargar el carrito: ${error.message || 'Intenta de nuevo más tarde.'}</p>`;
        if (checkoutBtn) checkoutBtn.disabled = true;
        if (clearCartBtn) clearCartBtn.disabled = true;
    }
}

function addEventListenersToCartPageItems() {
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.replaceWith(button.cloneNode(true));
    });
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', async function() {
            const movieId = this.dataset.movieId;
            const tipo = this.dataset.tipo;
            if (confirm('¿Estás seguro de que quieres eliminar esta película de tu carrito?')) {
                try {
                    await apiRemoveItem({ movieId, tipo });
                    showAlert('Ítem eliminado del carrito.', 'success', 'alert-container-cart');
                    renderCartItems();
                } catch (error) {
                    showAlert(error.message || 'Error al eliminar el ítem.', 'danger', 'alert-container-cart');
                }
            }
        });
    });

    document.querySelectorAll('.quantity-input').forEach(input => {
        input.replaceWith(input.cloneNode(true));
    });

    let debounceTimer;
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', async function() {
            clearTimeout(debounceTimer);
            const movieId = this.dataset.movieId;
            const tipo = this.dataset.tipo;
            let quantity = parseInt(this.value);
            const maxStock = parseInt(this.dataset.stock);

            if (isNaN(quantity) || quantity < 1) {
                showAlert('La cantidad debe ser al menos 1.', 'warning', 'alert-container-cart');
                this.value = 1;
                quantity = 1;
            }
            if (quantity > maxStock) {
                showAlert(`La cantidad solicitada (${quantity}) excede el stock disponible (${maxStock}). Se ajustará al máximo.`, 'warning', 'alert-container-cart');
                this.value = maxStock;
                quantity = maxStock;
            }
            if (quantity === 0 && maxStock > 0) {
                this.value = 1;
                quantity = 1;
            }
            if (maxStock === 0 && quantity > 0) {
                showAlert('Este artículo no tiene stock disponible.', 'danger', 'alert-container-cart');
                this.value = 0;
                renderCartItems();
                return;
            }


            debounceTimer = setTimeout(async () => {
                try {
                    await apiUpdateQty({ movieId, quantity, tipo });
                    renderCartItems();
                } catch (error) {
                    showAlert(error.message || 'Error al actualizar la cantidad.', 'danger', 'alert-container-cart');
                    renderCartItems();
                }
            }, 300);
        });
    });
}

if (clearCartBtn) {
    clearCartBtn.addEventListener('click', async () => {
        if (confirm('¿Estás seguro de que quieres vaciar todo tu carrito?')) {
            try {
                await apiClearCart();
                showAlert('Carrito vaciado exitosamente.', 'success', 'alert-container-cart');
                renderCartItems();
            } catch (error) {
                showAlert(error.message || 'Error al vaciar el carrito.', 'danger', 'alert-container-cart');
            }
        }
    });
}

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
        if (confirm('¿Proceder al pago con los ítems de tu carrito?')) {
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Procesando...`;
            try {
                const token = getToken();
                const response = await fetch(`${API_BASE_URL}/sales/checkout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Error al procesar la compra.');
                }
                showAlert('¡Compra realizada exitosamente! Serás redirigido a tu historial de compras.', 'success', 'alert-container-cart');
                setTimeout(() => {
                    window.location.href = 'orders.html';
                }, 2500);
            } catch (error) {
                showAlert(error.message || 'Error al procesar la compra.', 'danger', 'alert-container-cart');
                checkoutBtn.disabled = false;
                checkoutBtn.innerHTML = 'Proceder al Pago';
            }
        }
    });
}

function setupAuthModalsCartPage() {
    const loginFormCart = document.getElementById('loginFormCart');
    const registerFormCart = document.getElementById('registerFormCart');

    if (loginFormCart) {
        loginFormCart.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmailInputCart').value;
            const password = document.getElementById('loginPasswordInputCart').value;
            const loginButton = loginFormCart.querySelector('button[type="submit"]');
            const originalButtonText = loginButton.innerHTML;
            loginButton.disabled = true;
            loginButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Iniciando...`;

            try {
                await loginUser({ email, password });
                const modalInstance = bootstrap.Modal.getInstance(document.getElementById('loginModalCart'));
                if (modalInstance) modalInstance.hide();
                
                updateCartPageNavbar();
                renderCartItems();
                showAlert('Inicio de sesión exitoso!', 'success', 'alert-container-cart');
            } catch (error) {
                showAlert(error.message || 'Error al iniciar sesión.', 'danger', 'login-alert-container-cart');
            } finally {
                loginButton.disabled = false;
                loginButton.innerHTML = originalButtonText;
            }
        });
    }

    if (registerFormCart) {
        registerFormCart.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsernameInputCart').value;
            const nombre = document.getElementById('registerNombreInputCart').value;
            const email = document.getElementById('registerEmailInputCart').value;
            const password = document.getElementById('registerPasswordInputCart').value;
            const confirmPassword = document.getElementById('registerConfirmPasswordInputCart').value;
            const fecha_nacimiento = document.getElementById('registerFechaNacimientoInputCart').value;

            const registerButton = registerFormCart.querySelector('button[type="submit"]');
            const originalButtonText = registerButton.innerHTML;


            if (password !== confirmPassword) {
                showAlert('Las contraseñas no coinciden.', 'danger', 'register-alert-container-cart');
                return;
            }
            registerButton.disabled = true;
            registerButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrando...`;
            try {
                await registerUser({ username, nombre, email, password, fecha_nacimiento });
                const modalInstance = bootstrap.Modal.getInstance(document.getElementById('registerModalCart'));
                if (modalInstance) modalInstance.hide();
                
                // No se necesita actualizar el navbar aquí, ya que el usuario debe hacer login después
                showAlert('Registro exitoso! Ahora puedes iniciar sesión.', 'success', 'alert-container-cart');
                // Opcional: abrir modal de login
                const loginModalElement = document.getElementById('loginModalCart');
                if (loginModalElement) {
                    const loginModal = bootstrap.Modal.getOrCreateInstance(loginModalElement);
                    loginModal.show();
                }

            } catch (error) {
                showAlert(error.message || 'Error en el registro.', 'danger', 'register-alert-container-cart');
            } finally {
                registerButton.disabled = false;
                registerButton.innerHTML = originalButtonText;
            }
        });
    }
}

// --- Inicialización de la página del carrito ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("cart-page.js: DOMContentLoaded");
    updateCartPageNavbar();
    renderCartItems();
    setupAuthModalsCartPage();
    updateCartCountOnNavbar(); // Asegura que el contador del navbar se actualice al cargar.
    
    const searchFormOnCartPage = document.getElementById('searchFormCart');
    if (searchFormOnCartPage) {
        searchFormOnCartPage.addEventListener('submit', (e) => {
            e.preventDefault();
            const searchTerm = document.getElementById('searchInputCart').value;
            if(searchTerm.trim()){
                 window.location.href = `index.html?search=${encodeURIComponent(searchTerm.trim())}`;
            } else {
                window.location.href = 'index.html'; // O simplemente no hacer nada si está vacío
            }
        });
    }
});