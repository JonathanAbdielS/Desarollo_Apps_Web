// public/js/admin-movies.js
import { getToken, getCurrentUser, isLoggedIn, logoutUser } from './auth.js';
import { API_BASE_URL } from './config.js';
import { showAlert } from './ui.js';

const moviesTableBody = document.getElementById('admin-movies-table-body');
const paginationContainer = document.getElementById('admin-movies-pagination-container');
const movieFormModalElement = document.getElementById('movieFormModal');
const movieFormModal = movieFormModalElement ? new bootstrap.Modal(movieFormModalElement) : null;
const movieForm = document.getElementById('movieForm');
const movieFormModalLabel = document.getElementById('movieFormModalLabel');
const editMovieIdInput = document.getElementById('editMovieId');
const openAddMovieModalBtn = document.getElementById('openAddMovieModalBtn');
const saveMovieBtn = document.getElementById('saveMovieBtn');

let adminCurrentPage = 1; 

function updateAdminNavbar() {
    const userSessionControls = document.getElementById('user-session-controls-admin-movies');
    if (!userSessionControls) {
        return;
    }

    if (isLoggedIn() && getCurrentUser() && getCurrentUser().tipo_usuario === 'admin') {
        const user = getCurrentUser();
        userSessionControls.innerHTML = `
            <span class="navbar-text text-white me-3">
                Admin: ${user.nombre.split(' ')[0]}
            </span>
            <button id="logoutButtonAdminMovies" class="btn btn-outline-light" type="button">Cerrar Sesión</button>
        `;
        const logoutButton = document.getElementById('logoutButtonAdminMovies');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                logoutUser();
                window.location.href = 'index.html';
            });
        }
    } else {
        userSessionControls.innerHTML = `<a href="index.html" class="btn btn-primary">Ir al Sitio</a>`;
    }
}

// --- CRUD de Películas ---
async function fetchAdminMovies(page = 1, limit = 10) { // Límite más pequeño para tablas de admin
    const token = getToken(); // Aunque GET /api/movies es público, lo incluimos por si se cambia la lógica
                              // o para consistencia si se añaden filtros que requieran auth.
    // if (!token) {
    //     showAlert('No autenticado.', 'danger', 'alert-container-admin-movies');
    //     return { movies: [], totalPages: 0, currentPage: 1 };
    // }

    try {
        const params = new URLSearchParams({
            page: page,
            limit: limit,
            sortBy: 'createdAt_desc' // Las más nuevas primero en la tabla de admin
        });
        // Podríamos añadir un input de búsqueda para admin aquí también si se desea
        // if (searchTerm) params.append('search', searchTerm);

        const response = await fetch(`${API_BASE_URL}/movies?${params.toString()}`);
        if (!response.ok) {
            const err = await response.json().catch(() => ({ message: "Error al cargar películas."}));
            throw new Error(err.message);
        }
        return await response.json();
    } catch (error) {
        console.error("Error en fetchAdminMovies:", error);
        showAlert(error.message, 'danger', 'alert-container-admin-movies');
        return { movies: [], totalPages: 0, currentPage: 1 }; // Objeto por defecto en error
    }
}

function renderAdminMovies(data) {
    if (!moviesTableBody) return;
    moviesTableBody.innerHTML = '';

    if (!data || !data.movies || data.movies.length === 0) {
        moviesTableBody.innerHTML = '<tr><td colspan="9" class="text-center">No hay películas para mostrar.</td></tr>';
        renderAdminMoviesPagination(0, 0); // Limpiar paginación
        return;
    }

    data.movies.forEach(movie => {
        const row = moviesTableBody.insertRow();
        row.innerHTML = `
            <td><img src="${movie.url_imagen || 'img/placeholder_movie.jpg'}" alt="${movie.titulo}" style="width: 60px; height: 90px; object-fit: cover;"></td>
            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${movie.titulo}">${movie.titulo}</td>
            <td>${movie.categoria}</td>
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${Array.isArray(movie.genero) ? movie.genero.join(', ') : movie.genero}">${Array.isArray(movie.genero) ? movie.genero.join(', ') : movie.genero}</td>
            <td>$${movie.precio_renta.toFixed(2)}</td>
            <td>$${movie.precio_compra.toFixed(2)}</td>
            <td>${movie.stock_renta}</td>
            <td>${movie.stock_compra}</td>
            <td>
                <button class="btn btn-sm btn-warning edit-movie-btn mb-1" data-movie-id="${movie._id}" title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16"><path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/><path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z"/></svg>
                </button>
                <button class="btn btn-sm btn-danger delete-movie-btn" data-movie-id="${movie._id}" title="Eliminar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash3-fill" viewBox="0 0 16 16"><path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/></svg>
                </button>
            </td>
        `;
    });
    renderAdminMoviesPagination(data.totalPages, data.currentPage);
    addEventListenersToAdminMovieButtons();
}

function renderAdminMoviesPagination(totalPages, page) {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    if (totalPages <= 1) return;

    const ul = document.createElement('ul');
    ul.className = 'pagination'; // Bootstrap class for pagination styling

    // Botón "Anterior"
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${page === 1 ? 'disabled' : ''}`;
    const prevLink = document.createElement('a');
    prevLink.className = 'page-link';
    prevLink.href = '#';
    prevLink.setAttribute('aria-label', 'Previous');
    prevLink.innerHTML = '<span aria-hidden="true">&laquo;</span>';
    if (page > 1) {
        prevLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadAdminMovies(page - 1);
        });
    }
    prevLi.appendChild(prevLink);
    ul.appendChild(prevLi);

    // Números de página
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === page ? 'active' : ''}`;
        const pageLink = document.createElement('a');
        pageLink.className = 'page-link';
        pageLink.href = '#';
        pageLink.textContent = i;
        if (i !== page) {
            pageLink.addEventListener('click', (e) => {
                e.preventDefault();
                loadAdminMovies(i);
            });
        }
        pageLi.appendChild(pageLink);
        ul.appendChild(pageLi);
    }

    // Botón "Siguiente"
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${page === totalPages ? 'disabled' : ''}`;
    const nextLink = document.createElement('a');
    nextLink.className = 'page-link';
    nextLink.href = '#';
    nextLink.setAttribute('aria-label', 'Next');
    nextLink.innerHTML = '<span aria-hidden="true">&raquo;</span>';
    if (page < totalPages) {
        nextLink.addEventListener('click', (e) => {
            e.preventDefault();
            loadAdminMovies(page + 1);
        });
    }
    nextLi.appendChild(nextLink);
    ul.appendChild(nextLi);

    paginationContainer.appendChild(ul);
}

function addEventListenersToAdminMovieButtons() {
    document.querySelectorAll('.edit-movie-btn').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true)); // Prevenir listeners duplicados
    });
    document.querySelectorAll('.edit-movie-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const movieId = this.dataset.movieId;
            await populateMovieFormForEdit(movieId);
        });
    });

    document.querySelectorAll('.delete-movie-btn').forEach(btn => {
        btn.replaceWith(btn.cloneNode(true)); // Prevenir listeners duplicados
    });
    document.querySelectorAll('.delete-movie-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const movieId = this.dataset.movieId;
            if (confirm('¿Estás seguro de que quieres eliminar esta película? Esta acción no se puede deshacer.')) {
                await deleteMovie(movieId);
            }
        });
    });
}

async function populateMovieFormForEdit(movieId) {
    try {
        const response = await fetch(`${API_BASE_URL}/movies/${movieId}`);
        if (!response.ok) throw new Error('No se pudo cargar la película para editar.');
        const movie = await response.json();

        movieFormModalLabel.textContent = 'Editar Película';
        editMovieIdInput.value = movie._id;
        document.getElementById('movieTitulo').value = movie.titulo || '';
        document.getElementById('movieFechaLanzamiento').value = movie.fecha_lanzamiento || '';
        document.getElementById('movieDescripcion').value = movie.descripcion || '';
        document.getElementById('movieUrlImagen').value = movie.url_imagen || '';
        document.getElementById('movieCategoria').value = movie.categoria || '';
        document.getElementById('movieGenero').value = Array.isArray(movie.genero) ? movie.genero.join(', ') : (movie.genero || '');
        document.getElementById('moviePrecioRenta').value = movie.precio_renta !== undefined ? movie.precio_renta : '';
        document.getElementById('moviePrecioCompra').value = movie.precio_compra !== undefined ? movie.precio_compra : '';
        document.getElementById('movieStockRenta').value = movie.stock_renta !== undefined ? movie.stock_renta : 0;
        document.getElementById('movieStockCompra').value = movie.stock_compra !== undefined ? movie.stock_compra : 0;
        document.getElementById('movieCalificacion').value = movie.calificacion !== undefined ? movie.calificacion : 0;
        document.getElementById('moviePopularidad').value = movie.popularidad !== undefined ? movie.popularidad : 0;
        
        if(movieFormModal) movieFormModal.show();
    } catch (error) {
        showAlert(error.message, 'danger', 'alert-container-admin-movies');
    }
}

async function handleMovieFormSubmit(event) {
    event.preventDefault();
    const token = getToken();
    if (!isLoggedIn() || !getCurrentUser() || getCurrentUser().tipo_usuario !== 'admin') {
        showAlert('Acción no autorizada.', 'danger', 'movie-form-alert-container');
        return;
    }

    const movieId = editMovieIdInput.value;
    const movieData = {
        titulo: document.getElementById('movieTitulo').value.trim(),
        fecha_lanzamiento: document.getElementById('movieFechaLanzamiento').value.trim(),
        descripcion: document.getElementById('movieDescripcion').value.trim(),
        url_imagen: document.getElementById('movieUrlImagen').value.trim(),
        categoria: document.getElementById('movieCategoria').value.trim(),
        genero: document.getElementById('movieGenero').value.split(',').map(g => g.trim()).filter(g => g.length > 0),
        precio_renta: parseFloat(document.getElementById('moviePrecioRenta').value),
        precio_compra: parseFloat(document.getElementById('moviePrecioCompra').value),
        stock_renta: parseInt(document.getElementById('movieStockRenta').value, 10),
        stock_compra: parseInt(document.getElementById('movieStockCompra').value, 10),
        calificacion: parseFloat(document.getElementById('movieCalificacion').value) || 0,
        popularidad: parseInt(document.getElementById('moviePopularidad').value, 10) || 0,
    };

    if (!movieData.titulo || !movieData.descripcion || !movieData.url_imagen || !movieData.categoria || movieData.genero.length === 0 || isNaN(movieData.precio_renta) || isNaN(movieData.precio_compra) || isNaN(movieData.stock_renta) || isNaN(movieData.stock_compra)) {
        showAlert('Por favor, completa todos los campos obligatorios (*). Género no puede estar vacío.', 'warning', 'movie-form-alert-container');
        return;
    }

    const method = movieId ? 'PUT' : 'POST';
    const url = movieId ? `${API_BASE_URL}/movies/${movieId}` : `${API_BASE_URL}/movies`;

    if (saveMovieBtn) {
        saveMovieBtn.disabled = true;
        saveMovieBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...`;
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(movieData)
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || `Error al ${movieId ? 'actualizar' : 'crear'} la película.`);
        }
        showAlert(`Película ${movieId ? 'actualizada' : 'creada'} exitosamente.`, 'success', 'alert-container-admin-movies');
        if (movieFormModal) movieFormModal.hide();
        loadAdminMovies(movieId ? adminCurrentPage : 1);
    } catch (error) {
        showAlert(error.message, 'danger', 'movie-form-alert-container');
    } finally {
        if (saveMovieBtn) {
            saveMovieBtn.disabled = false;
            saveMovieBtn.textContent = 'Guardar Película';
        }
    }
}

async function deleteMovie(movieId) {
    const token = getToken();
    if (!isLoggedIn() || !getCurrentUser() || getCurrentUser().tipo_usuario !== 'admin') {
        showAlert('Acción no autorizada.', 'danger', 'alert-container-admin-movies');
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/movies/${movieId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Error al eliminar la película.');
        }
        showAlert('Película eliminada exitosamente.', 'success', 'alert-container-admin-movies');
        loadAdminMovies(adminCurrentPage); // Recargar la página actual
    } catch (error) {
        showAlert(error.message, 'danger', 'alert-container-admin-movies');
    }
}

async function loadAdminMovies(page = 1) {
    adminCurrentPage = page;
    if (moviesTableBody) {
        moviesTableBody.innerHTML = '<tr><td colspan="9" class="text-center"><div class="spinner-border text-primary mt-3" role="status"><span class="visually-hidden">Cargando películas...</span></div></td></tr>';
    }
    const moviesData = await fetchAdminMovies(adminCurrentPage);
    renderAdminMovies(moviesData);
}

// --- Inicialización ---
document.addEventListener('DOMContentLoaded', () => {
    // console.log("admin-movies.js: DOMContentLoaded");
    updateAdminNavbar();

    const currentUser = getCurrentUser();
    if (isLoggedIn() && currentUser && currentUser.tipo_usuario === 'admin') {
        loadAdminMovies();

        if (movieForm) {
            movieForm.addEventListener('submit', handleMovieFormSubmit);
        }

        if (openAddMovieModalBtn) {
            openAddMovieModalBtn.addEventListener('click', () => {
                movieFormModalLabel.textContent = 'Añadir Nueva Película';
                editMovieIdInput.value = ''; // Asegurar que no haya ID de edición
                if (movieForm) movieForm.reset(); // Limpiar el formulario
                const alertContainer = document.getElementById('movie-form-alert-container');
                if(alertContainer) alertContainer.innerHTML = ''; // Limpiar alertas previas del modal
                // La apertura del modal se maneja por data-bs-toggle en el HTML
            });
        }
        
        if (movieFormModalElement) {
             movieFormModalElement.addEventListener('hidden.bs.modal', () => {
                // Limpiar alertas del modal al cerrarse, pero no resetear el form
                // si se cerró después de una edición (ya que podría quererse ver los datos)
                // El reset se hace al abrir para "Añadir Nueva".
                const alertContainer = document.getElementById('movie-form-alert-container');
                if(alertContainer) alertContainer.innerHTML = '';
            });
        }

    } else {
        // Si no es admin, mostrar mensaje y no cargar datos.
        // updateAdminNavbar ya maneja la redirección o mensaje visual.
        if (moviesTableBody) {
            moviesTableBody.innerHTML = `<tr><td colspan="9" class="text-center p-5">
                <h3 class="text-danger">Acceso Denegado</h3>
                <p>Debes iniciar sesión como administrador para ver esta página.</p>
                <a href="index.html" class="btn btn-primary mt-3">Volver al Inicio</a>
            </td></tr>`;
        }
        if (paginationContainer) paginationContainer.innerHTML = '';
        const addButtonContainer = document.querySelector('.d-flex.justify-content-between.align-items-center.mb-3 h2');
        if(addButtonContainer && openAddMovieModalBtn) { // Ocultar botón de añadir si no es admin
           openAddMovieModalBtn.style.display = 'none';
           if(addButtonContainer.parentElement.querySelector('h2')) {
             addButtonContainer.parentElement.querySelector('h2').nextElementSibling.remove(); // Remover botón
           }
        }
    }
});