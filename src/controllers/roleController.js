const prisma = require('../prismaClient');

// GET /api/roles
const getAll = async (_req, res, next) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { userRoles: true, roleMenus: true } } },
    });
    res.json({ success: true, data: roles });
  } catch (err) { next(err); }
};

// GET /api/roles/:id
const getById = async (req, res, next) => {
  try {
    const role = await prisma.role.findUniqueOrThrow({
      where: { id: Number(req.params.id) },
      include: {
        userRoles: { include: { user: { select: { id: true, username: true, fullName: true } } } },
        roleMenus: { include: { menu: true } },
      },
    });
    res.json({ success: true, data: role });
  } catch (err) { next(err); }
};

// POST /api/roles
const create = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name wajib diisi' });
    const role = await prisma.role.create({
      data: { name, description, isActive: isActive ?? true },
    });
    res.status(201).json({ success: true, message: 'Role berhasil dibuat', data: role });
  } catch (err) { next(err); }
};

// PUT /api/roles/:id
const update = async (req, res, next) => {
  try {
    const { name, description, isActive } = req.body;
    const data = { name, description, isActive };
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
    const role = await prisma.role.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json({ success: true, message: 'Role berhasil diupdate', data: role });
  } catch (err) { next(err); }
};

// DELETE /api/roles/:id
const remove = async (req, res, next) => {
  try {
    await prisma.role.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: 'Role berhasil dihapus' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
