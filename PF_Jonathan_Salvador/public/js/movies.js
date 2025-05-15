// public/js/movies.js
import { showAlert } from './ui.js';
import { getToken } from './auth.js';
import { addItemToCartAndUpdateCount } from './cart.js';
import { API_BASE_URL } from './config.js'; // Asegúrate de tener config.js

const movieListContainer = document.getElementById('movie-list-container');
const paginationContainer = document.getElementById('pagination-container');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');

const filterCategorySelect = document.getElementById('filterCategory');
const filterGenreSelect = document.getElementById('filterGenre');
const filterSortBySelect = document.getElementById('filterSortBy');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');

let currentPage = 1;
let currentSearchTerm = '';
let currentCategoryFilter = '';
let currentGenreFilter = '';
let currentSortByFilter = 'createdAt_desc';

let allFetchedMoviesForFilters = [];

async function fetchUniqueFilterValues() {
    try {
        const response = await fetch(`${API_BASE_URL}/movies?limit=1000`); 
        if (!response.ok) return { categories: [], genres: [] };
        const data = await response.json();
        allFetchedMoviesForFilters = data.movies || [];

        const categories = [...new Set(allFetchedMoviesForFilters.map(movie => movie.categoria).filter(Boolean))].sort();
        const genres = [...new Set(allFetchedMoviesForFilters.flatMap(movie => movie.genero).filter(Boolean))].sort();
        return { categories, genres };
    } catch (error) {
        console.error("Error fetching filter values:", error);
        return { categories: [], genres: [] };
    }
}

function populateFilterDropdowns(categories, genres) {
    if (filterCategorySelect) {
        filterCategorySelect.innerHTML = '<option selected value="">Todas las Categorías</option>'; // Reset
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            filterCategorySelect.appendChild(option);
        });
    }
    if (filterGenreSelect) {
        filterGenreSelect.innerHTML = '<option selected value="">Todos los Géneros</option>'; // Reset
        genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre;
            option.textContent = genre;
            filterGenreSelect.appendChild(option);
        });
    }
}

export async function fetchMovies(page = 1, searchTerm = '', category = '', genre = '', sortBy = 'createdAt_desc') {
    try {
        const params = new URLSearchParams();
        params.append('page', String(page));
        params.append('limit', '12');
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
        return data;
    } catch (error) {
        console.error('Error fetching movies:', error);
        showAlert(error.message || 'No se pudieron cargar las películas.', 'danger');
        return { movies: [], currentPage: 1, totalPages: 1, totalMovies: 0 };
    }
}

export function renderMovies(moviesData) {
    if (!movieListContainer) {
        return;
    }
    movieListContainer.innerHTML = '';

    if (!moviesData || !moviesData.movies || moviesData.movies.length === 0) {
        movieListContainer.innerHTML = '<p class="text-center col-12">No se encontraron películas que coincidan con tu búsqueda o filtros.</p>';
        renderPagination(0, 0);
        return;
    }

    moviesData.movies.forEach(movie => {
        const cardColumnDiv = document.createElement('div');
        cardColumnDiv.className = 'col-6 col-md-4 col-lg-3 mb-4 movie-card-wrapper';

        const detailLink = document.createElement('a');
        detailLink.href = `movie_detail.html?id=${movie._id}`;
        detailLink.className = 'text-decoration-none text-dark d-block h-100';

        const cardDiv = document.createElement('div');
        cardDiv.className = 'card h-100 movie-card';

        cardDiv.innerHTML = `
            <img src="${movie.url_imagen || 'img/placeholder_movie.jpg'}" class="card-img-top" alt="${movie.titulo}" style="height: 350px; object-fit: cover;">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title movie-card-title">${movie.titulo}</h5>
                <p class="card-text small text-muted flex-grow-1 movie-card-description">${movie.descripcion.substring(0, 80)}${movie.descripcion.length > 80 ? '...' : ''}</p>
                <div class="mt-auto movie-prices">
                    <p class="card-text mb-0 d-block"><small><strong>Renta: $${movie.precio_renta.toFixed(2)}</strong> (Disp: ${movie.stock_renta})</small></p>
                    <p class="card-text mb-0 d-block"><small><strong>Compra: $${movie.precio_compra.toFixed(2)}</strong> (Disp: ${movie.stock_compra})</small></p>
                </div>
            </div>
        `;
        detailLink.appendChild(cardDiv);
        cardColumnDiv.appendChild(detailLink);

        const cardFooter = document.createElement('div');
        cardFooter.className = 'card-footer bg-transparent border-top-0 text-center p-2 movie-card-actions';
        cardFooter.innerHTML = `
            <button class="btn btn-sm btn-outline-primary add-to-cart-btn mb-1 w-100 ${movie.stock_renta <= 0 ? 'disabled' : ''}" 
                    data-movie-id="${movie._id}" data-tipo="renta" ${movie.stock_renta <= 0 ? 'disabled' : ''}>
                Añadir Renta
            </button>
            <button class="btn btn-sm btn-primary add-to-cart-btn w-100 ${movie.stock_compra <= 0 ? 'disabled' : ''}" 
                    data-movie-id="${movie._id}" data-tipo="compra" ${movie.stock_compra <= 0 ? 'disabled' : ''}>
                Añadir Compra
            </button>
        `;
        cardDiv.appendChild(cardFooter);
        movieListContainer.appendChild(cardColumnDiv);
    });

    renderPagination(moviesData.totalPages, moviesData.currentPage);
    addEventListenersToCartButtons();
}

function renderPagination(totalPages, page) {
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
            loadMovies(page - 1, currentSearchTerm, currentCategoryFilter, currentGenreFilter, currentSortByFilter);
        });
    }
    prevLi.appendChild(prevA);
    ul.appendChild(prevLi);

    // Números de página
    const MAX_PAGES_TO_SHOW = 5;
    let startPage = Math.max(1, page - Math.floor(MAX_PAGES_TO_SHOW / 2));
    let endPage = Math.min(totalPages, startPage + MAX_PAGES_TO_SHOW - 1);
    if (endPage - startPage + 1 < MAX_PAGES_TO_SHOW && startPage > 1) {
        startPage = Math.max(1, endPage - MAX_PAGES_TO_SHOW + 1);
    }
     if (endPage - startPage + 1 < MAX_PAGES_TO_SHOW) {
        endPage = Math.min(totalPages, startPage + MAX_PAGES_TO_SHOW - 1);
    }

    if (startPage > 1) {
        const firstLi = document.createElement('li'); firstLi.className = 'page-item';
        const firstA = document.createElement('a'); firstA.className = 'page-link'; firstA.href = '#'; firstA.textContent = '1';
        firstA.addEventListener('click', (e) => { e.preventDefault(); loadMovies(1, currentSearchTerm, currentCategoryFilter, currentGenreFilter, currentSortByFilter); });
        firstLi.appendChild(firstA); ul.appendChild(firstLi);
        if (startPage > 2) {
            const dotsLi = document.createElement('li'); dotsLi.className = 'page-item disabled';
            dotsLi.innerHTML = '<span class="page-link">...</span>'; ul.appendChild(dotsLi);
        }
    }
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li'); li.className = `page-item ${i === page ? 'active' : ''}`;
        const a = document.createElement('a'); a.className = 'page-link'; a.href = '#'; a.textContent = i;
        if (i !== page) {
            a.addEventListener('click', (e) => { e.preventDefault(); loadMovies(i, currentSearchTerm, currentCategoryFilter, currentGenreFilter, currentSortByFilter); });
        }
        li.appendChild(a); ul.appendChild(li);
    }
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dotsLi = document.createElement('li'); dotsLi.className = 'page-item disabled';
            dotsLi.innerHTML = '<span class="page-link">...</span>'; ul.appendChild(dotsLi);
        }
        const lastLi = document.createElement('li'); lastLi.className = 'page-item';
        const lastA = document.createElement('a'); lastA.className = 'page-link'; lastA.href = '#'; lastA.textContent = totalPages;
        lastA.addEventListener('click', (e) => { e.preventDefault(); loadMovies(totalPages, currentSearchTerm, currentCategoryFilter, currentGenreFilter, currentSortByFilter); });
        lastLi.appendChild(lastA); ul.appendChild(lastLi);
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
            loadMovies(page + 1, currentSearchTerm, currentCategoryFilter, currentGenreFilter, currentSortByFilter);
        });
    }
    nextLi.appendChild(nextA);
    ul.appendChild(nextLi);
    paginationContainer.appendChild(ul);
}

function addEventListenersToCartButtons() {
    const cartButtons = document.querySelectorAll('.add-to-cart-btn');
    cartButtons.forEach(button => {
        button.replaceWith(button.cloneNode(true));
    });
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        if (button.classList.contains('disabled')) return;
        button.addEventListener('click', async function() {
            if (!getToken()) {
                showAlert('Debes iniciar sesión para agregar películas al carrito.', 'warning');
                const loginModalElement = document.getElementById('loginModal'); // Asumiendo ID del modal de login en index.html
                if (loginModalElement) bootstrap.Modal.getOrCreateInstance(loginModalElement).show();
                return;
            }
            const movieId = this.dataset.movieId;
            const tipo = this.dataset.tipo;
            const quantity = 1;
            this.disabled = true;
            const originalButtonText = this.innerHTML;
            this.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`;
            try {
                await addItemToCartAndUpdateCount({ movieId, quantity, tipo });
                const movieTitleElement = this.closest('.movie-card-wrapper').querySelector('.movie-card-title');
                const movieTitle = movieTitleElement ? movieTitleElement.textContent : 'Película';
                showAlert(`"${movieTitle}" (${tipo}) añadido al carrito!`, 'success');
                loadMovies(currentPage, currentSearchTerm, currentCategoryFilter, currentGenreFilter, currentSortByFilter);
            } catch (error) {
                showAlert(error.message || 'No se pudo añadir la película al carrito.', 'danger');
                this.disabled = false;
                this.innerHTML = originalButtonText;
            }
        });
    });
}


export async function loadMovies(page = 1, searchTerm = '', category = '', genre = '', sortBy = 'createdAt_desc') {
    currentPage = page;
    currentSearchTerm = searchTerm;
    currentCategoryFilter = category;
    currentGenreFilter = genre;
    currentSortByFilter = sortBy;

    if (movieListContainer) {
        movieListContainer.innerHTML = '<div class="col-12 text-center p-5"><div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"><span class="visually-hidden">Cargando películas...</span></div></div>';
    }
    
    const moviesData = await fetchMovies(currentPage, currentSearchTerm, currentCategoryFilter, currentGenreFilter, currentSortByFilter);
    renderMovies(moviesData);
}

if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const searchTerm = searchInput ? searchInput.value.trim() : '';
        loadMovies(1, searchTerm, currentCategoryFilter, currentGenreFilter, currentSortByFilter);
    });
}

if (filterCategorySelect) {
    filterCategorySelect.addEventListener('change', (e) => {
        loadMovies(1, currentSearchTerm, e.target.value, currentGenreFilter, currentSortByFilter);
    });
}

if (filterGenreSelect) {
    filterGenreSelect.addEventListener('change', (e) => {
        loadMovies(1, currentSearchTerm, currentCategoryFilter, e.target.value, currentSortByFilter);
    });
}

if (filterSortBySelect) {
    filterSortBySelect.addEventListener('change', (e) => {
        loadMovies(1, currentSearchTerm, currentCategoryFilter, currentGenreFilter, e.target.value);
    });
}

if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (filterCategorySelect) filterCategorySelect.value = '';
        if (filterGenreSelect) filterGenreSelect.value = '';
        if (filterSortBySelect) filterSortBySelect.value = 'createdAt_desc'; 
        loadMovies(1, '', '', '', 'createdAt_desc');
    });
}


async function initializeMovieFiltersAndList() {
    const filterValues = await fetchUniqueFilterValues();
    populateFilterDropdowns(filterValues.categories, filterValues.genres);
}
export async function initMoviePage() {
    if (document.getElementById('filters-container')) {
        const filterValues = await fetchUniqueFilterValues();
        populateFilterDropdowns(filterValues.categories, filterValues.genres);
        
    }
}