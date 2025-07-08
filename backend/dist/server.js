"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dbService_1 = require("./dbService");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const multer_1 = __importDefault(require("multer"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/gallery_uploads', express_1.default.static(path_1.default.join(__dirname, 'gallery_uploads')));
const upload = (0, multer_1.default)({ dest: "gallery_uploads/" });
// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});
// Sign up endpoint
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        console.log('Signup attempt:', { email, username });
        if (!email || !password || !username) {
            return res.status(400).json({ error: 'Email, password, and username are required' });
        }
        const existingUser = dbService_1.dbService.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        const user = await dbService_1.dbService.createUser(email, password, username);
        console.log('User created:', user);
        res.status(201).json({ user });
    }
    catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Sign in endpoint
app.post('/api/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Signin attempt:', { email });
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = dbService_1.dbService.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValidPassword = await dbService_1.dbService.verifyPassword(email, password);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = dbService_1.dbService.createSession(Number(user.id));
        console.log('User signed in:', { id: user.id, email: user.email, role: user.role });
        res.json({ user, token });
    }
    catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// GET /api/gallery
app.get('/api/gallery', (req, res) => {
    const images = dbService_1.dbService.getGalleryImages();
    // Return URLs relative to server
    const mapped = images.map(img => ({ ...img, src: `/gallery_uploads/${path_1.default.basename(img.src)}` }));
    res.json(mapped);
});
// POST /api/gallery
app.post('/api/gallery', upload.single('image'), (req, res) => {
    if (!req.file || !req.body.title) {
        return res.status(400).json({ error: 'Image file and title are required' });
    }
    const img = dbService_1.dbService.addGalleryImage(req.file.path, req.body.title);
    res.status(201).json({ ...img, src: `/gallery_uploads/${path_1.default.basename(img.src)}` });
});
// DELETE /api/gallery/:id
app.delete('/api/gallery/:id', (req, res) => {
    const id = Number(req.params.id);
    const images = dbService_1.dbService.getGalleryImages();
    const img = images.find(i => i.id === id);
    if (!img)
        return res.status(404).json({ error: 'Image not found' });
    // Delete file from disk
    try {
        fs_1.default.unlinkSync(img.src);
    }
    catch (_a) { }
    dbService_1.dbService.deleteGalleryImage(id);
    res.json({ success: true });
});
// --- Admin & Subscription Endpoints ---
// Get all users with profiles
app.get('/api/admin/users', (req, res) => {
    try {
        const users = dbService_1.dbService.getAllUsersWithProfiles();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// Get all plans
app.get('/api/admin/plans', (req, res) => {
    try {
        const plans = dbService_1.dbService.getAllPlans();
        res.json(plans);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch plans' });
    }
});
// Get all subscriptions for a user
app.get('/api/admin/user/:id/subscriptions', (req, res) => {
    try {
        const userId = Number(req.params.id);
        const subs = dbService_1.dbService.getUserSubscriptions(userId);
        res.json(subs);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }
});
// Create a new subscription for a user
app.post('/api/admin/subscription', (req, res) => {
    try {
        const { userId, planId } = req.body;
        if (!userId || !planId)
            return res.status(400).json({ error: 'userId and planId required' });
        const subId = dbService_1.dbService.createSubscription(userId, planId);
        res.status(201).json({ subscriptionId: subId });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create subscription' });
    }
});
// Pause a subscription
app.post('/api/admin/subscription/:id/pause', (req, res) => {
    try {
        const subId = Number(req.params.id);
        dbService_1.dbService.pauseSubscription(subId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to pause subscription' });
    }
});
// Resume a subscription
app.post('/api/admin/subscription/:id/resume', (req, res) => {
    try {
        const subId = Number(req.params.id);
        dbService_1.dbService.resumeSubscription(subId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to resume subscription' });
    }
});
// TEMP: Add a Standard plan subscription for Shreya (user_id=2)
app.post('/api/dev/add-shreya-sub', (req, res) => {
    try {
        // Clean up any existing subscription for user_id=2 and plan_id=1
        const existing = dbService_1.dbService.getUserSubscription(2, 1);
        if (existing && existing.id) {
            dbService_1.dbService.deleteSubscriptionPeriod(existing.id);
            dbService_1.dbService.deleteSubscription(existing.id);
        }
        // Insert subscription for user_id=2, plan_id=1 (Standard)
        const subId = dbService_1.dbService.createSubscription(2, 1);
        dbService_1.dbService.updateSubscriptionStartDate(Number(subId), '2025-01-01');
        res.json({ success: true, subscriptionId: subId });
    }
    catch (e) {
        console.error('Failed to insert subscription:', e);
        res.status(500).json({ error: 'Failed to insert subscription', details: e.message });
    }
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Database initialized in ${__dirname}/data/users.db`);
});
