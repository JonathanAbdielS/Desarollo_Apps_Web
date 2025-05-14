// src/models/Movie.js
const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    // id_pelicula: Mongoose genera automáticamente un _id único para cada documento.
    // Si necesitas un ID numérico secuencial, se requiere lógica adicional (ej. un contador separado o un plugin).
    // Por simplicidad y práctica común con MongoDB, usaremos el _id de Mongoose.
    // Si es estrictamente necesario un id_pelicula numérico, avísame para discutir alternativas.

    titulo: {
        type: String,
        required: [true, 'El título de la película es obligatorio.'],
        trim: true
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción es obligatoria.'],
        trim: true
    },
    fecha_lanzamiento: { // "string de año"
        type: String, // Podría ser Number si solo es el año, o Date si es una fecha completa.
                      // Usaremos String por ahora para flexibilidad con "string de año".
        required: [true, 'La fecha de lanzamiento es obligatoria.']
    },
    categoria: { // Ej: "Estrenos", "Clásicos", "Infantil" (diferente a género)
        type: String,
        required: [true, 'La categoría es obligatoria.'],
        trim: true
    },
    genero: { // Ej: "Acción", "Comedia", "Drama"
        type: [String], // Puede tener múltiples géneros
        required: [true, 'El género es obligatorio.'],
        trim: true
    },
    calificacion: { // Rango de 0 a 100 o 0 a 10, según prefieras.
        type: Number,
        min: 0,
        max: 10, // Asumiendo una escala de 0 a 10. Ajusta si es diferente.
        default: 0
    },
    precio_renta: {
        type: Number,
        required: [true, 'El precio de renta es obligatorio.'],
        min: 0
    },
    precio_compra: {
        type: Number,
        required: [true, 'El precio de compra es obligatorio.'],
        min: 0
    },
    url_imagen: { // URL pública de la imagen/póster
        type: String,
        required: [true, 'La URL de la imagen es obligatoria.'],
        trim: true
    },
    stock_renta: { // Necesitamos saber cuántas copias hay para rentar
        type: Number,
        required: [true, 'El stock para renta es obligatorio.'],
        min: 0,
        default: 0
    },
    stock_compra: { // Y cuántas para venta (si aplica, podría ser ilimitado para digital)
        type: Number,
        required: [true, 'El stock para compra es obligatorio.'],
        min: 0,
        default: 0
    },
    popularidad: { // Campo para el criterio de búsqueda "popularidad"
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true // Añade createdAt y updatedAt automáticamente
});

// Índices para mejorar el rendimiento de las búsquedas
movieSchema.index({ titulo: 'text', descripcion: 'text' }); // Índice de texto para título y descripción
movieSchema.index({ genero: 1 }); // Índice multikey para el array de géneros
movieSchema.index({ categoria: 1 }); // Índice para categoría
movieSchema.index({ popularidad: -1 }); // Índice para popularidad (descendente)
movieSchema.index({ precio_renta: 1 }); // Índice para precio de renta
movieSchema.index({ precio_compra: 1 }); // Índice para precio de compra
movieSchema.index({ fecha_lanzamiento: -1 }); // Índice para fecha de lanzamiento

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;