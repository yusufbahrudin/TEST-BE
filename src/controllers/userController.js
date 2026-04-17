const bcrypt = require('bcryptjs');
const prisma  = require('../prismaClient');

const getAll = async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, username: true, fullName: true,
        email: true, isActive: true, createdAt: true,
        userRoles: { include: { role: { select: { id: true, name: true } } } },
      },
      orderBy: { id: 'asc' },
    });
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: Number(req.params.id) },
      select: {
        id: true, username: true, fullName: true,
        email: true, isActive: true, createdAt: true,
        userRoles: { include: { role: true } },
      },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const { username, password, fullName, email, isActive } = req.body;
    if (!username || !password || !fullName) {
      return res.status(400).json({ success: false, message: 'username, password, dan fullName wajib diisi' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashed, fullName, email, isActive: isActive ?? true },
    });
    const { password: _, ...safe } = user;
    res.status(201).json({ success: true, message: 'User berhasil dibuat', data: safe });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const { username, password, fullName, email, isActive } = req.body;
    const data = { username, fullName, email, isActive };
    if (password) data.password = await bcrypt.hash(password, 10);
    // Hapus key undefined
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data,
    });
    const { password: _, ...safe } = user;
    res.json({ success: true, message: 'User berhasil diupdate', data: safe });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (err) { next(err); }
};

const assignRole = async (req, res, next) => {
  try {
    const { roleId } = req.body;
    if (!roleId) return res.status(400).json({ success: false, message: 'roleId wajib diisi' });
    const userRole = await prisma.userRole.create({
      data: { userId: Number(req.params.id), roleId: Number(roleId) },
      include: { role: true },
    });
    res.status(201).json({ success: true, message: 'Role berhasil ditambahkan ke user', data: userRole });
  } catch (err) { next(err); }
};

const removeRole = async (req, res, next) => {
  try {
    await prisma.userRole.deleteMany({
      where: { userId: Number(req.params.id), roleId: Number(req.params.roleId) },
    });
    res.json({ success: true, message: 'Role berhasil dilepas dari user' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove, assignRole, removeRole };
