import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory store for suspicious activity (AI verification layer)
const loginAttempts = {};

export const login = async (req, res) => {
  try {
    const { department, officerId, password } = req.body;

    // AI Security Layer: Check for brute force / suspicious attempts
    const attemptKey = `${department}-${officerId}`;
    if (!loginAttempts[attemptKey]) loginAttempts[attemptKey] = { count: 0, lastAttempt: Date.now() };
    
    // Reset attempts if more than 15 minutes have passed
    if (Date.now() - loginAttempts[attemptKey].lastAttempt > 15 * 60 * 1000) {
      loginAttempts[attemptKey].count = 0;
    }
    
    loginAttempts[attemptKey].count += 1;
    loginAttempts[attemptKey].lastAttempt = Date.now();

    if (loginAttempts[attemptKey].count > 5) {
      console.warn(`[SECURITY ALERT] AI Layer flagged suspicious login attempts for ${officerId} (${department})`);
      return res.status(403).json({ message: 'Suspicious activity detected. Account locked temporarily.' });
    }

    // Read mock DB
    const usersDataPath = path.join(__dirname, '../data/users.json');
    const users = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));

    // Find user
    const user = users.find(u => u.department === department && u.officerId === officerId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset attempts on success
    loginAttempts[attemptKey].count = 0;

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, department: user.department, name: user.name },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        department: user.department,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const verifyToken = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'fallback-secret');
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};
