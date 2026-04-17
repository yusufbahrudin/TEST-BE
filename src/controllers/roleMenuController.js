const prisma = require('../prismaClient');

function buildMenuTree(roleMenus, parentId = null) {
  return roleMenus
    .filter((rm) => rm.menu.parentId === parentId)
    .sort((a, b) => a.menu.orderIndex - b.menu.orderIndex)
    .map((rm) => ({
      id:       rm.menu.id,
      name:     rm.menu.name,
      children: buildMenuTree(roleMenus, rm.menu.id),
    }));
}

const getMenusByRole = async (req, res, next) => {
  try {
    const roleId = Number(req.params.roleId);

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return res.status(404).json({ success: false, message: 'Role tidak ditemukan' });

    const roleMenus = await prisma.roleMenu.findMany({
      where:   { roleId },
      include: { menu: true },
    });

    res.json({
      success: true,
      data: {
        role:  { id: role.id, name: role.name },
        menus: buildMenuTree(roleMenus),
      },
    });
  } catch (err) { next(err); }
};

const assign = async (req, res, next) => {
  try {
    const { roleId, menuId } = req.body;
    if (!roleId || !menuId) {
      return res.status(400).json({ success: false, message: 'roleId dan menuId wajib diisi' });
    }
    const record = await prisma.roleMenu.create({
      data:    { roleId: Number(roleId), menuId: Number(menuId) },
      include: { role: true, menu: true },
    });
    res.status(201).json({ success: true, message: 'Menu berhasil di-assign ke role', data: record });
  } catch (err) { next(err); }
};

const assignBulk = async (req, res, next) => {
  try {
    const { roleId, menuIds } = req.body;
    if (!roleId || !Array.isArray(menuIds) || menuIds.length === 0) {
      return res.status(400).json({ success: false, message: 'roleId dan menuIds (array) wajib diisi' });
    }

    await prisma.roleMenu.deleteMany({ where: { roleId: Number(roleId) } });

    await prisma.roleMenu.createMany({
      data: menuIds.map((menuId) => ({ roleId: Number(roleId), menuId: Number(menuId) })),
      skipDuplicates: true,
    });

    res.json({
      success: true,
      message: `${menuIds.length} menu berhasil di-assign ke role`,
    });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await prisma.roleMenu.deleteMany({
      where: { roleId: Number(req.params.roleId), menuId: Number(req.params.menuId) },
    });
    res.json({ success: true, message: 'Akses menu berhasil dihapus dari role' });
  } catch (err) { next(err); }
};

module.exports = { getMenusByRole, assign, assignBulk, remove };
