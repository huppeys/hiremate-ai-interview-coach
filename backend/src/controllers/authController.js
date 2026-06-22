const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');

// Temporary in-memory store (replace with Firestore later)
const users = [];
const refreshTokens = new Set();
const resetTokens = new Map(); // token -> { email, expiresAt }

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const generateAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

// POST /auth/register
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password } = req.body;

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = { id: users.length + 1, name, email, password: hashedPassword };
    users.push(newUser);

    const payload = { id: newUser.id, email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    refreshTokens.add(refreshToken);

    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// POST /auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const payload = { id: user.id, email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    refreshTokens.add(refreshToken);

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// POST /auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      // Return 200 to avoid leaking whether an email is registered
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
    resetTokens.set(token, { email, expiresAt });

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

    try {
      await transporter.sendMail({
        from: `"HireMate" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Reset your HireMate password',
        html: `
          <p>Hi ${user.name},</p>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>If you didn't request this, ignore this email.</p>
        `,
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
    }

    res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// POST /auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const record = resetTokens.get(token);
    if (!record) {
      return res.status(400).json({ message: 'Invalid or already used reset token' });
    }

    if (Date.now() > record.expiresAt) {
      resetTokens.delete(token);
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters, include one uppercase letter and one number',
      });
    }

    const user = users.find(u => u.email === record.email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = await bcrypt.hash(password, 12);
    resetTokens.delete(token);

    res.status(200).json({ message: 'Password reset successfully. Please log in.' });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// POST /auth/logout
const logout = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }

  if (!refreshTokens.has(refreshToken)) {
    return res.status(400).json({ message: 'Invalid refresh token' });
  }

  refreshTokens.delete(refreshToken);
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = { register, login, logout, forgotPassword, resetPassword, refreshTokens, resetTokens };
