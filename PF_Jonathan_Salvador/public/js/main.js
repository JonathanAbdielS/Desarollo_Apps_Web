// public/js/main.js
import { registerUser, loginUser, isLoggedIn } from './auth.js';
import { updateNavbar, showAlert } from './ui.js';
import { initMoviePage, loadMovies } from './movies.js';
import { updateCartCount } from './cart.js';

document.addEventListener('DOMContentLoaded', async () => {
    updateNavbar();
    updateCartCount();

    if (document.getElementById('movie-list-container')) {
        await initMoviePage();
        loadMovies();
    }

    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmailInput').value;
            const password = document.getElementById('loginPasswordInput').value;
            try {
                await loginUser({ email, password });
                bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide(); 
                updateNavbar();
                updateCartCount();
                showAlert('Inicio de sesión exitoso!', 'success');
                window.location.reload();
            } catch (error) {
                showAlert(error.message || 'Error al iniciar sesión.', 'danger', 'login-alert-container');
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