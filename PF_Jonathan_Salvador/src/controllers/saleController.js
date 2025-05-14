// src/controllers/saleController.js
const Sale = require('../models/Sale');
const Cart = require('../models/Cart');
const Movie = require('../models/movie');
const mongoose = require('mongoose');

// @desc    Crear una nueva venta (procesar carrito)
// @route   POST /api/sales/checkout
// @access  Private
const createSale = async (req, res) => {
    const userId = req.user.id;
    const session = await mongoose.startSession(); // Para transacciones
    session.startTransaction();

    try {
        const cart = await Cart.findOne({ user: userId }).populate('items.movie').session(session);

        if (!cart || cart.items.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'El carrito está vacío.' });
        }

        const saleItems = [];
        let totalVentaCalculado = 0;

        for (const cartItem of cart.items) {
            const movie = cartItem.movie; // Ya está populado
            if (!movie) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({ message: `Película con ID ${cartItem.movie} no encontrada en el carrito durante el checkout.` });
            }

            let stockField;
            let currentStock;

            if (cartItem.tipo === 'renta') {
                stockField = 'stock_renta';
                currentStock = movie.stock_renta;
            } else { // 'compra'
                stockField = 'stock_compra';
                currentStock = movie.stock_compra;
            }

            if (currentStock < cartItem.quantity) {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: `Stock insuficiente para "${movie.titulo}" (${cartItem.tipo}). Disponible: ${currentStock}, Solicitado: ${cartItem.quantity}` });
            }

            // Añadir ítem a la venta
            saleItems.push({
                movie: movie._id,
                titulo: movie.titulo, // Guardar el título actual
                quantity: cartItem.quantity,
                tipo: cartItem.tipo,
                precioUnitario: cartItem.precioUnitarioAlAgregar, // Precio del carrito
                subtotalItem: cartItem.quantity * cartItem.precioUnitarioAlAgregar
            });

            totalVentaCalculado += cartItem.quantity * cartItem.precioUnitarioAlAgregar;

            // Actualizar stock de la película
            await Movie.findByIdAndUpdate(movie._id, {
                $inc: { [stockField]: -cartItem.quantity }
            }, { session });
        }

        // Crear la venta
        const newSale = new Sale({
            user: userId,
            items: saleItems,
            totalVenta: totalVentaCalculado,
            estatus: 'completada' // Asumimos completada al simular el "pago"
        });
        await newSale.save({ session });

        // Limpiar el carrito del usuario
        cart.items = [];
        await cart.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ message: 'Venta realizada exitosamente.', sale: newSale });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error en createSale:", error);
        res.status(500).json({ message: 'Error del servidor al procesar la venta.', error: error.message });
    }
};

// @desc    Obtener historial de compras del usuario logueado
// @route   GET /api/sales/history
// @access  Private
const getMySalesHistory = async (req, res) => {
    try {
        const sales = await Sale.find({ user: req.user.id })
            .populate('items.movie', 'titulo url_imagen') // Popula solo campos necesarios de la película
            .sort({ fecha_compra: -1 }); // Las más recientes primero
        res.json(sales);
    } catch (error) {
        console.error("Error en getMySalesHistory:", error);
        res.status(500).json({ message: 'Error del servidor al obtener el historial de ventas.' });
    }
};

// @desc    Obtener todas las ventas (Admin)
// @route   GET /api/sales
// @access  Private (Admin)
const getAllSales = async (req, res) => {
    // Podríamos añadir filtros por fecha, estatus, usuario, etc.
    const { page = 1, limit = 10, estatus, userId } = req.query;
    try {
        let query = {};
        if (estatus) query.estatus = estatus;
        if (userId) query.user = userId;

        const count = await Sale.countDocuments(query);
        const sales = await Sale.find(query)
            .populate('user', 'username nombre email') // Popula datos del usuario
            .populate('items.movie', 'titulo') // Popula título de la película
            .sort({ fecha_compra: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        res.json({
            sales,
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalSales: count
        });
    } catch (error) {
        console.error("Error en getAllSales:", error);
        res.status(500).json({ message: 'Error del servidor al obtener todas las ventas.' });
    }
};

// @desc    Obtener detalle de una venta específica (Admin/Usuario dueño)
// @route   GET /api/sales/:id
// @access  Private
const getSaleById = async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('user', 'username nombre email')
            .populate('items.movie', 'titulo url_imagen categoria genero');

        if (!sale) {
            return res.status(404).json({ message: 'Venta no encontrada.' });
        }

        // Verificar si el usuario es admin o el dueño de la venta
        if (sale.user.toString() !== req.user.id && req.user.tipo_usuario !== 'admin') {
            return res.status(403).json({ message: 'No autorizado para ver esta venta.' });
        }

        res.json(sale);
    } catch (error) {
        console.error("Error en getSaleById:", error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Venta no encontrada (ID mal formado).' });
        }
        res.status(500).json({ message: 'Error del servidor al obtener la venta.' });
    }
};


// @desc    Actualizar el estatus de una venta (Admin)
// @route   PUT /api/sales/:id/status
// @access  Private (Admin)
const updateSaleStatus = async (req, res) => {
    const { estatus } = req.body;

    if (!estatus || !['pendiente', 'completada', 'cancelada'].includes(estatus)) {
        return res.status(400).json({ message: "El estatus proporcionado es inválido. Valores permitidos: pendiente, completada, cancelada." });
    }

    try {
        const sale = await Sale.findById(req.params.id);

        if (!sale) {
            return res.status(404).json({ message: 'Venta no encontrada.' });
        }

        // Lógica adicional si se cancela una venta (ej. reponer stock)
        // Esto debería hacerse en una transacción si es complejo.
        if (estatus === 'cancelada' && sale.estatus !== 'cancelada') {
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                for (const item of sale.items) {
                    const stockField = item.tipo === 'renta' ? 'stock_renta' : 'stock_compra';
                    await Movie.findByIdAndUpdate(item.movie, {
                        $inc: { [stockField]: item.quantity }
                    }, { session });
                }
                sale.estatus = estatus;
                await sale.save({ session });
                await session.commitTransaction();
            } catch (transactionError) {
                await session.abortTransaction();
                throw transactionError; // Re-lanza para ser capturado por el catch principal
            } finally {
                session.endSession();
            }
        } else {
            sale.estatus = estatus;
            await sale.save();
        }

        res.json({ message: 'Estatus de la venta actualizado.', sale });
    } catch (error) {
        console.error("Error en updateSaleStatus:", error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Venta no encontrada (ID mal formado).' });
        }
        res.status(500).json({ message: 'Error del servidor al actualizar el estatus de la venta.', error: error.message });
    }
};


module.exports = {
    createSale,
    getMySalesHistory,
    getAllSales,
    getSaleById,
    updateSaleStatus
};