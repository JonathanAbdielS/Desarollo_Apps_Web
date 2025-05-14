// src/models/Sale.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const saleItemSchema = new Schema({
    movie: { // Referencia a la película
        type: Schema.Types.ObjectId,
        ref: 'Movie',
        required: true
    },
    titulo: { // Guardamos el título al momento de la venta
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    tipo: { // 'renta' o 'compra'
        type: String,
        enum: ['renta', 'compra'],
        required: true
    },
    precioUnitario: { // Precio al que se vendió/rentó
        type: Number,
        required: true
    },
    subtotalItem: { // quantity * precioUnitario
        type: Number,
        required: true
    }
}, {
    _id: false
});

const saleSchema = new Schema({
    user: { // Usuario que realizó la compra
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [saleItemSchema], // Array de ítems comprados/rentados
    totalVenta: { // Suma de todos los subtotalItem
        type: Number,
        required: true
    },
    fecha_compra: { // Según requerimientos: "fecha_compra(string de fecha año-mes-dia)"
        type: Date,
        default: Date.now
    },
    // id_venta(int), id_carrito (int) -> El _id de Mongoose para Sale será id_venta.
    // No guardaremos id_carrito directamente, sino los ítems del carrito en el momento de la venta.
    // Si necesitas un ID de venta numérico secuencial, se requiere lógica adicional.

    // Requerimiento del frontend: "detalle de ventas y estatus"
    // "Al seleccionar una venta con estatus pendiente es posible ver el detalle de la venta...
    // y la posibilidad de cambiar el estatus a completada o cancelada"
    estatus: {
        type: String,
        enum: ['pendiente', 'completada', 'cancelada'],
        default: 'pendiente' // O 'completada' si el "pago" es inmediato y simulado
    },
    // Podríamos añadir detalles de envío, pago, etc., si fuera una aplicación real.
    // Por ahora, nos centramos en los requerimientos.

}, {
    timestamps: true // Añade createdAt y updatedAt
});

// Índices
saleSchema.index({ user: 1 });
saleSchema.index({ fecha_compra: -1 });
saleSchema.index({ estatus: 1 });


const Sale = mongoose.model('Sale', saleSchema);

module.exports = Sale;