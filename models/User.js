const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String },
    email: { type: String },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    chatHistory: { type: Array, default: [] },
    authProvider: { type: String, enum: ['local', 'google', 'apple'], default: 'local' },
    authProviderId: { type: String }
});

userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
