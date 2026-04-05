const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: { type: String, required: true },
    inputData: { type: String, required: true },
    operation: { type: String, enum: ['uppercase', 'lowercase', 'reverse', 'word_count'] },
    status: { type: String, default: 'pending' }, // pending, running, success, failed
    result: { type: String, default: null },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);