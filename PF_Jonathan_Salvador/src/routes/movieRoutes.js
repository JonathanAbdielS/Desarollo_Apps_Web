// src/routes/movieRoutes.js
const express = require('express');
const router = express.Router();
const {
    createMovie,
    getAllMovies,
    getMovieById,
    updateMovie,
    deleteMovie
} = require('../controllers/movieController');
const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/', getAllMovies);
router.get('/:id', getMovieById);

// Rutas privadas para administradores
router.post('/', protect, authorizeRoles('admin'), createMovie);
router.put('/:id', protect, authorizeRoles('admin'), updateMovie);
router.delete('/:id', protect, authorizeRoles('admin'), deleteMovie);

module.exports = router;