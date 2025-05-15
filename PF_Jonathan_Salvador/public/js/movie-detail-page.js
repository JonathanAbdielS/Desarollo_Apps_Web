// public/js/movie-detail-page.js
import { getToken, getCurrentUser, isLoggedIn, loginUser, registerUser, logoutUser } from './auth.js';
import { showAlert } from './ui.js';
import { API_BASE_URL } from './config.js';
import { addItemToCartAndUpdateCount, updateCartCount } from './cart.js';

const movieDetailContent = document.getElementById('movie-detail-content');
const loader = document.getElementById('movie-detail-loader');

// --- Navbar (similar a otras páginas) ---
function updateMovieDetailPageNavbar() {
    const userSessionControls = document.getElementById('user-session-controls-detail');
    const cartLinkContainer = document.getElementById('cart-link-container-detail');
    if (!userSessionControls) return;

    if (isLoggedIn()) {
        const user = getCurrentUser();
        userSessionControls.innerHTML = `
            <span class="navbar-text me-3">Hola, ${user.nombre.split(' ')[0]} ${user.tipo_usuario === 'admin' ? '<span class="badge bg-warning text-dark">Admin</span>' : ''}</span>
            <div class="nav-item dropdown me-3">
                <a class="nav-link dropdown-toggle" href="#" id="accountDropdownDetail" role="button" data-bs-toggle="dropdown" aria-expanded="false">Mi Cuenta</a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdownDetail">
                    <li><a class="dropdown-item" href="orders.html">Mis Compras</a></li>
                    ${user.tipo_usuario === 'admin' ? `<li><a class="dropdown-item" href="admin_movies.html">Gestionar Películas</a></li><li><hr class="dropdown-divider"></li>` : ''}
                    <li><button id="logoutButtonDetail" class="dropdown-item" type="button">Cerrar Sesión</button></li>
                </ul>
            </div>`;
        if (cartLinkContainer) {
            cartLinkContainer.innerHTML = `
                <a href="cart.html" class="nav-link position-relative" role="button">
                    <img src="img/Basket_img.png" alt="Carrito" style="width:30px; height:30px;"/>
                    <span id="cart-count-detail" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">0</span>
                </a>`;
        }
        document.getElementById('logoutButtonDetail')?.addEventListener('click', () => {
            logoutUser();
            updateMovieDetailPageNavbar();
            updateCartCountOnDetailNavbar();
            window.location.href = 'index.html';
        });
    } else {
        userSessionControls.innerHTML = `
            <button type="button" class="btn btn-outline-primary me-2" data-bs-toggle="modal" data-bs-target="#loginModalDetail">Login</button>
            <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#registerModalDetail">Registro</button>`;
        if (cartLinkContainer) cartLinkContainer.innerHTML = '';
    }
}

async function updateCartCountOnDetailNavbar() {
    const cartCountEl = document.getElementById('cart-count-detail');
    if (!cartCountEl) return;
    if (!isLoggedIn()) {
        cartCountEl.textContent = '0';
        cartCountEl.classList.add('d-none');
        return;
    }
    try {
        const cartData = await updateCartCount(); // De cart.js
        const count = cartData && cartData.totalItems !== undefined ? cartData.totalItems : 0;
        cartCountEl.textContent = count;
        cartCountEl.style.display = count > 0 ? 'inline-block' : 'none';
         if (count > 0) cartCountEl.classList.remove('d-none'); else cartCountEl.classList.add('d-none');
    } catch (error) {
        cartCountEl.textContent = '0';
         cartCountEl.classList.add('d-none');
    }
}


async function fetchMovieDetail(movieId) {
    try {
        const response = await fetch(`${API_BASE_URL}/movies/${movieId}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Película no encontrada o error del servidor.'}));
            throw new Error(errorData.message);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching movie detail:', error);
        showAlert(error.message, 'danger', 'alert-container-movie-detail');
        return null;
    }
}

function renderMovieDetail(movie) {
    if (loader) loader.style.display = 'none';
    if (!movieDetailContent) return;

    if (!movie) {
        movieDetailContent.innerHTML = '<p class="text-center text-danger col-12">No se pudo cargar la información de la película.</p>';
        return;
    }

    const releaseYear = movie.fecha_lanzamiento; // Asumiendo que es solo el año como string
    const generos = Array.isArray(movie.genero) ? movie.genero.join(', ') : movie.genero;

    movieDetailContent.innerHTML = `
        <div class="col-md-5 text-center text-md-start mb-3 mb-md-0">
            <img src="${movie.url_imagen || 'img/placeholder_movie_large.jpg'}" alt="${movie.titulo}" class="img-fluid rounded movie-poster-detail shadow">
        </div>
        <div class="col-md-7 details-section">
            <h1 class="mb-3">${movie.titulo} <small class="text-muted">(${releaseYear})</small></h1>
            <p class="lead">${movie.descripcion}</p>
            <hr>
            <p><strong>Categoría:</strong> ${movie.categoria}</p>
            <p><strong>Género(s):</strong> ${generos}</p>
            <p><strong>Calificación:</strong> ${movie.calificacion ? movie.calificacion.toFixed(1) + '/10' : 'N/A'}</p>
            <p><strong>Popularidad:</strong> ${movie.popularidad || 'N/A'}</p>
            <hr>
            <div class="prices mb-3">
                <h4>Precios:</h4>
                <p class="fs-5 mb-1"><strong>Renta: $${movie.precio_renta.toFixed(2)}</strong> (Disponibles: ${movie.stock_renta})</p>
                <p class="fs-5"><strong>Compra: $${movie.precio_compra.toFixed(2)}</strong> (Disponibles: ${movie.stock_compra})</p>
            </div>
            <div class="action-buttons">
                <button class="btn btn-outline-primary btn-lg add-to-cart-detail-btn ${movie.stock_renta <= 0 ? 'disabled' : ''}" data-movie-id="${movie._id}" data-tipo="renta" ${movie.stock_renta <= 0 ? 'disabled' : ''}>
                    Añadir Renta al Carrito
                </button>
                <button class="btn btn-primary btn-lg add-to-cart-detail-btn ${movie.stock_compra <= 0 ? 'disabled' : ''}" data-movie-id="${movie._id}" data-tipo="compra" ${movie.stock_compra <= 0 ? 'disabled' : ''}>
                    Añadir Compra al Carrito
                </button>
            </div>
             <a href="index.html" class="btn btn-link mt-3">&laquo; Volver al catálogo</a>
        </div>
    `;

    addEventListenersToDetailCartButtons();
}

function addEventListenersToDetailCartButtons() {
    document.querySelectorAll('.add-to-cart-detail-btn').forEach(button => {
        button.replaceWith(button.cloneNode(true)); // Prevenir listeners duplicados
    });
     document.querySelectorAll('.add-to-cart-detail-btn').forEach(button => {
        if (button.classList.contains('disabled')) return;

        button.addEventListener('click', async function() {
            if (!isLoggedIn()) {
                showAlert('Debes iniciar sesión para agregar al carrito.', 'warning', 'alert-container-movie-detail');
                const loginModalEl = document.getElementById('loginModalDetail');
                if(loginModalEl) bootstrap.Modal.getOrCreateInstance(loginModalEl).show();
                return;
            }
            const movieId = this.dataset.movieId;
            const tipo = this.dataset.tipo;
            const quantity = 1;

            this.disabled = true;
            const originalText = this.innerHTML;
            this.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Agregando...`;

            try {
                await addItemToCartAndUpdateCount({ movieId, quantity, tipo }); // De cart.js
                showAlert(`"${document.querySelector('.details-section h1').firstChild.textContent.trim()}" (${tipo}) añadido al carrito!`, 'success', 'alert-container-movie-detail');
                // Opcional: actualizar visualmente el stock aquí si es necesario, o recargar detalle
                // loadMovie(); // Para recargar el detalle y el stock visualmente
            } catch (error) {
                showAlert(error.message || 'No se pudo añadir al carrito.', 'danger', 'alert-container-movie-detail');
            } finally {
                this.disabled = false;
                this.innerHTML = originalText;
            }
        });
    });
}


async function loadMovie() {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');

    if (!movieId) {
        if (loader) loader.style.display = 'none';
        if (movieDetailContent) movieDetailContent.innerHTML = '<p class="text-center text-danger col-12">No se especificó ninguna película.</p>';
        return;
    }
    if (loader) loader.style.display = 'block';
    const movie = await fetchMovieDetail(movieId);
    renderMovieDetail(movie);
}

// --- Setup Modales de Autenticación para esta página ---
function setupAuthModalsDetailPage() {
    const loginForm = document.getElementById('loginFormDetail');
    const registerForm = document.getElementById('registerFormDetail');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (lógica de login similar a main.js o cart-page.js, llamando a loginUser)
            const email = document.getElementById('loginEmailInputDetail').value;
            const password = document.getElementById('loginPasswordInputDetail').value;
            const btn = loginForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = 'Iniciando...';
            try {
                await loginUser({ email, password });
                bootstrap.Modal.getInstance(document.getElementById('loginModalDetail')).hide();
                updateMovieDetailPageNavbar();
                updateCartCountOnDetailNavbar();
                // No es necesario recargar la película, solo actualizar UI de auth
            } catch (error) {
                 showAlert(error.message || 'Error al iniciar sesión.', 'danger', 'login-alert-container-detail');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (lógica de registro similar a main.js o cart-page.js, llamando a registerUser)
            const username = document.getElementById('registerUsernameInputDetail').value;
            const nombre = document.getElementById('registerNombreInputDetail').value;
            const email = document.getElementById('registerEmailInputDetail').value;
            // ... otros campos
            const password = document.getElementById('registerPasswordInputDetail').value;
            const confirmPassword = document.getElementById('registerConfirmPasswordInputDetail').value;
            const fecha_nacimiento = document.getElementById('registerFechaNacimientoInputDetail').value;
            
            if (password !== confirmPassword) {
                showAlert('Las contraseñas no coinciden.', 'danger', 'register-alert-container-detail');
                return;
            }
             const btn = registerForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = 'Registrando...';
            try {
                await registerUser({ username, nombre, email, password, fecha_nacimiento /*...*/ });
                bootstrap.Modal.getInstance(document.getElementById('registerModalDetail')).hide();
                showAlert('Registro exitoso. Por favor, inicia sesión.', 'success', 'alert-container-movie-detail');
                 bootstrap.Modal.getOrCreateInstance(document.getElementById('loginModalDetail')).show();

            } catch (error) {
                 showAlert(error.message || 'Error en el registro.', 'danger', 'register-alert-container-detail');
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        });
    }
}


// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    updateMovieDetailPageNavbar();
    updateCartCountOnDetailNavbar();
    loadMovie(); // Carga la película específica
    setupAuthModalsDetailPage();
});