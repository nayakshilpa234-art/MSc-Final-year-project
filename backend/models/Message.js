const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    sender: {
        type: String,
        enum: ['user', 'ai', 'bot'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        type: Array,
        default: []
    },
    options: {
        type: Array,
        default: []
    },
    step: {
        type: String,
        default: ''
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', MessageSchema);
