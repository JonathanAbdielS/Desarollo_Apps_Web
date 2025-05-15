// public/js/admin-sales.js
import { getToken, getCurrentUser, isLoggedIn, logoutUser } from './auth.js';
import { API_BASE_URL } from './config.js';
import { showAlert } from './ui.js';

const salesTableBody = document.getElementById('admin-sales-table-body');
const paginationContainer = document.getElementById('admin-sales-pagination-container');
const saleDetailModalElement = document.getElementById('saleDetailModal');
const saleDetailModal = saleDetailModalElement ? new bootstrap.Modal(saleDetailModalElement) : null;
const saleDetailContent = document.getElementById('sale-detail-content');
const saleStatusForm = document.getElementById('saleStatusForm');
const editSaleIdStatusInput = document.getElementById('editSaleIdStatus');
const saleStatusSelect = document.getElementById('saleStatusSelect');
const saveSaleStatusBtn = document.getElementById('saveSaleStatusBtn');
const filterSaleStatusSelect = document.getElementById('filterSaleStatus');

let adminSalesCurrentPage = 1;
let currentSaleStatusFilter = '';

// --- Navbar Admin ---
function updateAdminSalesNavbar() {
    const userSessionControls = document.getElementById('user-session-controls-admin-sales');
    if (!userSessionControls) {
        // console.warn("Elemento 'user-session-controls-admin-sales' no encontrado.");
        return;
    }

    if (isLoggedIn() && getCurrentUser() && getCurrentUser().tipo_usuario === 'admin') {
        const user = getCurrentUser();
        userSessionControls.innerHTML = `
            <span class="navbar-text text-white me-3">
                Admin: ${user.nombre.split(' ')[0]}
            </span>
            <button id="logoutButtonAdminSales" class="btn btn-outline-light" type="button">Cerrar Sesión</button>
        `;
        const logoutButton = document.getElementById('logoutButtonAdminSales');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                logoutUser();
                window.location.href = 'index.html'; // Redirigir al home público
            });
        }
    } else {
        // La lógica en DOMContentLoaded manejará la redirección o mensaje.
        userSessionControls.innerHTML = `<a href="index.html" class="btn btn-primary">Ir al Sitio</a>`;
    }
}

// --- Gestión de Ventas ---
async function fetchAdminSales(page = 1, estatus = '', limit = 10) {
    const token = getToken();
    if (!token || !isLoggedIn() || getCurrentUser().tipo_usuario !== 'admin') {
        return { sales: [], totalPages: 0, currentPage: 1, totalSales: 0 };
    }
    try {
        const params = new URLSearchParams({ page, limit });
        if (estatus) params.append('estatus', estatus);
        // Aquí podrías añadir más parámetros de filtro si los implementas (ej. userId, dateRange)

        const response = await fetch(`${API_BASE_URL}/sales?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: "Error al cargar la lista de ventas."}));
            throw new Error(err.message);
        }
        return await response.json(); // Esperado: { sales: [...], currentPage, totalPages, totalSales }
    } catch (error) {
        console.error("Error en fetchAdminSales:", error);
        showAlert(error.message, 'danger', 'alert-container-admin-sales');
        return { sales: [], totalPages: 0, currentPage: 1, totalSales: 0 };
    }
}

function getStatusBadgeClassAdmin(status) {
    if (!status) return 'bg-secondary';
    switch (status.toLowerCase()) {
        case 'completada': return 'bg-success';
        case 'pendiente': return 'bg-warning text-dark';
        case 'cancelada': return 'bg-danger';
        default: return 'bg-info text-dark'; // Un color por defecto para estatus desconocidos
    }
}

function renderAdminSales(data) {
    if (!salesTableBody) return;
    salesTableBody.innerHTML = ''; // Limpiar tabla

    if (!data || !data.sales || data.sales.length === 0) {
        salesTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay ventas para mostrar con los filtros actuales.</td></tr>';
        renderAdminSalesPagination(0, 0); // Limpiar paginación
        return;
    }

    data.sales.forEach(sale => {
        const saleDate = new Date(sale.fecha_compra || sale.createdAt);
        const formattedDate = saleDate.toLocaleDateString('es-MX', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const userName = sale.user ? sale.user.username : 'Usuario Desconocido';
        const userEmail = sale.user ? sale.user.email : 'N/A';

        const row = salesTableBody.insertRow();
        row.innerHTML = `
            <td title="${sale._id}"><small>${sale._id.substring(sale._id.length - 7).toUpperCase()}</small></td>
            <td title="${userName}">${userName}</td>
            <td title="${userEmail}">${userEmail}</td>
            <td>${formattedDate}</td>
            <td>$${sale.totalVenta.toFixed(2)}</td>
            <td><span class="badge ${getStatusBadgeClassAdmin(sale.estatus)}">${sale.estatus ? sale.estatus.toUpperCase() : 'N/A'}</span></td>
            <td>
                <button class="btn btn-sm btn-primary view-sale-detail-btn" data-sale-id="${sale._id}" title="Ver Detalle / Cambiar Estatus">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill me-1" viewBox="0 0 16 16"><path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/><path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/></svg>
                    Detalles
                </button>
            </td>
        `;
    });
    renderAdminSalesPagination(data.totalPages, data.currentPage);
    addEventListenersToAdminSaleButtons();
}

function renderAdminSalesPagination(totalPages, page) {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    if (totalPages <= 1) return;

    const ul = document.createElement('ul');
    ul.className = 'pagination';

    // Lógica de paginación (puede ser la misma que en admin-movies.js o movies.js)
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${page === 1 ? 'disabled' : ''}`;
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.textContent = 'Anterior';
    if (page > 1) {
        prevLink.addEventListener('click', (e) => { e.preventDefault(); loadAdminSales(page - 1, currentSaleStatusFilter); });
    }
    prevLi.appendChild(prevLink);
    ul.appendChild(prevLi);

    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === page ? 'active' : ''}`;
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        if (i !== page) {
            pageLink.addEventListener('click', (e) => { e.preventDefault(); loadAdminSales(i, currentSaleStatusFilter); });
        }
        pageLi.appendChild(pageLink);
        ul.appendChild(pageLi);
    }

    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${page === totalPages ? 'disabled' : ''}`;
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.textContent = 'Siguiente';
    if (page < totalPages) {
        nextLink.addEventListener('click', (e) => { e.preventDefault(); loadAdminSales(page + 1, currentSaleStatusFilter); });
    }
    nextLi.appendChild(nextLink);
    ul.appendChild(nextLi);

    paginationContainer.appendChild(ul);
}

function addEventListenersToAdminSaleButtons() {
    document.querySelectorAll('.view-sale-detail-btn').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true)); // Prevenir listeners duplicados
    });
    document.querySelectorAll('.view-sale-detail-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const saleId = this.dataset.saleId;
            await populateSaleDetailModal(saleId);
        });
    });
}

async function populateSaleDetailModal(saleId) {
    const token = getToken();
    if (!token || !saleDetailContent || !saleDetailModal || !editSaleIdStatusInput || !saleStatusSelect) {
        console.error("Faltan elementos del DOM para el modal de detalle de venta.");
        return;
    }
    
    saleDetailContent.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
    if (saleStatusForm) saleStatusForm.reset(); // Resetear el formulario de estatus
    editSaleIdStatusInput.value = saleId;

    try {
        const response = await fetch(`${API_BASE_URL}/sales/${saleId}`, { // El endpoint /api/sales/:id ya lo creamos
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: 'Error al cargar el detalle de la venta.'}));
            throw new Error(err.message);
        }
        const sale = await response.json();
        
        const saleDate = new Date(sale.fecha_compra || sale.createdAt);
        const formattedDate = saleDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
        const formattedTime = saleDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

        let itemsHtml = '<ul class="list-group list-group-flush mb-3">';
        sale.items.forEach(item => {
            itemsHtml += `
                <li class="list-group-item px-0">
                    <div class="d-flex justify-content-between">
                        <span><strong>${item.titulo}</strong> (${item.tipo})</span>
                        <span>Cant: ${item.quantity}</span>
                    </div>
                    <div class="d-flex justify-content-between">
                        <small>Precio Unit.: $${item.precioUnitario.toFixed(2)}</small>
                        <small>Subtotal: $${item.subtotalItem.toFixed(2)}</small>
                    </div>
                </li>`;
        });
        itemsHtml += '</ul>';

        saleDetailContent.innerHTML = `
            <p><strong>ID Venta:</strong> ${sale._id}</p>
            <p><strong>Usuario:</strong> ${sale.user ? sale.user.username : 'N/A'} (<small>${sale.user ? sale.user.email : 'N/A'}</small>)</p>
            <p><strong>Fecha:</strong> ${formattedDate} - ${formattedTime}</p>
            <p><strong>Estatus Actual:</strong> <span class="badge ${getStatusBadgeClassAdmin(sale.estatus)}">${sale.estatus ? sale.estatus.toUpperCase() : 'N/A'}</span></p>
            <h6 class="mt-3">Ítems:</h6>
            ${itemsHtml}
            <h5 class="text-end mt-2">Total Venta: <span class="fw-bold text-primary">$${sale.totalVenta.toFixed(2)}</span></h5>
        `;
        if (saleStatusSelect) saleStatusSelect.value = sale.estatus; // Pre-seleccionar el estatus actual
        saleDetailModal.show();
    } catch (error) {
        console.error("Error en populateSaleDetailModal:", error);
        saleDetailContent.innerHTML = `<p class="text-danger p-3">Error al cargar detalles: ${error.message}</p>`;
        if (!saleDetailModal._isShown) saleDetailModal.show(); // Mostrar modal aunque sea para ver el error
    }
}

async function handleSaleStatusFormSubmit(event) {
    event.preventDefault();
    const token = getToken();
    if (!isLoggedIn() || !getCurrentUser() || getCurrentUser().tipo_usuario !== 'admin') {
        showAlert('Acción no autorizada.', 'danger', 'sale-detail-alert-container');
        return;
    }
    
    const saleId = editSaleIdStatusInput.value;
    const newStatus = saleStatusSelect.value;

    if (!saleId || !newStatus) {
        showAlert('Error: ID de venta o nuevo estatus no especificado.', 'warning', 'sale-detail-alert-container');
        return;
    }

    if (saveSaleStatusBtn) {
        saveSaleStatusBtn.disabled = true;
        saveSaleStatusBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Actualizando...`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/sales/${saleId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ estatus: newStatus })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Error al actualizar el estatus de la venta.');
        }
        showAlert(result.message || 'Estatus de la venta actualizado exitosamente.', 'success', 'alert-container-admin-sales'); // Alerta global
        if (saleDetailModal) saleDetailModal.hide();
        loadAdminSales(adminSalesCurrentPage, currentSaleStatusFilter); // Recargar la tabla de ventas
    } catch (error) {
        showAlert(error.message, 'danger', 'sale-detail-alert-container'); // Alerta dentro del modal
    } finally {
        if (saveSaleStatusBtn) {
            saveSaleStatusBtn.disabled = false;
            saveSaleStatusBtn.textContent = 'Actualizar Estatus';
        }
    }
}

async function loadAdminSales(page = 1, estatus = '') {
    adminSalesCurrentPage = page;
    currentSaleStatusFilter = estatus;
    if (salesTableBody) salesTableBody.innerHTML = '<tr><td colspan="7" class="text-center"><div class="spinner-border text-primary mt-3" role="status"><span class="visually-hidden">Cargando ventas...</span></div></td></tr>';
    const salesData = await fetchAdminSales(adminSalesCurrentPage, currentSaleStatusFilter);
    renderAdminSales(salesData);
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    // console.log("admin-sales.js: DOMContentLoaded");
    updateAdminSalesNavbar(); // Actualiza el navbar

    const currentUser = getCurrentUser();
    if (isLoggedIn() && currentUser && currentUser.tipo_usuario === 'admin') {
        loadAdminSales(1, filterSaleStatusSelect ? filterSaleStatusSelect.value : ''); // Carga inicial

        if (saleStatusForm) {
            saleStatusForm.addEventListener('submit', handleSaleStatusFormSubmit);
        }
        if (filterSaleStatusSelect) {
            filterSaleStatusSelect.addEventListener('change', function() {
                loadAdminSales(1, this.value); // Reset a página 1 al cambiar filtro
            });
        }
        
        if (saleDetailModalElement) {
            saleDetailModalElement.addEventListener('hidden.bs.modal', () => {
                const alertContainer = document.getElementById('sale-detail-alert-container');
                if (alertContainer) alertContainer.innerHTML = ''; // Limpiar alertas del modal
                if (saleDetailContent) saleDetailContent.innerHTML = ''; // Limpiar contenido del modal
            });
        }
    } else {
        // Si no es admin, mostrar mensaje de acceso denegado
        if (salesTableBody) {
            salesTableBody.innerHTML = `<tr><td colspan="7" class="text-center p-5">
                <h3 class="text-danger">Acceso Denegado</h3>
                <p>Debes iniciar sesión como administrador para ver esta página.</p>
                <a href="index.html" class="btn btn-primary mt-3">Volver al Sitio</a>
            </td></tr>`;
        }
        if (paginationContainer) paginationContainer.innerHTML = '';
        if (filterSaleStatusSelect) filterSaleStatusSelect.disabled = true; // Deshabilitar filtros
    }
});