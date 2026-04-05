const express = require('express');
const mongoose = require('mongoose');
const redis = require('redis');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Models (Yahan Variable Names Capital rakhein taaki niche error na aaye)
const User = require('./models/user');
const Task = require('./models/task');

const app = express();
const JWT_SECRET = "waygood_secret_key_123";

// --- MIDDLEWARES ---
app.use(helmet()); 
app.use(cors());
app.use(express.json());

// --- DATABASE & REDIS CONNECTIONS ---

// Docker ke liye 'mongodb' service name use ho raha hai
mongoose.connect('mongodb://mongodb:27017/ai_assignment')
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Error:", err));

// Publisher ko define karna zaroori hai
const publisher = redis.createClient({
    url: process.env.REDIS_URL || 'redis://redis:6379' 
});

publisher.on('error', (err) => console.log('❌ Redis Error', err));

async function connectRedis() {
    try {
        await publisher.connect();
        console.log("✅ Redis Connected & Ready to Queue");
    } catch (err) {
        console.log("❌ Redis Connection Failed:", err);
    }
}
connectRedis();

// --- ALL ROUTES ---

app.get('/', (req, res) => res.send("API is Running!"));

app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        // 'User' use kiya kyunki upar import 'User' naam se hai
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: "User Registered Successfully!" });
    } catch (err) {
        res.status(400).json({ error: "Username already exists" });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const foundUser = await User.findOne({ username });
        if (!foundUser || !(await bcrypt.compare(password, foundUser.password))) {
            return res.status(401).json({ error: "Invalid Credentials" });
        }
        const token = jwt.sign({ userId: foundUser._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ message: "Login Success", token });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
});

app.post('/tasks', async (req, res) => {
    try {
        const { title, inputData, operation } = req.body;
        const newTask = new Task({ title, inputData, operation, status: 'pending' });
        await newTask.save();

        const message = { taskId: newTask._id, inputData, operation };
        // Redis list mein data bhej rahe hain
        await publisher.lPush('task_queue', JSON.stringify(message));

        res.status(201).json({ message: "Task queued successfully!", taskId: newTask._id });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Task create nahi ho paya" });
    }
});

app.get('/tasks', async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: "Tasks fetch nahi ho paye" });
    }
});

// --- SERVER START ---
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
});