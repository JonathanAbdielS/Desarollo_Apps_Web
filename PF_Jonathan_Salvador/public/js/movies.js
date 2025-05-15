// public/js/movies.js
import { showAlert } from './ui.js';
import { getToken } from './auth.js';
import { addItemToCartAndUpdateCount } from './cart.js';

const API_BASE_URL = 'http://localhost:3000/api';
const movieListContainer = document.getElementById('movie-list-container');
const paginationContainer = document.getElementById('pagination-container');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
// Elementos para filtros (si los añades en el HTML)
// const filterCategoryElement = document.getElementById('filterCategory');
// const filterGenreElement = document.getElementById('filterGenre');
// const filterSortByElement = document.getElementById('filterSortBy');


let currentPage = 1;
let currentSearchTerm = '';
let currentCategory = '';
let currentGenre = '';
let currentSortBy = 'createdAt_desc'; // Default sort

export async function fetchMovies(page = 1, searchTerm = '', category = '', genre = '', sortBy = 'createdAt_desc') {
    try {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', 12); // Ajusta el límite de películas por página según necesites

        if (searchTerm) params.append('search', searchTerm);
        if (category) params.append('categoria', category);
        if (genre) params.append('genero', genre);
        if (sortBy) params.append('sortBy', sortBy);

        const response = await fetch(`${API_BASE_URL}/movies?${params.toString()}`);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Error ${response.status} al obtener las películas.`);
        }
        const data = await response.json();
        return data; // Esperado: { movies: [...], currentPage, totalPages, totalMovies }
    } catch (error) {
        console.error('Error fetching movies:', error);
        showAlert(error.message || 'No se pudieron cargar las películas.', 'danger');
        return { movies: [], currentPage: 1, totalPages: 1, totalMovies: 0 }; // Objeto por defecto en caso de error
    }
}

export function renderMovies(moviesData) {
    // ... (código existente para limpiar movieListContainer y manejar moviesData vacío) ...
    if (!movieListContainer) {
        return;
    }
    movieListContainer.innerHTML = '';

    if (!moviesData || !moviesData.movies || moviesData.movies.length === 0) {
        movieListContainer.innerHTML = '<p class="text-center col-12">No se encontraron películas que coincidan con tu búsqueda.</p>';
        renderPagination(0, 0);
        return;
    }

    moviesData.movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'col-6 col-md-4 col-lg-3 mb-4 movie-card-wrapper'; // Clase para el wrapper del enlace

        // Enlace que envuelve toda la tarjeta (o al menos la imagen y el título)
        const link = document.createElement('a');
        link.href = `movie_detail.html?id=${movie._id}`; // Enlace a la página de detalle
        link.className = 'text-decoration-none text-dark'; // Estilos para que no parezca un enlace feo

        link.innerHTML = `
            <div class="card h-100 movie-card">
                <img src="${movie.url_imagen || 'img/placeholder_movie.jpg'}" class="card-img-top" alt="${movie.titulo}" style="height: 350px; object-fit: cover;">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title movie-card-title">${movie.titulo}</h5>
                    <p class="card-text small text-muted flex-grow-1 movie-card-description">${movie.descripcion.substring(0, 80)}${movie.descripcion.length > 80 ? '...' : ''}</p>
                    <p class="card-text mb-1"><small class="text-muted">Género: ${Array.isArray(movie.genero) ? movie.genero.join(', ') : movie.genero}</small></p>
                    </div>
            </div>
        `;
        card.appendChild(link); // Añadir el enlace al div contenedor de la columna

        // Crear el footer con los botones por separado para que no estén dentro del enlace de detalle
        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer bg-transparent border-top-0 text-center p-2 movie-card-actions';
        cardFooter.innerHTML = `
            <div class="mb-2"> <p class="card-text mb-0 d-block"><small><strong>Renta: $${movie.precio_renta.toFixed(2)}</strong> (Disp: ${movie.stock_renta})</small></p>
                <p class="card-text mb-0 d-block"><small><strong>Compra: $${movie.precio_compra.toFixed(2)}</strong> (Disp: ${movie.stock_compra})</small></p>
            </div>
            <button class="btn btn-sm btn-outline-primary add-to-cart-btn mb-1 w-100 ${movie.stock_renta <= 0 ? 'disabled' : ''}" 
                    data-movie-id="${movie._id}" data-tipo="renta" ${movie.stock_renta <= 0 ? 'disabled' : ''}>
                Añadir Renta
            </button>
            <button class="btn btn-sm btn-primary add-to-cart-btn w-100 ${movie.stock_compra <= 0 ? 'disabled' : ''}" 
                    data-movie-id="${movie._id}" data-tipo="compra" ${movie.stock_compra <= 0 ? 'disabled' : ''}>
                Añadir Compra
            </button>
        `;
        // Encontrar el elemento .card dentro del 'link' y añadirle el footer.
        // Esto es un poco hacky, idealmente la estructura de la card se crea una vez.
        const innerCard = link.querySelector('.movie-card');
        if(innerCard) { // Asegurarse que innerCard existe
          innerCard.appendChild(cardFooter);
        }


        movieListContainer.appendChild(card);
    });

    renderPagination(moviesData.totalPages, moviesData.currentPage);
    addEventListenersToCartButtons(); // Esta función ya existe y debería seguir funcionando
}

function renderPagination(totalPages, page) { // 'page' es la currentPage
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    const ul = document.createElement('ul');
    ul.className = 'pagination justify-content-center';

    // Botón Anterior
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${page === 1 ? 'disabled' : ''}`;
    const prevA = document.createElement('a');
    prevA.className = 'page-link';
    prevA.href = '#';
    prevA.setAttribute('aria-label', 'Previous');
    prevA.innerHTML = '<span aria-hidden="true">&laquo;</span>';
    if (page > 1) {
        prevA.addEventListener('click', (e) => {
            e.preventDefault();
            loadMovies(page - 1, currentSearchTerm, currentCategory, currentGenre, currentSortBy);
        });
    }
    prevLi.appendChild(prevA);
    ul.appendChild(prevLi);

    // Números de página (lógica mejorada para mostrar un rango)
    const MAX_PAGES_TO_SHOW = 5;
    let startPage = Math.max(1, page - Math.floor(MAX_PAGES_TO_SHOW / 2));
    let endPage = Math.min(totalPages, startPage + MAX_PAGES_TO_SHOW - 1);

    if (endPage - startPage + 1 < MAX_PAGES_TO_SHOW) {
        startPage = Math.max(1, endPage - MAX_PAGES_TO_SHOW + 1);
    }
    
    if (startPage > 1) {
        const firstLi = document.createElement('li');
        firstLi.className = 'page-item';
        const firstA = document.createElement('a');
        firstA.className = 'page-link';
        firstA.href = '#';
        firstA.textContent = '1';
        firstA.addEventListener('click', (e) => { e.preventDefault(); loadMovies(1, currentSearchTerm, currentCategory, currentGenre, currentSortBy); });
        firstLi.appendChild(firstA);
        ul.appendChild(firstLi);
        if (startPage > 2) {
            const dotsLi = document.createElement('li');
            dotsLi.className = 'page-item disabled';
            dotsLi.innerHTML = '<span class="page-link">...</span>';
            ul.appendChild(dotsLi);
        }
    }


    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === page ? 'active' : ''}`;
        const a = document.createElement('a');
        a.className = 'page-link';
        a.href = '#';
        a.textContent = i;
        if (i !== page) {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                loadMovies(i, currentSearchTerm, currentCategory, currentGenre, currentSortBy);
            });
        }
        li.appendChild(a);
        ul.appendChild(li);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dotsLi = document.createElement('li');
            dotsLi.className = 'page-item disabled';
            dotsLi.innerHTML = '<span class="page-link">...</span>';
            ul.appendChild(dotsLi);
        }
        const lastLi = document.createElement('li');
        lastLi.className = 'page-item';
        const lastA = document.createElement('a');
        lastA.className = 'page-link';
        lastA.href = '#';
        lastA.textContent = totalPages;
        lastA.addEventListener('click', (e) => { e.preventDefault(); loadMovies(totalPages, currentSearchTerm, currentCategory, currentGenre, currentSortBy); });
        lastLi.appendChild(lastA);
        ul.appendChild(lastLi);
    }

    // Botón Siguiente
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${page === totalPages ? 'disabled' : ''}`;
    const nextA = document.createElement('a');
    nextA.className = 'page-link';
    nextA.href = '#';
    nextA.setAttribute('aria-label', 'Next');
    nextA.innerHTML = '<span aria-hidden="true">&raquo;</span>';
    if (page < totalPages) {
        nextA.addEventListener('click', (e) => {
            e.preventDefault();
            loadMovies(page + 1, currentSearchTerm, currentCategory, currentGenre, currentSortBy);
        });
    }
    nextLi.appendChild(nextA);
    ul.appendChild(nextLi);

    paginationContainer.appendChild(ul);
}


function addEventListenersToCartButtons() {
    const cartButtons = document.querySelectorAll('.add-to-cart-btn');
    cartButtons.forEach(button => {
        // Remover listener previo para evitar duplicados si se llama renderMovies múltiples veces
        button.replaceWith(button.cloneNode(true));
    });
    // Volver a seleccionar después de clonar
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        if (button.classList.contains('disabled')) return; // No añadir listener a botones deshabilitados

        button.addEventListener('click', async function() {
            if (!getToken()) {
                showAlert('Debes iniciar sesión para agregar películas al carrito.', 'warning');
                // Forzar apertura del modal de login de Bootstrap
                const loginModalElement = document.getElementById('loginModal');
                if (loginModalElement) {
                    const loginModal = bootstrap.Modal.getOrCreateInstance(loginModalElement);
                    loginModal.show();
                }
                return;
            }

            const movieId = this.dataset.movieId;
            const tipo = this.dataset.tipo;
            const quantity = 1; // Por defecto, agregar 1

            // Deshabilitar botón temporalmente para evitar múltiples clics
            this.disabled = true;
            const originalButtonText = this.innerHTML;
            this.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`;


            try {
                await addItemToCartAndUpdateCount({ movieId, quantity, tipo });
                const movieTitleElement = this.closest('.card').querySelector('.card-title');
                const movieTitle = movieTitleElement ? movieTitleElement.textContent : 'Película';
                showAlert(`"${movieTitle}" (${tipo}) añadido al carrito!`, 'success');
            } catch (error) {
                console.error('Error al añadir al carrito:', error);
                showAlert(error.message || 'No se pudo añadir la película al carrito.', 'danger');
            } finally {
                // Rehabilitar botón y restaurar texto
                this.disabled = false;
                this.innerHTML = originalButtonText;
                // Actualizar la tarjeta de la película para reflejar el nuevo stock si es necesario (o recargar todas las películas)
                 loadMovies(currentPage, currentSearchTerm, currentCategory, currentGenre, currentSortBy);
            }
        });
    });
}

export async function loadMovies(page = 1, searchTerm = '', category = '', genre = '', sortBy = 'createdAt_desc') {
    currentPage = page;
    currentSearchTerm = searchTerm;
    currentCategory = category;
    currentGenre = genre;
    currentSortBy = sortBy;

    if (movieListContainer) { // Solo si estamos en una página que muestra la lista de películas
        movieListContainer.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando películas...</span></div></div>'; // Indicador de carga
    }
    
    const moviesData = await fetchMovies(currentPage, currentSearchTerm, currentCategory, currentGenre, currentSortBy);
    renderMovies(moviesData);
}

// --- Event Listeners para filtros y búsqueda ---
if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchTerm = searchInput.value.trim();
        loadMovies(1, searchTerm, currentCategory, currentGenre, currentSortBy); // Reset a página 1 en nueva búsqueda
    });
}

// Ejemplo si tuvieras selects para filtros (debes añadirlos al HTML)
// if (filterCategoryElement) {
//     filterCategoryElement.addEventListener('change', (e) => {
//         currentCategory = e.target.value;
//         loadMovies(1, currentSearchTerm, currentCategory, currentGenre, currentSortBy);
//     });
// }
// if (filterGenreElement) {
//     filterGenreElement.addEventListener('change', (e) => {
//         currentGenre = e.target.value;
//         loadMovies(1, currentSearchTerm, currentCategory, currentGenre, currentSortBy);
//     });
// }
// if (filterSortByElement) {
//     filterSortByElement.addEventListener('change', (e) => {
//         currentSortBy = e.target.value;
//         loadMovies(1, currentSearchTerm, currentCategory, currentGenre, currentSortBy);
//     });
// }

// Podrías querer cargar las películas inicialmente si el script movies.js se carga
// en una página que siempre debe mostrar películas, pero esto ya se hace en main.js
// loadMovies(); // No llamar aquí directamente, main.js lo controla.