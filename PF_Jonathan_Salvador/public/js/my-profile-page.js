// public/js/my-profile-page.js
import { getToken, getCurrentUser, isLoggedIn, loginUser, registerUser, logoutUser } from './auth.js';
import { showAlert } from './ui.js';
import { updateCartCount } from './cart.js'; // Para actualizar el contador en el navbar

const API_BASE_URL = 'http://localhost:3000/api';

const profileDetailsContent = document.getElementById('profile-details-content');
const profileDetailsLoader = document.getElementById('profile-details-loader');
const profileLoginPrompt = document.getElementById('profile-login-prompt');

// Spans para los detalles del perfil
const profileUsernameSpan = document.getElementById('profileUsername');
const profileNombreCompletoSpan = document.getElementById('profileNombreCompleto');
const profileEmailSpan = document.getElementById('profileEmail');
const profileFechaNacimientoSpan = document.getElementById('profileFechaNacimiento');
const profileFechaRegistroSpan = document.getElementById('profileFechaRegistro');
const profileTipoUsuarioSpan = document.getElementById('profileTipoUsuario');

// Formulario de cambio de contraseña
const changePasswordModalElement = document.getElementById('changePasswordModal');
const changePasswordModal = changePasswordModalElement ? new bootstrap.Modal(changePasswordModalElement) : null;
const changePasswordForm = document.getElementById('changePasswordForm');
const savePasswordChangeBtn = document.getElementById('savePasswordChangeBtn');


// --- Navbar (similar a otras páginas) ---
function updateProfilePageNavbar() {
    const userSessionControls = document.getElementById('user-session-controls-profile');
    const cartLinkContainer = document.getElementById('cart-link-container-profile');
    if (!userSessionControls) return;

    if (isLoggedIn()) {
        const user = getCurrentUser();
        userSessionControls.innerHTML = `
            <span class="navbar-text me-3">Hola, ${user.nombre.split(' ')[0]} ${user.tipo_usuario === 'admin' ? '<span class="badge bg-warning text-dark">Admin</span>' : ''}</span>
            <div class="nav-item dropdown me-3">
                <a class="nav-link dropdown-toggle active" href="#" id="accountDropdownProfile" role="button" data-bs-toggle="dropdown" aria-expanded="false">Mi Cuenta</a>
                <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdownProfile">
                    <li><a class="dropdown-item active" href="my_profile.html">Mi Perfil</a></li>
                    <li><a class="dropdown-item" href="orders.html">Mis Compras</a></li>
                    ${user.tipo_usuario === 'admin' ? `
                        <li><a class="dropdown-item" href="admin_movies.html">Gestionar Películas</a></li>
                        <li><a class="dropdown-item" href="admin_users.html">Gestionar Usuarios</a></li>
                        <li><a class="dropdown-item" href="admin_sales.html">Ver Ventas</a></li>
                        <li><hr class="dropdown-divider"></li>` : ''}
                    <li><button id="logoutButtonProfilePage" class="dropdown-item" type="button">Cerrar Sesión</button></li>
                </ul>
            </div>`;
        if (cartLinkContainer) {
            cartLinkContainer.innerHTML = `
                <a href="cart.html" class="nav-link position-relative" role="button">
                    <img src="img/Basket_img.png" alt="Carrito" style="width:30px; height:30px;"/>
                    <span class="visually-hidden">Carrito</span>
                    <span id="cart-count-profile" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="display: none;">0</span>
                </a>`;
        }
        document.getElementById('logoutButtonProfilePage')?.addEventListener('click', () => {
            logoutUser();
            updateProfilePageNavbar();
            updateCartCountOnProfileNavbar();
            window.location.href = 'index.html';
        });
    } else {
        userSessionControls.innerHTML = `
            <button type="button" class="btn btn-outline-primary me-2" data-bs-toggle="modal" data-bs-target="#loginModalProfile">Login</button>
            <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#registerModalProfile">Registro</button>`;
        if (cartLinkContainer) cartLinkContainer.innerHTML = '';
    }
}

async function updateCartCountOnProfileNavbar() {
    const cartCountEl = document.getElementById('cart-count-profile');
    if (!cartCountEl) return;
    if (!isLoggedIn()) {
        cartCountEl.textContent = '0';
        cartCountEl.style.display = 'none';
        return;
    }
    try {
        const cartData = await updateCartCount(); // De cart.js
        const count = cartData && cartData.totalItems !== undefined ? cartData.totalItems : 0;
        cartCountEl.textContent = count;
        cartCountEl.style.display = count > 0 ? 'inline-block' : 'none';
    } catch (error) {
        cartCountEl.textContent = '0';
        cartCountEl.style.display = 'none';
    }
}


async function loadProfileDetails() {
    if (!isLoggedIn()) {
        if (profileDetailsLoader) profileDetailsLoader.style.display = 'none';
        if (profileDetailsContent) profileDetailsContent.style.display = 'none';
        if (profileLoginPrompt) profileLoginPrompt.style.display = 'block';
        updateProfilePageNavbar(); // Actualiza navbar para mostrar botones de login/registro
        return;
    }

    if (profileLoginPrompt) profileLoginPrompt.style.display = 'none';
    if (profileDetailsLoader) profileDetailsLoader.style.display = 'block';
    if (profileDetailsContent) profileDetailsContent.style.display = 'none';

    const token = getToken();
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Error al obtener datos del perfil.' }));
            if (response.status === 401) { // Token inválido o expirado
                logoutUser(); // Limpiar token inválido
                updateProfilePageNavbar();
                 if (profileLoginPrompt) profileLoginPrompt.style.display = 'block';
                 showAlert('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 'warning', 'alert-container-profile');
            }
            throw new Error(errorData.message);
        }
        const user = await response.json();

        if (profileDetailsLoader) profileDetailsLoader.style.display = 'none';
        if (profileDetailsContent) profileDetailsContent.style.display = 'block';

        if (profileUsernameSpan) profileUsernameSpan.textContent = user.username;
        if (profileNombreCompletoSpan) profileNombreCompletoSpan.textContent = user.nombre;
        if (profileEmailSpan) profileEmailSpan.textContent = user.email;
        
        if (profileFechaNacimientoSpan) {
            profileFechaNacimientoSpan.textContent = user.fecha_nacimiento ? new Date(user.fecha_nacimiento).toLocaleDateString('es-MX') : 'No especificada';
        }
        if (profileFechaRegistroSpan) {
            profileFechaRegistroSpan.textContent = user.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
        }
        if (profileTipoUsuarioSpan) {
            profileTipoUsuarioSpan.textContent = user.tipo_usuario.toUpperCase();
            profileTipoUsuarioSpan.className = `badge ${user.tipo_usuario === 'admin' ? 'bg-success' : 'bg-info text-dark'}`;
        }

    } catch (error) {
        console.error('Error loading profile details:', error);
        if (profileDetailsLoader) profileDetailsLoader.style.display = 'none';
        if (profileDetailsContent) profileDetailsContent.innerHTML = `<p class="text-danger text-center">No se pudieron cargar los detalles del perfil: ${error.message}</p>`;
    }
}

// --- Lógica para Modales de Login/Registro en esta página (si el usuario no está logueado) ---
function setupAuthModalsProfilePage() {
    const loginForm = document.getElementById('loginFormProfilePage');
    const registerForm = document.getElementById('registerFormProfilePage');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmailInputProfilePage').value;
            const password = document.getElementById('loginPasswordInputProfilePage').value;
            const btn = loginForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.disabled = true; btn.innerHTML = 'Iniciando...';
            try {
                await loginUser({ email, password });
                bootstrap.Modal.getInstance(document.getElementById('loginModalProfile')).hide();
                updateProfilePageNavbar();
                loadProfileDetails(); // Cargar detalles del perfil ahora que está logueado
                updateCartCountOnProfileNavbar();
            } catch (error) {
                showAlert(error.message || 'Error al iniciar sesión.', 'danger', 'login-alert-container-profile-page');
            } finally {
                btn.disabled = false; btn.innerHTML = originalText;
            }
        });
    }
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsernameInputProfilePage').value;
            const nombre = document.getElementById('registerNombreInputProfilePage').value;
            const email = document.getElementById('registerEmailInputProfilePage').value;
            const password = document.getElementById('registerPasswordInputProfilePage').value;
            const confirmPassword = document.getElementById('registerConfirmPasswordInputProfilePage').value;
            const fecha_nacimiento = document.getElementById('registerFechaNacimientoInputProfilePage').value;

            if (password !== confirmPassword) {
                showAlert('Las contraseñas no coinciden.', 'danger', 'register-alert-container-profile-page');
                return;
            }
            const btn = registerForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            btn.disabled = true; btn.innerHTML = 'Registrando...';
            try {
                await registerUser({ username, nombre, email, password, fecha_nacimiento });
                bootstrap.Modal.getInstance(document.getElementById('registerModalProfile')).hide();
                showAlert('Registro exitoso. Por favor, inicia sesión.', 'success', 'alert-container-profile');
                bootstrap.Modal.getOrCreateInstance(document.getElementById('loginModalProfile')).show();
            } catch (error) {
                showAlert(error.message || 'Error en el registro.', 'danger', 'register-alert-container-profile-page');
            } finally {
                btn.disabled = false; btn.innerHTML = originalText;
            }
        });
    }
}

async function handleChangePasswordSubmit(event) {
    event.preventDefault();
    const token = getToken();
    if (!token || !isLoggedIn()) {
        showAlert('Debes iniciar sesión para cambiar tu contraseña.', 'warning', 'change-password-alert-container');
        return;
    }

    const currentPasswordInput = document.getElementById('currentPasswordInput');
    const newPasswordInput = document.getElementById('newPasswordInput');
    const confirmNewPasswordInput = document.getElementById('confirmNewPasswordInput');

    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmNewPassword = confirmNewPasswordInput.value;

    // Limpiar alertas previas del modal
    const alertContainer = document.getElementById('change-password-alert-container');
    if (alertContainer) alertContainer.innerHTML = '';


    if (!currentPassword || !newPassword || !confirmNewPassword) {
        showAlert('Todos los campos son obligatorios.', 'warning', 'change-password-alert-container');
        return;
    }
    if (newPassword !== confirmNewPassword) {
        showAlert('La nueva contraseña y su confirmación no coinciden.', 'warning', 'change-password-alert-container');
        return;
    }
    if (newPassword.length < 6) {
        showAlert('La nueva contraseña debe tener al menos 6 caracteres.', 'warning', 'change-password-alert-container');
        return;
    }
    if (newPassword === currentPassword) {
        showAlert('La nueva contraseña no puede ser igual a la contraseña actual.', 'warning', 'change-password-alert-container');
        return;
    }

    if (savePasswordChangeBtn) {
        savePasswordChangeBtn.disabled = true;
        savePasswordChangeBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/changepassword`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Error al cambiar la contraseña.');
        }

        showAlert(result.message || 'Contraseña actualizada exitosamente. Se recomienda cerrar sesión y volver a iniciar.', 'success', 'alert-container-profile'); // Alerta global en la página de perfil
        if (changePasswordModal) changePasswordModal.hide();
        if (changePasswordForm) changePasswordForm.reset(); // Limpiar formulario

        logoutUser();
        updateProfilePageNavbar();
        showAlert('Por favor, inicia sesión con tu nueva contraseña.', 'info', 'alert-container-profile');


    } catch (error) {
        showAlert(error.message, 'danger', 'change-password-alert-container'); // Alerta dentro del modal
    } finally {
        if (savePasswordChangeBtn) {
            savePasswordChangeBtn.disabled = false;
            savePasswordChangeBtn.textContent = 'Guardar Nueva Contraseña';
        }
    }
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    updateProfilePageNavbar();
    updateCartCountOnProfileNavbar();
    loadProfileDetails();
    setupAuthModalsProfilePage(); // Configura los modales de login/registro por si el usuario no está logueado
    
   if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePasswordSubmit);
    }

    // Limpiar el formulario de cambio de contraseña cuando el modal se cierra
    if (changePasswordModalElement) {
        changePasswordModalElement.addEventListener('hidden.bs.modal', () => {
            const alertContainer = document.getElementById('change-password-alert-container');
            if(alertContainer) alertContainer.innerHTML = '';
            if(changePasswordForm) changePasswordForm.reset();
        });
    }
});