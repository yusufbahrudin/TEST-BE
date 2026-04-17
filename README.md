# TEST-BE

REST API TEST-BE untuk sistem login dan manajemen akses menu. Dibangun dengan Node.js + Express, database PostgreSQL via Prisma ORM, autentikasi JWT.

---
Figma = ```https://www.figma.com/design/FRyBhW92Sa6IydaAfUtEbp/Untitled?node-id=0-1&p=f&t=SeVPnSHUB4ynaXWj-0``

## VS Code Extensions

```bash
code --install-extension Prisma.prisma
code --install-extension hediet.vscode-drawio
```

---

## Struktur Database

- `users` — data karyawan
- `roles` — jabatan/role yang bisa dimiliki karyawan
- `user_roles` — satu karyawan bisa punya lebih dari satu role
- `menus` — item menu, bisa nested via `parent_id`
- `role_menus` — mapping role ke menu mana yang boleh diakses

---

## Setup

```bash
git clone <repo-url>
cd test-be
npm install
```

```sql
CREATE DATABASE test_be_db;
```

Kemudian jalankan migration dan seed:

```bash
npm run db:migrate
npm run db:generate
npm run db:seed
npm run dev
```
---

## Struktur Menu (Seed Data)

```
Menu 1
  ├── Menu 1.1
  ├── Menu 1.2
  │   ├── Menu 1.2.1
  │   └── Menu 1.2.2
  └── Menu 1.3
      └── Menu 1.3.1
Menu 2
  ├── Menu 2.1
  ├── Menu 2.2
  │   ├── Menu 2.2.1
  │   ├── Menu 2.2.2
  │   │   ├── Menu 2.2.2.1
  │   │   └── Menu 2.2.2.2
  │   └── Menu 2.2.3
  └── Menu 2.3
Menu 3
  ├── Menu 3.1
  └── Menu 3.2
```
---

## Scripts

```bash
npm run dev         
npm run db:migrate 
npm run db:generate  
npm run db:seed      
npm run db:studio    
npm run db:reset     
```
---