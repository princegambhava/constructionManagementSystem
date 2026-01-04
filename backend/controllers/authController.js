const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    { expiresIn: '7d' }
  );

// ✅ PUBLIC SIGNUP (NEW)
const signupUser = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, phone, and password' });
  }

  // Only allow specific roles for public signup
  const allowedRoles = ['worker', 'contractor', 'engineer'];
  const userRole = role && allowedRoles.includes(role) ? role : 'worker';

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const user = await User.create({ 
    name, 
    email, 
    password, 
    role: userRole, 
    phone 
  });

  const token = signToken(user);

  return res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
  });
};

// Admin only registration
const registerUser = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: 'Please provide name, email, phone, and password' });
  }

  if (role && !['admin', 'engineer', 'contractor', 'worker'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const user = await User.create({ name, email, password, role, phone });

  return res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
  });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signToken(user);
  return res.status(200).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
  });
};

const getCurrentUser = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  return res.status(200).json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    phone: req.user.phone,
  });
};

module.exports = {
  signupUser: asyncHandler(signupUser), // ✅ NEW EXPORT
  registerUser: asyncHandler(registerUser),
  loginUser: asyncHandler(loginUser),
  getCurrentUser: asyncHandler(getCurrentUser),
};