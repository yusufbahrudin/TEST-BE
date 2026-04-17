const prisma = require('../prismaClient');

// ─── Helper: bangun nested tree dari flat list ──────────────
function buildTree(menus, parentId = null) {
  return menus
    .filter((m) => m.parentId === parentId)
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((m) => ({
      id:         m.id,
      name:       m.name,
      orderIndex: m.orderIndex,
      isActive:   m.isActive,
      parentId:   m.parentId,
      children:   buildTree(menus, m.id),
    }));
}

// GET /api/menus?flat=true  → flat list, default: tree
const getAll = async (req, res, next) => {
  try {
    const menus = await prisma.menu.findMany({ orderBy: [{ parentId: 'asc' }, { orderIndex: 'asc' }] });
    const flat  = req.query.flat === 'true';
    res.json({ success: true, data: flat ? menus : buildTree(menus) });
  } catch (err) { next(err); }
};

// GET /api/menus/:id
const getById = async (req, res, next) => {
  try {
    const menu = await prisma.menu.findUniqueOrThrow({
      where:   { id: Number(req.params.id) },
      include: { children: true, parent: true },
    });
    res.json({ success: true, data: menu });
  } catch (err) { next(err); }
};

// POST /api/menus
const create = async (req, res, next) => {
  try {
    const { name, orderIndex, parentId, isActive } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name wajib diisi' });

    // Validasi parentId jika diisi
    if (parentId) {
      const parent = await prisma.menu.findUnique({ where: { id: Number(parentId) } });
      if (!parent) return res.status(400).json({ success: false, message: 'Parent menu tidak ditemukan' });
    }

    const menu = await prisma.menu.create({
      data: {
        name,
        orderIndex: orderIndex ?? 0,
        parentId:   parentId   ? Number(parentId) : null,
        isActive:   isActive   ?? true,
      },
    });
    res.status(201).json({ success: true, message: 'Menu berhasil dibuat', data: menu });
  } catch (err) { next(err); }
};

// PUT /api/menus/:id
const update = async (req, res, next) => {
  try {
    const { name, orderIndex, parentId, isActive } = req.body;

    // Cegah menu jadi parent dirinya sendiri
    if (parentId && Number(parentId) === Number(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Menu tidak bisa menjadi parent dirinya sendiri' });
    }

    const data = { name, orderIndex, isActive };
    if (parentId !== undefined) data.parentId = parentId ? Number(parentId) : null;
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);

    const menu = await prisma.menu.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json({ success: true, message: 'Menu berhasil diupdate', data: menu });
  } catch (err) { next(err); }
};

// DELETE /api/menus/:id
const remove = async (req, res, next) => {
  try {
    // Cek apakah punya children
    const childCount = await prisma.menu.count({ where: { parentId: Number(req.params.id) } });
    if (childCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak bisa menghapus menu yang masih memiliki sub-menu. Hapus sub-menu terlebih dahulu.',
      });
    }
    await prisma.menu.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: 'Menu berhasil dihapus' });
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
