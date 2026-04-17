const express = require('express');
const router  = express.Router();

const { login, selectRole, me, register } = require('../controllers/authController');
const { authenticate }           = require('../middleware/auth');

router.post('/register',    register);
router.post('/login',       login);
router.post('/select-role', selectRole);
router.get('/me',           authenticate, me);

module.exports = router;
