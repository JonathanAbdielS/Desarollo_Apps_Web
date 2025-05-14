// src/controllers/cartController.js
const Cart = require('../models/Cart');
const Movie = require('../models/movie');

// @desc    Obtener el carrito del usuario logueado
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id }).populate({
            path: 'items.movie',
            model: 'Movie',
            select: 'titulo url_imagen precio_renta precio_compra stock_renta stock_compra' // Seleccionar campos específicos de Movie
        });

        if (!cart) {
            cart = await Cart.create({ user: req.user.id, items: [] });
        }

        let subtotal = 0;
        let totalItems = 0;

        if (cart && cart.items) {
            cart.items.forEach(item => {
                // Usamos el precio que se guardó al agregar al carrito
                subtotal += item.quantity * item.precioUnitarioAlAgregar;
                totalItems += item.quantity;
            });
        }

        res.json({
            _id: cart._id,
            user: cart.user,
            items: cart.items.map(item => ({ // Mapeamos para reestructurar si es necesario o añadir info
                movie: item.movie, // Contiene los detalles populados
                quantity: item.quantity,
                tipo: item.tipo,
                precioUnitarioAlAgregar: item.precioUnitarioAlAgregar,
                // Podríamos añadir el subtotal del ítem aquí: item.quantity * item.precioUnitarioAlAgregar
            })),
            totalItems,
            subtotal,
            createdAt: cart.createdAt,
            updatedAt: cart.updatedAt
        });

    } catch (error) {
        console.error("Error en getCart:", error);
        res.status(500).json({ message: 'Error del servidor al obtener el carrito.' });
    }
};

// @desc    Agregar un ítem al carrito o actualizar su cantidad
// @route   POST /api/cart/item
// @access  Private
const addItemToCart = async (req, res) => {
    // Ahora el cliente debe enviar 'movieId', 'quantity' y 'tipo' ('renta' o 'compra')
    const { movieId, quantity, tipo } = req.body;
    const userId = req.user.id;

    try {
        if (!movieId || quantity === undefined || !tipo) {
            return res.status(400).json({ message: 'Se requiere movieId, quantity y tipo (renta/compra).' });
        }
        if (!['renta', 'compra'].includes(tipo)) {
            return res.status(400).json({ message: "El tipo debe ser 'renta' o 'compra'." });
        }

        const parsedQuantity = parseInt(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({ message: 'La cantidad debe ser un número positivo.' });
        }

        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ message: 'Película no encontrada.' });
        }

        let precioUnitarioAlAgregar;
        let stockDisponible;

        if (tipo === 'renta') {
            precioUnitarioAlAgregar = movie.precio_renta;
            stockDisponible = movie.stock_renta;
        } else { // tipo === 'compra'
            precioUnitarioAlAgregar = movie.precio_compra;
            stockDisponible = movie.stock_compra;
        }

        if (stockDisponible < parsedQuantity) {
            return res.status(400).json({ message: `Stock insuficiente para "${movie.titulo}" (${tipo}). Disponible: ${stockDisponible}` });
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = new Cart({ user: userId, items: [] });
        }

        // Un ítem en el carrito ahora es único por película Y por tipo (renta/compra)
        const itemIndex = cart.items.findIndex(item => item.movie.toString() === movieId && item.tipo === tipo);

        if (itemIndex > -1) {
            // Ítem existe (misma película, mismo tipo), actualizar cantidad
            const newQuantity = cart.items[itemIndex].quantity + parsedQuantity;
            if (stockDisponible < newQuantity) {
                 return res.status(400).json({ message: `Stock insuficiente para la cantidad total de "${movie.titulo}" (${tipo}). Disponible: ${stockDisponible}` });
            }
            cart.items[itemIndex].quantity = newQuantity;
            // No actualizamos precioUnitarioAlAgregar aquí, se mantiene el de la primera vez que se añadió.
        } else {
            // Ítem no existe (o es un tipo diferente para la misma película), agregarlo
            cart.items.push({ movie: movieId, quantity: parsedQuantity, tipo, precioUnitarioAlAgregar });
        }

        await cart.save();
        const populatedCart = await Cart.findById(cart._id).populate({
            path: 'items.movie',
            model: 'Movie',
            select: 'titulo url_imagen precio_renta precio_compra'
        });
        res.status(200).json(populatedCart);

    } catch (error) {
        console.error("Error en addItemToCart:", error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        res.status(500).json({ message: 'Error del servidor al agregar ítem al carrito.' });
    }
};

// @desc    Actualizar la cantidad de un ítem en el carrito
// @route   PUT /api/cart/item/:itemId (itemId ahora será el ID del subdocumento del ítem)
//          O podríamos identificar el ítem por movieId y tipo. Optaremos por esto último
//          para ser consistentes con cómo se agregan y eliminan.
// @route   PUT /api/cart/item (usaremos el body para identificar el item)
// @access  Private
const updateCartItemQuantity = async (req, res) => {
    // El cliente debe enviar 'movieId', 'quantity' y 'tipo'
    const { movieId, quantity, tipo } = req.body;
    const userId = req.user.id;

    try {
        if (!movieId || quantity === undefined || !tipo) {
            return res.status(400).json({ message: 'Se requiere movieId, quantity y tipo (renta/compra) para actualizar.' });
        }
         if (!['renta', 'compra'].includes(tipo)) {
            return res.status(400).json({ message: "El tipo debe ser 'renta' o 'compra'." });
        }

        const parsedQuantity = parseInt(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
            return res.status(400).json({ message: 'La nueva cantidad debe ser un número positivo.' });
        }

        const movie = await Movie.findById(movieId);
        if (!movie) {
            return res.status(404).json({ message: 'Película no encontrada.' });
        }

        let stockDisponible;
        if (tipo === 'renta') {
            stockDisponible = movie.stock_renta;
        } else { // tipo === 'compra'
            stockDisponible = movie.stock_compra;
        }

        if (stockDisponible < parsedQuantity) {
            return res.status(400).json({ message: `Stock insuficiente para "${movie.titulo}" (${tipo}). Disponible: ${stockDisponible}` });
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado.' });
        }

        const itemIndex = cart.items.findIndex(item => item.movie.toString() === movieId && item.tipo === tipo);
        if (itemIndex === -1) {
            return res.status(404).json({ message: `Ítem (Película: ${movieId}, Tipo: ${tipo}) no encontrado en el carrito.` });
        }

        cart.items[itemIndex].quantity = parsedQuantity;
        // El precioUnitarioAlAgregar no se cambia al actualizar cantidad.
        await cart.save();

        const populatedCart = await Cart.findById(cart._id).populate({
            path: 'items.movie',
            model: 'Movie',
            select: 'titulo url_imagen precio_renta precio_compra'
        });
        res.json(populatedCart);

    } catch (error) {
        console.error("Error en updateCartItemQuantity:", error);
         if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        res.status(500).json({ message: 'Error del servidor al actualizar la cantidad del ítem.' });
    }
};


// @desc    Eliminar un ítem específico (película + tipo) del carrito
// @route   DELETE /api/cart/item (usaremos el body para identificar el ítem)
// @access  Private
const removeCartItem = async (req, res) => {
    // El cliente debe enviar 'movieId' y 'tipo' para identificar el ítem a eliminar.
    const { movieId, tipo } = req.body;
    const userId = req.user.id;

    try {
        if (!movieId || !tipo) {
            return res.status(400).json({ message: 'Se requiere movieId y tipo (renta/compra) para eliminar.' });
        }
        if (!['renta', 'compra'].includes(tipo)) {
            return res.status(400).json({ message: "El tipo debe ser 'renta' o 'compra'." });
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado.' });
        }

        const initialLength = cart.items.length;
        cart.items = cart.items.filter(item => !(item.movie.toString() === movieId && item.tipo === tipo));

        if (cart.items.length === initialLength) {
            return res.status(404).json({ message: `Ítem (Película: ${movieId}, Tipo: ${tipo}) no encontrado en el carrito.` });
        }

        await cart.save();
        const populatedCart = await Cart.findById(cart._id).populate({
            path: 'items.movie',
            model: 'Movie',
            select: 'titulo url_imagen precio_renta precio_compra'
        });
        res.json(populatedCart);

    } catch (error) {
        console.error("Error en removeCartItem:", error);
        res.status(500).json({ message: 'Error del servidor al eliminar ítem del carrito.' });
    }
};

// @desc    Limpiar todo el carrito del usuario
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res) => {
    const userId = req.user.id;
    try {
        const cart = await Cart.findOne({ user: userId });
        if (cart) {
            cart.items = [];
            await cart.save();
            // Devolver el carrito vacío populado para consistencia
            const populatedCart = await Cart.findById(cart._id).populate('items.movie');
            res.json({ message: 'Carrito limpiado exitosamente.', cart: populatedCart });
        } else {
            // Si no hay carrito, igual es un éxito funcionalmente.
            res.json({ message: 'Carrito no encontrado o ya estaba vacío.' });
        }
    } catch (error) {
        console.error("Error en clearCart:", error);
        res.status(500).json({ message: 'Error del servidor al limpiar el carrito.' });
    }
};


module.exports = {
    getCart,
    addItemToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart
};