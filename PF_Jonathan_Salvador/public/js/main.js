// public/js/main.js
import { registerUser, loginUser, isLoggedIn } from './auth.js';
import { updateNavbar, showAlert } from './ui.js';
import { loadMovies } from './movies.js';
import { updateCartCount } from './cart.js';

document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    updateCartCount(); // Actualizar el contador del carrito al cargar la página

    // Cargar películas en la página principal (si estás en ella)
    if (document.getElementById('movie-list-container')) {
        loadMovies();
    }

    const loginForm = document.getElementById('loginForm'); // Asegúrate que tu form de login tenga este ID
    const registerForm = document.getElementById('registerForm'); // Y tu form de registro este ID

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmailInput').value; // IDs de tus inputs
            const password = document.getElementById('loginPasswordInput').value;
            try {
                await loginUser({ email, password });
                bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide(); // Oculta el modal
                updateNavbar();
                updateCartCount();
                showAlert('Inicio de sesión exitoso!', 'success');
                // Opcional: Redirigir o recargar
                // window.location.reload();
            } catch (error) {
                showAlert(error.message || 'Error al iniciar sesión.', 'danger', 'login-alert-container'); // Contenedor de alerta específico para el modal
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('registerUsernameInput').value;
            const nombre = document.getElementById('registerNombreInput').value;
            const email = document.getElementById('registerEmailInput').value;
            const password = document.getElementById('registerPasswordInput').value;
            const confirmPassword = document.getElementById('registerConfirmPasswordInput').value;
            const fecha_nacimiento = document.getElementById('registerFechaNacimientoInput').value;

            if (password !== confirmPassword) {
                showAlert('Las contraseñas no coinciden.', 'danger', 'register-alert-container');
                return;
            }

            try {
                await registerUser({ username, nombre, email, password, fecha_nacimiento });
                bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
                updateNavbar();
                // updateCartCount();
                showAlert('Registro exitoso! Ahora puedes iniciar sesión.', 'success');
            } catch (error) {
                showAlert(error.message || 'Error en el registro.', 'danger', 'register-alert-container');
            }
        });
    }
});