// seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./public/src/config/db'); 
const User = require('./public/src/models/User');
const Movie = require('./public/src/models/Movie');

// --- Datos del Administrador ---
const adminUserData = {
    username: 'adminuser',
    nombre: 'Administrador Principal',
    email: 'admin@example.com',
    password: 'AdminPassword123!', // El hook pre-save en el modelo User lo hasheará
    fecha_nacimiento: new Date('1990-01-01'),
    tipo_usuario: 'admin'
};

// --- Datos de Películas de Ejemplo (añade más si quieres) ---
const sampleMovies = [
    {
        titulo: "Inception",
        descripcion: "Un ladrón que roba información...",
        fecha_lanzamiento: "2010",
        categoria: "Ciencia Ficción",
        genero: ["Ciencia Ficción", "Thriller", "Acción"],
        calificacion: 8.8,
        precio_renta: 49.90,
        precio_compra: 199.90,
        url_imagen: "https://m.media-amazon.com/images/I/912AErFSBHL._AC_SL1500_.jpg",
        stock_renta: 10,
        stock_compra: 5,
        popularidad: 90
    },
    {
        titulo: "The Matrix",
        descripcion: "Un hacker descubre la verdad...",
        fecha_lanzamiento: "1999",
        categoria: "Ciencia Ficción",
        genero: ["Ciencia Ficción", "Acción"],
        calificacion: 8.7,
        precio_renta: 39.90,
        precio_compra: 179.90,
        url_imagen: "https://m.media-amazon.com/images/I/51EG732BV3L._AC_.jpg",
        stock_renta: 15,
        stock_compra: 8,
        popularidad: 95
    }
];

const seedDB = async () => {
    try {
        await connectDB(); // Conectar a la base de datos

        // --- Limpiar colecciones ---
        console.log('Limpiando datos antiguos (Usuarios y Películas)...');
        await User.deleteMany({});
        await Movie.deleteMany({});

        // --- Crear Usuario Administrador ---
        console.log('Creando usuario administrador...');
        const admin = await User.create(adminUserData);
        console.log('Usuario administrador creado:', admin.email);

        // --- Crear Películas de Ejemplo ---
        console.log('Creando películas de ejemplo...');
        await Movie.insertMany(sampleMovies);
        console.log(`${sampleMovies.length} películas de ejemplo creadas.`);

        console.log('¡Proceso de seeding completado!');
    } catch (error) {
        console.error('Error durante el proceso de seeding:', error);
    } finally {
        mongoose.disconnect();
        console.log('Desconectado de MongoDB.');
    }
};

seedDB();