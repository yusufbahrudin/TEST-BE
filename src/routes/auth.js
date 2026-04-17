const express = require('express');
const router  = express.Router();

const { login, selectRole, me, register } = require('../controllers/authController');
const { authenticate }           = require('../middleware/auth');

// POST /api/auth/register      → Daftar akun baru (publik)
router.post('/register',    register);

// POST /api/auth/login         → Login dengan username & password
router.post('/login',       login);

// POST /api/auth/select-role   → Pilih role (untuk user dengan jabatan ganda)
router.post('/select-role', selectRole);

// GET  /api/auth/me            → Ambil data diri + menus (butuh token)
router.get('/me',           authenticate, me);

module.exports = router;
