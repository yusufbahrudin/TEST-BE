const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const prisma   = require('../prismaClient');

// ─── Helper: bangun tree menu dari flat list ──────────────────
function buildMenuTree(menus, parentId = null) {
  return menus
    .filter((m) => m.menu.parentId === parentId)
    .sort((a, b) => a.menu.orderIndex - b.menu.orderIndex)
    .map((m) => ({
      id:       m.menu.id,
      name:     m.menu.name,
      children: buildMenuTree(menus, m.menu.id),
    }));
}

// ─── Helper: generate JWT ─────────────────────────────────────
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

// ─────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { username, password }
//
// Response A (single role)  → langsung kembalikan token + menus
// Response B (multiple roles) → kembalikan list role, minta pilih
// ─────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username dan password wajib diisi' });
    }

    // 1. Cari user aktif beserta role-nya
    const user = await prisma.user.findFirst({
      where:   { username, isActive: true },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    // 2. Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Username atau password salah' });
    }

    const activeRoles = user.userRoles.filter((ur) => ur.role.isActive);

    if (activeRoles.length === 0) {
      return res.status(403).json({ success: false, message: 'Pengguna tidak memiliki role aktif' });
    }

    // 3a. Karyawan punya LEBIH DARI 1 role → minta pilih role
    if (activeRoles.length > 1) {
      return res.status(200).json({
        success:        true,
        requireRoleSelection: true,
        message:        'Pilih role yang ingin digunakan',
        userId:         user.id,
        username:       user.username,
        fullName:       user.fullName,
        roles: activeRoles.map((ur) => ({
          roleId:      ur.role.id,
          roleName:    ur.role.name,
          description: ur.role.description,
        })),
      });
    }

    // 3b. Karyawan punya TEPAT 1 role → langsung beri token
    const role = activeRoles[0].role;
    const token = generateToken({
      userId:   user.id,
      username: user.username,
      roleId:   role.id,
      roleName: role.name,
    });

    // Ambil menus untuk role
    const roleMenus = await prisma.roleMenu.findMany({
      where:   { roleId: role.id },
      include: { menu: true },
    });

    return res.status(200).json({
      success:  true,
      message:  'Login berhasil',
      token,
      user: {
        id:       user.id,
        username: user.username,
        fullName: user.fullName,
        email:    user.email,
        role:     { id: role.id, name: role.name },
      },
      menus: buildMenuTree(roleMenus),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/select-role
// Body: { userId, roleId }
// Dipanggil setelah login ketika user punya multiple role
// ─────────────────────────────────────────────────────────────
const selectRole = async (req, res, next) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({ success: false, message: 'userId dan roleId wajib diisi' });
    }

    // Pastikan user memang punya role tersebut
    const userRole = await prisma.userRole.findFirst({
      where: {
        userId: Number(userId),
        roleId: Number(roleId),
        user:   { isActive: true },
        role:   { isActive: true },
      },
      include: {
        user: true,
        role: true,
      },
    });

    if (!userRole) {
      return res.status(403).json({ success: false, message: 'Role tidak valid untuk pengguna ini' });
    }

    const { user, role } = userRole;

    const token = generateToken({
      userId:   user.id,
      username: user.username,
      roleId:   role.id,
      roleName: role.name,
    });

    // Ambil menus untuk role yang dipilih
    const roleMenus = await prisma.roleMenu.findMany({
      where:   { roleId: role.id },
      include: { menu: true },
    });

    return res.status(200).json({
      success: true,
      message: 'Role dipilih, login berhasil',
      token,
      user: {
        id:       user.id,
        username: user.username,
        fullName: user.fullName,
        email:    user.email,
        role:     { id: role.id, name: role.name },
      },
      menus: buildMenuTree(roleMenus),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// GET /api/auth/me  (protected)
// Kembalikan data user + menus berdasarkan token
// ─────────────────────────────────────────────────────────────
const me = async (req, res, next) => {
  try {
    const { userId, roleId } = req.user;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan' });
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });

    const roleMenus = await prisma.roleMenu.findMany({
      where:   { roleId },
      include: { menu: true },
    });

    return res.status(200).json({
      success: true,
      user: {
        id:       user.id,
        username: user.username,
        fullName: user.fullName,
        email:    user.email,
        role:     role ? { id: role.id, name: role.name } : null,
      },
      menus: buildMenuTree(roleMenus),
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /api/auth/register
// Body: { username, password, fullName, email }
// Membuat akun baru tanpa role (role di-assign oleh Admin setelahnya)
// ─────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { username, password, fullName, email } = req.body;

    if (!username || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: 'username, password, dan fullName wajib diisi',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter',
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, password: hashed, fullName, email: email ?? null },
    });

    const { password: _, ...safe } = user;

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. Silakan hubungi Admin untuk mendapatkan akses role.',
      data: safe,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, selectRole, me, register };
