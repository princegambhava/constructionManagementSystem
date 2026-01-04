const express = require('express');
const { body } = require('express-validator');
const { registerUser, loginUser, getCurrentUser } = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

// Admin only register
router.post(
  '/register',
  protect,
  authorizeRoles('admin'),
  validate([
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password min length 6'),
    body('phone').notEmpty().withMessage('Phone is required'),
  ]),
  registerUser
);

// Public login
router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  loginUser
);

// Current user
router.get('/me', protect, getCurrentUser);

module.exports = router;
