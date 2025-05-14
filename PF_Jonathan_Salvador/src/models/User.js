// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'El nombre de usuario es obligatorio.'],
        unique: true,
        trim: true,
        lowercase: true,
        minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres.']
    },
    nombre: { // Según requerimientos: "nombre(string)"
        type: String,
        required: [true, 'El nombre es obligatorio.'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'El correo electrónico es obligatorio.'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Por favor, introduce un correo electrónico válido.']
    },
    password: { // Según requerimientos: "contraseña (string)"
        type: String,
        required: [true, 'La contraseña es obligatoria.'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres.']
        // No guardaremos la contraseña en texto plano, se hará hash antes de guardar
    },
    fecha_nacimiento: { // Según requerimientos: "fecha_nacimiento(string de fecha año-mes-día)"
        type: Date, // Usamos Date para mejor manejo, aunque se reciba como string
        required: [true, 'La fecha de nacimiento es obligatoria.']
    },
    fecha_registro: { // Según requerimientos: "fecha_registro(string de fecha año-mes-día)"
        type: Date,
        default: Date.now // Se establece automáticamente al crear el usuario
    },
    tipo_usuario: { // Según requerimientos: "tipo_usuario(boolean)" - True para admin, False para cliente
        type: String,
        enum: ['cliente', 'admin'],
        default: 'cliente'
    }
}, {
    timestamps: true // Añade createdAt y updatedAt automáticamente
});

// Middleware (hook) para hashear la contraseña antes de guardar el usuario
userSchema.pre('save', async function(next) {
    // Solo hashear la contraseña si ha sido modificada (o es nueva)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error); // Pasa el error al siguiente middleware o al manejador de errores
    }
});

// Método para comparar la contraseña ingresada con la hasheada en la BD
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

const User = mongoose.model('User', userSchema);

module.exports = User;