require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt           = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {

  const [roleAdmin, roleManager, roleStaff] = await Promise.all([
    prisma.role.upsert({
      where:  { name: 'Admin' },
      update: {},
      create: { name: 'Admin', description: 'Administrator sistem dengan akses penuh' },
    }),
    prisma.role.upsert({
      where:  { name: 'Manager' },
      update: {},
      create: { name: 'Manager', description: 'Manager dengan akses menu 1 dan menu 2' },
    }),
    prisma.role.upsert({
      where:  { name: 'Staff' },
      update: {},
      create: { name: 'Staff', description: 'Staff dengan akses menu 3 saja' },
    }),
  ]);
  console.log('Roles created');

  const password = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where:  { username: 'admin' },
    update: {},
    create: { username: 'admin', password, fullName: 'Administrator', email: 'admin@example.com' },
  });

  const budi = await prisma.user.upsert({
    where:  { username: 'budi' },
    update: {},
    create: { username: 'budi', password, fullName: 'Budi Santoso', email: 'budi@example.com' },
  });

  const siti = await prisma.user.upsert({
    where:  { username: 'siti' },
    update: {},
    create: { username: 'siti', password, fullName: 'Siti Rahayu', email: 'siti@example.com' },
  });

  await prisma.userRole.upsert({
    where:  { userId_roleId: { userId: admin.id, roleId: roleAdmin.id } },
    update: {},
    create: { userId: admin.id, roleId: roleAdmin.id },
  });
  await prisma.userRole.upsert({
    where:  { userId_roleId: { userId: budi.id, roleId: roleManager.id } },
    update: {},
    create: { userId: budi.id, roleId: roleManager.id },
  });
  await prisma.userRole.upsert({
    where:  { userId_roleId: { userId: budi.id, roleId: roleStaff.id } },
    update: {},
    create: { userId: budi.id, roleId: roleStaff.id },
  });
  await prisma.userRole.upsert({
    where:  { userId_roleId: { userId: siti.id, roleId: roleStaff.id } },
    update: {},
    create: { userId: siti.id, roleId: roleStaff.id },
  });
  console.log('Users created');

  await prisma.roleMenu.deleteMany({});
  await prisma.menu.deleteMany({});

  const m1 = await prisma.menu.create({ data: { name: 'Menu 1', orderIndex: 1 } });
  const m2 = await prisma.menu.create({ data: { name: 'Menu 2', orderIndex: 2 } });
  const m3 = await prisma.menu.create({ data: { name: 'Menu 3', orderIndex: 3 } });

  const m1_1 = await prisma.menu.create({ data: { name: 'Menu 1.1', orderIndex: 1, parentId: m1.id } });
  const m1_2 = await prisma.menu.create({ data: { name: 'Menu 1.2', orderIndex: 2, parentId: m1.id } });
  const m1_3 = await prisma.menu.create({ data: { name: 'Menu 1.3', orderIndex: 3, parentId: m1.id } });

  await prisma.menu.create({ data: { name: 'Menu 1.2.1', orderIndex: 1, parentId: m1_2.id } });
  await prisma.menu.create({ data: { name: 'Menu 1.2.2', orderIndex: 2, parentId: m1_2.id } });
  await prisma.menu.create({ data: { name: 'Menu 1.3.1', orderIndex: 1, parentId: m1_3.id } });

  const m2_1 = await prisma.menu.create({ data: { name: 'Menu 2.1', orderIndex: 1, parentId: m2.id } });
  const m2_2 = await prisma.menu.create({ data: { name: 'Menu 2.2', orderIndex: 2, parentId: m2.id } });
  const m2_3 = await prisma.menu.create({ data: { name: 'Menu 2.3', orderIndex: 3, parentId: m2.id } });

  await prisma.menu.create({ data: { name: 'Menu 2.2.1', orderIndex: 1, parentId: m2_2.id } });
  const m2_2_2 = await prisma.menu.create({ data: { name: 'Menu 2.2.2', orderIndex: 2, parentId: m2_2.id } });
  await prisma.menu.create({ data: { name: 'Menu 2.2.3', orderIndex: 3, parentId: m2_2.id } });

  await prisma.menu.create({ data: { name: 'Menu 2.2.2.1', orderIndex: 1, parentId: m2_2_2.id } });
  await prisma.menu.create({ data: { name: 'Menu 2.2.2.2', orderIndex: 2, parentId: m2_2_2.id } });

  await prisma.menu.create({ data: { name: 'Menu 3.1', orderIndex: 1, parentId: m3.id } });
  await prisma.menu.create({ data: { name: 'Menu 3.2', orderIndex: 2, parentId: m3.id } });

  console.log('Menus created (17 total)');

  const allMenus = await prisma.menu.findMany({ select: { id: true } });
  const allIds   = allMenus.map((m) => m.id);

  await prisma.roleMenu.createMany({
    data: allIds.map((menuId) => ({ roleId: roleAdmin.id, menuId })),
    skipDuplicates: true,
  });

  const managerMenus = await prisma.menu.findMany({
    where: { name: { in: ['Menu 1', 'Menu 2', 'Menu 1.1', 'Menu 1.2', 'Menu 1.2.1', 'Menu 1.2.2', 'Menu 1.3', 'Menu 1.3.1',
                           'Menu 2.1', 'Menu 2.2', 'Menu 2.2.1', 'Menu 2.2.2', 'Menu 2.2.2.1', 'Menu 2.2.2.2', 'Menu 2.2.3', 'Menu 2.3'] } },
    select: { id: true },
  });
  await prisma.roleMenu.createMany({
    data: managerMenus.map((m) => ({ roleId: roleManager.id, menuId: m.id })),
    skipDuplicates: true,
  });

  const staffMenus = await prisma.menu.findMany({
    where: { name: { in: ['Menu 3', 'Menu 3.1', 'Menu 3.2'] } },
    select: { id: true },
  });
  await prisma.roleMenu.createMany({
    data: staffMenus.map((m) => ({ roleId: roleStaff.id, menuId: m.id })),
    skipDuplicates: true,
  });

  console.log('Role-Menu access configured');
  console.log('');
  console.log('Sample Accounts:');
  console.log('  username: admin    | password: password123 | role: Admin');
  console.log('  username: budi     | password: password123 | role: Manager + Staff (dual role)');
  console.log('  username: siti     | password: password123 | role: Staff');
  console.log('Seeding done!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
