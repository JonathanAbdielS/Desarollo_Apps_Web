// src/models/Cart.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartItemSchema = new Schema({
    movie: {
        type: Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'La cantidad debe ser al menos 1.'],
        default: 1
    },
    tipo: { // 'renta' o 'compra'
        type: String,
        enum: ['renta', 'compra'],
        required: [true, 'Se debe especificar si el ítem es para renta o compra.']
    },
    precioUnitarioAlAgregar: { // Guardamos el precio al momento de agregar
        type: Number,
        required: true
    }
}, {
    _id: false // Los ítems son subdocumentos, no necesitan su propio _id principal
});

const cartSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
}, {
    timestamps: true
});

// Ya no usaremos el virtual 'subtotal' aquí, lo calcularemos en el controlador
// para mayor precisión y flexibilidad con la populación.

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;