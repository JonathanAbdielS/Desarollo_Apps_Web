// src/controllers/movieController.js
const Movie = require('../models/movie');

// @desc    Crear una nueva película
// @route   POST /api/movies
// @access  Private (Admin)
const createMovie = async (req, res) => {
    const {
        titulo,
        descripcion,
        fecha_lanzamiento,
        categoria,
        genero,
        calificacion,
        precio_renta,
        precio_compra,
        url_imagen,
        stock_renta,
        stock_compra,
        popularidad
    } = req.body;

    try {
        // Validar campos obligatorios (Mongoose también lo hará, pero una verificación temprana es buena)
        if (!titulo || !descripcion || !fecha_lanzamiento || !categoria || !genero || !precio_renta || !precio_compra || !url_imagen || stock_renta === undefined || stock_compra === undefined) {
            return res.status(400).json({ message: 'Por favor, complete todos los campos obligatorios para la película.' });
        }

        const movie = new Movie({
            titulo,
            descripcion,
            fecha_lanzamiento,
            categoria,
            genero,
            calificacion,
            precio_renta,
            precio_compra,
            url_imagen,
            stock_renta,
            stock_compra,
            popularidad
        });

        const createdMovie = await movie.save();
        res.status(201).json(createdMovie);
    } catch (error) {
        console.error("Error en createMovie:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        res.status(500).json({ message: 'Error del servidor al crear la película.' });
    }
};

// @desc    Obtener todas las películas (con filtros y paginación opcionales)
// @route   GET /api/movies
// @access  Public
const getAllMovies = async (req, res) => {
    const { search, categoria, genero, sortBy, page = 1, limit = 12 } = req.query; // popularidad se usará en sortBy

    try {
        let query = {};

        if (search) {
            // Búsqueda por título o descripción (usando el índice de texto)
            query.$text = { $search: search };
        }
        if (categoria) {
            query.categoria = categoria; // Filtro exacto por categoría
        }
        if (genero) {
            // Si el género en la BD es un array y queremos buscar películas que tengan ESE género
            query.genero = { $in: [genero] }; // Asegura que coincida si es un array
        }

        let sortOptions = {};
        if (sortBy) {
            if (sortBy === 'popularidad_desc') sortOptions.popularidad = -1;
            if (sortBy === 'popularidad_asc') sortOptions.popularidad = 1;
            if (sortBy === 'precio_renta_asc') sortOptions.precio_renta = 1;
            if (sortBy === 'precio_renta_desc') sortOptions.precio_renta = -1;
            if (sortBy === 'precio_compra_asc') sortOptions.precio_compra = 1;
            if (sortBy === 'precio_compra_desc') sortOptions.precio_compra = -1;
            if (sortBy === 'titulo_asc') sortOptions.titulo = 1;
            if (sortBy === 'titulo_desc') sortOptions.titulo = -1;
            if (sortBy === 'fecha_lanzamiento_desc') sortOptions.fecha_lanzamiento = -1; // Asumiendo que quieres las más nuevas primero
            if (sortBy === 'fecha_lanzamiento_asc') sortOptions.fecha_lanzamiento = 1;

        } else {
            sortOptions.createdAt = -1; // Por defecto, las más nuevas primero
        }

        const count = await Movie.countDocuments(query);
        const movies = await Movie.find(query)
            .sort(sortOptions)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        res.json({
            movies,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalMovies: count
        });
    } catch (error) {
        console.error("Error en getAllMovies:", error);
        res.status(500).json({ message: 'Error del servidor al obtener las películas.' });
    }
};

// @desc    Obtener una película por su ID
// @route   GET /api/movies/:id
// @access  Public
const getMovieById = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (movie) {
            res.json(movie);
        } else {
            res.status(404).json({ message: 'Película no encontrada.' });
        }
    } catch (error) {
        console.error("Error en getMovieById:", error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Película no encontrada (ID mal formado).' });
        }
        res.status(500).json({ message: 'Error del servidor al obtener la película.' });
    }
};

// @desc    Actualizar una película
// @route   PUT /api/movies/:id
// @access  Private (Admin)
const updateMovie = async (req, res) => {
    const {
        titulo,
        descripcion,
        fecha_lanzamiento,
        categoria,
        genero,
        calificacion,
        precio_renta,
        precio_compra,
        url_imagen,
        stock_renta,
        stock_compra,
        popularidad
    } = req.body;

    try {
        const movie = await Movie.findById(req.params.id);

        if (movie) {
            movie.titulo = titulo || movie.titulo;
            movie.descripcion = descripcion || movie.descripcion;
            movie.fecha_lanzamiento = fecha_lanzamiento || movie.fecha_lanzamiento;
            movie.categoria = categoria || movie.categoria;
            movie.genero = genero || movie.genero;
            movie.calificacion = calificacion !== undefined ? calificacion : movie.calificacion;
            movie.precio_renta = precio_renta !== undefined ? precio_renta : movie.precio_renta;
            movie.precio_compra = precio_compra !== undefined ? precio_compra : movie.precio_compra;
            movie.url_imagen = url_imagen || movie.url_imagen;
            movie.stock_renta = stock_renta !== undefined ? stock_renta : movie.stock_renta;
            movie.stock_compra = stock_compra !== undefined ? stock_compra : movie.stock_compra;
            movie.popularidad = popularidad !== undefined ? popularidad : movie.popularidad;

            const updatedMovie = await movie.save();
            res.json(updatedMovie);
        } else {
            res.status(404).json({ message: 'Película no encontrada.' });
        }
    } catch (error) {
        console.error("Error en updateMovie:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Película no encontrada (ID mal formado).' });
        }
        res.status(500).json({ message: 'Error del servidor al actualizar la película.' });
    }
};

// @desc    Eliminar una película
// @route   DELETE /api/movies/:id
// @access  Private (Admin)
const deleteMovie = async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);

        if (movie) {
            await movie.deleteOne(); // o movie.remove() en versiones antiguas de mongoose
            res.json({ message: 'Película eliminada correctamente.' });
        } else {
            res.status(404).json({ message: 'Película no encontrada.' });
        }
    } catch (error) {
        console.error("Error en deleteMovie:", error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Película no encontrada (ID mal formado).' });
        }
        res.status(500).json({ message: 'Error del servidor al eliminar la película.' });
    }
};


module.exports = {
    createMovie,
    getAllMovies,
    getMovieById,
    updateMovie,
    deleteMovie
};