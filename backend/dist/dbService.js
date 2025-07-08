"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbService = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const fs_1 = __importDefault(require("fs"));
// Ensure the data directory exists
const dataDir = path_1.default.join(__dirname, 'data');
if (!fs_1.default.existsSync(dataDir)) {
    fs_1.default.mkdirSync(dataDir, { recursive: true });
}
const db = new better_sqlite3_1.default(path_1.default.join(dataDir, 'users.db'));
// Initialize database
const initDb = () => {
    // Create users table
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Create profiles table
    db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      role TEXT CHECK(role IN ('user', 'admin')) NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
    // Create sessions table
    db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME DEFAULT (datetime('now', '+7 days')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
    // Create gallery table
    db.exec(`
    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      src TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Create plans table
    db.exec(`
    CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL CHECK(name IN ('Standard', 'Pro')),
      duration_months INTEGER NOT NULL DEFAULT 12
    )
  `);
    // Create subscriptions table
    db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      start_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
      UNIQUE(user_id, plan_id, start_date)
    )
  `);
    // Create subscription_periods table
    db.exec(`
    CREATE TABLE IF NOT EXISTS subscription_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subscription_id INTEGER NOT NULL,
      start_date DATETIME NOT NULL,
      end_date DATETIME,
      status TEXT CHECK(status IN ('active', 'paused')) NOT NULL,
      FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE
    )
  `);
    // Indexes for performance
    db.exec(`CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_subscription_periods_subscription_id ON subscription_periods(subscription_id)`);
    // Insert default plans if not present
    const standardPlan = db.prepare('SELECT id FROM plans WHERE name = ?').get('Standard');
    if (!standardPlan) {
        db.prepare('INSERT INTO plans (name, duration_months) VALUES (?, ?)').run('Standard', 12);
    }
    const proPlan = db.prepare('SELECT id FROM plans WHERE name = ?').get('Pro');
    if (!proPlan) {
        db.prepare('INSERT INTO plans (name, duration_months) VALUES (?, ?)').run('Pro', 12);
    }
    // Create admin user if not exists
    const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@example.com');
    if (!adminExists) {
        const hashedPassword = bcryptjs_1.default.hashSync('admin123', 10);
        const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)')
            .run('admin@example.com', hashedPassword);
        db.prepare('INSERT INTO profiles (id, username, role) VALUES (?, ?, ?)')
            .run(result.lastInsertRowid, 'admin', 'admin');
    }
};
// Initialize database on startup
initDb();
exports.dbService = {
    // User operations
    createUser: async (email, password, username) => {
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const result = db.prepare('INSERT INTO users (email, password) VALUES (?, ?)')
            .run(email, hashedPassword);
        db.prepare('INSERT INTO profiles (id, username, role) VALUES (?, ?, ?)')
            .run(result.lastInsertRowid, username, 'user');
        const user = exports.dbService.getUserById(Number(result.lastInsertRowid));
        if (!user)
            throw new Error('Failed to create user');
        return user;
    },
    getUserByEmail: (email) => {
        const user = db.prepare(`
      SELECT u.*, p.username, p.role
      FROM users u
      JOIN profiles p ON u.id = p.id
      WHERE u.email = ?
    `).get(email);
        if (!user)
            return null;
        return {
            id: user.id.toString(),
            email: user.email,
            username: user.username,
            role: user.role,
            createdAt: user.created_at
        };
    },
    getUserById: (id) => {
        const user = db.prepare(`
      SELECT u.*, p.username, p.role
      FROM users u
      JOIN profiles p ON u.id = p.id
      WHERE u.id = ?
    `).get(id);
        if (!user)
            return null;
        return {
            id: user.id.toString(),
            email: user.email,
            username: user.username,
            role: user.role,
            createdAt: user.created_at
        };
    },
    verifyPassword: async (email, password) => {
        const user = db.prepare('SELECT password FROM users WHERE email = ?')
            .get(email);
        if (!user)
            return false;
        return bcryptjs_1.default.compare(password, user.password);
    },
    // Profile operations
    updateProfile: (id, data) => {
        const updates = Object.entries(data)
            .filter(([key]) => key !== 'id' && key !== 'created_at')
            .map(([key]) => `${key} = ?`)
            .join(', ');
        const values = Object.entries(data)
            .filter(([key]) => key !== 'id' && key !== 'created_at')
            .map(([_, value]) => value);
        if (updates) {
            db.prepare(`UPDATE profiles SET ${updates}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
                .run(...values, id);
        }
    },
    // Session management
    createSession: (userId) => {
        const token = Math.random().toString(36).substring(2);
        db.prepare('INSERT INTO sessions (user_id, token) VALUES (?, ?)')
            .run(userId, token);
        return token;
    },
    validateSession: (token) => {
        const session = db.prepare(`
      SELECT u.id
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > CURRENT_TIMESTAMP
    `).get(token);
        if (!session)
            return null;
        return exports.dbService.getUserById(session.id);
    },
    deleteSession: (token) => {
        db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    },
    // Gallery operations
    getGalleryImages: () => {
        return db.prepare('SELECT * FROM gallery ORDER BY created_at DESC').all();
    },
    addGalleryImage: (src, title) => {
        const result = db.prepare('INSERT INTO gallery (src, title) VALUES (?, ?)').run(src, title);
        return db.prepare('SELECT * FROM gallery WHERE id = ?').get(result.lastInsertRowid);
    },
    deleteGalleryImage: (id) => {
        return db.prepare('DELETE FROM gallery WHERE id = ?').run(id);
    },
    // Subscription and plan management
    getAllUsersWithProfiles: () => {
        return db.prepare(`
      SELECT u.id, u.email, p.username, p.role, u.created_at as user_created_at, p.created_at as profile_created_at, p.updated_at
      FROM users u
      JOIN profiles p ON u.id = p.id
      ORDER BY u.id
    `).all();
    },
    getAllPlans: () => {
        return db.prepare('SELECT * FROM plans ORDER BY id').all();
    },
    getUserSubscriptions: (userId) => {
        return db.prepare(`
      SELECT s.id as subscription_id, s.start_date, pl.name as plan_name, pl.duration_months,
             sp.id as period_id, sp.start_date as period_start, sp.end_date as period_end, sp.status
      FROM subscriptions s
      JOIN plans pl ON s.plan_id = pl.id
      LEFT JOIN subscription_periods sp ON s.id = sp.subscription_id
      WHERE s.user_id = ?
      ORDER BY s.start_date, sp.start_date
    `).all(userId);
    },
    createSubscription: (userId, planId) => {
        const result = db.prepare('INSERT INTO subscriptions (user_id, plan_id) VALUES (?, ?)').run(userId, planId);
        // Start with an active period
        db.prepare('INSERT INTO subscription_periods (subscription_id, start_date, status) VALUES (?, CURRENT_TIMESTAMP, ?)')
            .run(result.lastInsertRowid, 'active');
        return result.lastInsertRowid;
    },
    pauseSubscription: (subscriptionId) => {
        // Find the current active period
        const period = db.prepare('SELECT id FROM subscription_periods WHERE subscription_id = ? AND status = ? AND end_date IS NULL')
            .get(subscriptionId, 'active');
        if (period && typeof period.id === 'number') {
            db.prepare('UPDATE subscription_periods SET end_date = CURRENT_TIMESTAMP, status = ? WHERE id = ?')
                .run('paused', period.id);
            // Start a new paused period
            db.prepare('INSERT INTO subscription_periods (subscription_id, start_date, status) VALUES (?, CURRENT_TIMESTAMP, ?)')
                .run(subscriptionId, 'paused');
        }
    },
    resumeSubscription: (subscriptionId) => {
        // Find the current paused period
        const period = db.prepare('SELECT id FROM subscription_periods WHERE subscription_id = ? AND status = ? AND end_date IS NULL')
            .get(subscriptionId, 'paused');
        if (period && typeof period.id === 'number') {
            db.prepare('UPDATE subscription_periods SET end_date = CURRENT_TIMESTAMP WHERE id = ?')
                .run(period.id);
            // Start a new active period
            db.prepare('INSERT INTO subscription_periods (subscription_id, start_date, status) VALUES (?, CURRENT_TIMESTAMP, ?)')
                .run(subscriptionId, 'active');
        }
    },
    updateSubscriptionStartDate: (subId, newDate) => {
        db.prepare('UPDATE subscriptions SET start_date = ? WHERE id = ?').run(newDate, subId);
        db.prepare('UPDATE subscription_periods SET start_date = ? WHERE subscription_id = ?').run(newDate, subId);
    },
    getUserSubscription: (userId, planId) => {
        return db.prepare('SELECT id FROM subscriptions WHERE user_id = ? AND plan_id = ?').get(userId, planId);
    },
    deleteSubscription: (subId) => {
        db.prepare('DELETE FROM subscriptions WHERE id = ?').run(subId);
    },
    deleteSubscriptionPeriod: (subId) => {
        db.prepare('DELETE FROM subscription_periods WHERE subscription_id = ?').run(subId);
    }
};
