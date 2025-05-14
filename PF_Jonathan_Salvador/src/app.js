// src/app.js
require('dotenv').config(); // Carga las variables de entorno desde .env
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db'); // Crearemos este archivo a continuación

// Importar rutas
const authRoutes = require('./routes/authRoutes'); 
const movieRoutes = require('./routes/movieRoutes');
const cartRoutes = require('./routes/cartRoutes'); 
const saleRoutes = require('./routes/saleRoutes');
const userRoutes = require('./routes/userRoutes');

// Inicializar la conexión a la BD
connectDB();
const app = express();


app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json()); // Para parsear application/json
app.use(express.urlencoded({ extended: false })); // Para parsear application/x-www-form-urlencoded

app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/ping', (req, res) => {
    res.json({ message: 'Pong! API funcionando correctamente.' });
});

app.use('/api/auth', authRoutes); 
app.use('/api/movies', movieRoutes);
app.use('/api/cart', cartRoutes); 
app.use('/api/sales', saleRoutes); 
app.use('/api/users', userRoutes);

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
