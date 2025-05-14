// public/js/admin-users.js
import { getToken, getCurrentUser, isLoggedIn, logoutUser } from './auth.js';
import { showAlert } from './ui.js';

const API_BASE_URL = 'http://localhost:3000/api';

const usersTableBody = document.getElementById('admin-users-table-body');
const userRoleModalElement = document.getElementById('userRoleModal');
const userRoleModal = userRoleModalElement ? new bootstrap.Modal(userRoleModalElement) : null;
const userRoleForm = document.getElementById('userRoleForm');
const editUserIdRoleInput = document.getElementById('editUserIdRole');
const userNameForRoleChangeSpan = document.getElementById('userNameForRoleChange');
const userRoleSelect = document.getElementById('userRoleSelect');
const saveUserRoleBtn = document.getElementById('saveUserRoleBtn');

// --- Navbar Admin (similar a admin-movies.js y admin-sales.js) ---
function updateAdminUsersNavbar() {
    const userSessionControls = document.getElementById('user-session-controls-admin-users');
    if (!userSessionControls) {
        // console.warn("Elemento 'user-session-controls-admin-users' no encontrado.");
        return;
    }

    if (isLoggedIn() && getCurrentUser() && getCurrentUser().tipo_usuario === 'admin') {
        const user = getCurrentUser();
        userSessionControls.innerHTML = `
            <span class="navbar-text text-white me-3">
                Admin: ${user.nombre.split(' ')[0]}
            </span>
            <button id="logoutButtonAdminUsers" class="btn btn-outline-light" type="button">Cerrar Sesión</button>
        `;
        const logoutButton = document.getElementById('logoutButtonAdminUsers');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                logoutUser();
                window.location.href = 'index.html'; // O la página de inicio principal
            });
        }
    } else {
        // La lógica en DOMContentLoaded manejará la redirección o el mensaje de acceso denegado
        userSessionControls.innerHTML = `<a href="index.html" class="btn btn-primary">Ir al Sitio</a>`;
    }
}

// --- Funciones para la Gestión de Usuarios ---
async function fetchAdminUsers() {
    const token = getToken();
    if (!token || !isLoggedIn() || getCurrentUser().tipo_usuario !== 'admin') {
        // console.warn("fetchAdminUsers: No autorizado o sin token.");
        return []; // Devuelve array vacío si no está autorizado
    }
    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: "Error al cargar la lista de usuarios."}));
            throw new Error(err.message);
        }
        return await response.json();
    } catch (error) {
        console.error("Error en fetchAdminUsers:", error);
        showAlert(error.message, 'danger', 'alert-container-admin-users');
        return [];
    }
}

function renderAdminUsers(users) {
    if (!usersTableBody) return;
    usersTableBody.innerHTML = ''; // Limpiar tabla

    if (!users || users.length === 0) {
        usersTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay usuarios para mostrar.</td></tr>';
        return;
    }

    users.forEach(user => {
        const registrationDate = new Date(user.fecha_registro || user.createdAt);
        const formattedDate = registrationDate.toLocaleDateString('es-MX', {
            year: 'numeric', month: 'short', day: 'numeric'
        });

        const row = usersTableBody.insertRow();
        row.innerHTML = `
            <td title="${user._id}"><small>${user._id.substring(user._id.length - 6).toUpperCase()}</small></td>
            <td>${user.username}</td>
            <td>${user.nombre}</td>
            <td>${user.email}</td>
            <td>${formattedDate}</td>
            <td><span class="badge ${user.tipo_usuario === 'admin' ? 'bg-success' : 'bg-secondary'}">${user.tipo_usuario ? user.tipo_usuario.toUpperCase() : 'N/A'}</span></td>
            <td>
                <button class="btn btn-sm btn-info change-role-btn" 
                        data-user-id="${user._id}" 
                        data-user-name="${user.username}" 
                        data-current-role="${user.tipo_usuario}" 
                        title="Cambiar Rol"
                        ${getCurrentUser()._id === user._id && user.tipo_usuario === 'admin' && users.filter(u => u.tipo_usuario === 'admin').length <= 1 ? 'disabled title="No se puede cambiar el rol del único administrador"' : ''}
                        ${getCurrentUser()._id === user._id && user.tipo_usuario === 'admin' ? 'title="No puedes cambiar tu propio rol si eres admin"' : ''}
                        >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-fill-gear" viewBox="0 0 16 16"><path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.544-3.393Q8.844 9.002 8 9c-5 0-6 3-6 4m9.886-3.54c.18-.613 1.048-.613 1.229 0l.043.148a.64.64 0 0 0 .921.382l.136-.074c.561-.306 1.175.308.87.869l-.075.136a.64.64 0 0 0 .382.92l.149.045c.612.18.612 1.048 0 1.229l-.15.043a.64.64 0 0 0-.38.921l.074.136c.305.561-.309 1.175-.87.87l-.136-.075a.64.64 0 0 0-.92.382l-.045.149c-.18.612-1.048.612-1.229 0l-.043-.15a.64.64 0 0 0-.921-.38l-.136.074c-.561.305-1.175-.309-.87-.87l.075-.136a.64.64 0 0 0-.382-.92l-.148-.044c-.613-.18-.613-1.048 0-1.229l.148-.043a.64.64 0 0 0 .382-.921l-.074-.136c-.306-.561.308-1.175.869-.87l.136.075a.64.64 0 0 0 .92-.382zM14 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0"/></svg>
                </button>
                <button class="btn btn-sm btn-danger delete-user-btn" 
                        data-user-id="${user._id}" 
                        title="Eliminar Usuario"
                        ${getCurrentUser()._id === user._id ? 'disabled title="No puedes eliminar tu propia cuenta"' : ''}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-fill-x" viewBox="0 0 16 16"><path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0m-9 8c0 1 1 1 1 1h5.256A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1 1.522-3.391c-.934-.526-1.69-1.208-2.19-2.024A5.5 5.5 0 0 0 2 13"/><path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m-.646-4.854.646.647.646-.647a.5.5 0 0 1 .708.708l-.647.646.647.646a.5.5 0 0 1-.708.708l-.646-.647-.646.647a.5.5 0 0 1-.708-.708l.647-.646-.647-.646a.5.5 0 0 1 .708-.708"/></svg>
                </button>
            </td>
        `;
    });
    addEventListenersToAdminUserButtons();
}

function addEventListenersToAdminUserButtons() {
    document.querySelectorAll('.change-role-btn').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true)); // Prevenir listeners duplicados
    });
    document.querySelectorAll('.change-role-btn').forEach(btn => {
        if (btn.disabled) return; // No añadir listener a botones deshabilitados
        btn.addEventListener('click', function() {
            const userId = this.dataset.userId;
            const userName = this.dataset.userName;
            const currentRole = this.dataset.currentRole;
            
            if(editUserIdRoleInput) editUserIdRoleInput.value = userId;
            if(userNameForRoleChangeSpan) userNameForRoleChangeSpan.textContent = userName;
            if(userRoleSelect) userRoleSelect.value = currentRole;
            if(userRoleModal) userRoleModal.show();
        });
    });

    document.querySelectorAll('.delete-user-btn').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true)); // Prevenir listeners duplicados
    });
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
         if (btn.disabled) return; // No añadir listener a botones deshabilitados
        btn.addEventListener('click', async function() {
            const userId = this.dataset.userId;
            if (confirm(`¿Estás seguro de que quieres eliminar al usuario con ID: ${userId}? Esta acción no se puede deshacer.`)) {
                await deleteUser(userId);
            }
        });
    });
}

async function handleUserRoleFormSubmit(event) {
    event.preventDefault();
    const token = getToken();
    if (!isLoggedIn() || !getCurrentUser() || getCurrentUser().tipo_usuario !== 'admin') {
        showAlert('Acción no autorizada.', 'danger', 'user-role-alert-container');
        return;
    }

    const userId = editUserIdRoleInput.value;
    const newRole = userRoleSelect.value;

    if (!userId || !newRole) {
        showAlert('Error al obtener datos del formulario para cambiar rol.', 'warning', 'user-role-alert-container');
        return;
    }
    
    if (saveUserRoleBtn) {
        saveUserRoleBtn.disabled = true;
        saveUserRoleBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ tipo_usuario: newRole })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Error al actualizar el rol del usuario.');
        }
        showAlert(result.message || 'Rol del usuario actualizado exitosamente.', 'success', 'alert-container-admin-users');
        if(userRoleModal) userRoleModal.hide();
        loadAdminUsers(); // Recargar la lista de usuarios para reflejar el cambio
    } catch (error) {
        showAlert(error.message, 'danger', 'user-role-alert-container');
    } finally {
        if (saveUserRoleBtn) {
            saveUserRoleBtn.disabled = false;
            saveUserRoleBtn.textContent = 'Guardar Cambios';
        }
    }
}

async function deleteUser(userId) {
    const token = getToken();
    if (!isLoggedIn() || !getCurrentUser() || getCurrentUser().tipo_usuario !== 'admin') {
        showAlert('Acción no autorizada.', 'danger', 'alert-container-admin-users');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Error al eliminar el usuario.');
        }
        showAlert(result.message || 'Usuario eliminado exitosamente.', 'success', 'alert-container-admin-users');
        loadAdminUsers(); // Recargar la lista
    } catch (error) {
        showAlert(error.message, 'danger', 'alert-container-admin-users');
    }
}

async function loadAdminUsers() {
    if (usersTableBody) usersTableBody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border text-primary mt-3" role="status"><span class="visually-hidden">Cargando usuarios...</span></div></td></tr>';
    const users = await fetchAdminUsers();
    renderAdminUsers(users);
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    // console.log("admin-users.js: DOMContentLoaded");
    updateAdminUsersNavbar(); // Actualiza el navbar de admin

    const currentUser = getCurrentUser();
    if (isLoggedIn() && currentUser && currentUser.tipo_usuario === 'admin') {
        loadAdminUsers(); // Carga la lista de usuarios

        if (userRoleForm) {
            userRoleForm.addEventListener('submit', handleUserRoleFormSubmit);
        }
        
        if (userRoleModalElement) {
            userRoleModalElement.addEventListener('hidden.bs.modal', () => {
                const alertContainer = document.getElementById('user-role-alert-container');
                if (alertContainer) alertContainer.innerHTML = ''; // Limpiar alertas del modal al cerrarse
                if (userRoleForm) userRoleForm.reset(); // Opcional: resetear el select al rol por defecto
                if (editUserIdRoleInput) editUserIdRoleInput.value = '';
                if (userNameForRoleChangeSpan) userNameForRoleChangeSpan.textContent = '';

            });
        }

    } else {
        // Si no es admin, mostrar mensaje de acceso denegado.
        if (usersTableBody) {
            usersTableBody.innerHTML = `<tr><td colspan="7" class="text-center p-5">
                <h3 class="text-danger">Acceso Denegado</h3>
                <p>Debes iniciar sesión como administrador para ver esta página.</p>
                <a href="index.html" class="btn btn-primary mt-3">Volver al Sitio</a>
            </td></tr>`;
        }
        // Ocultar otros elementos de la UI de admin si es necesario
    }
});