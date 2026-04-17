require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes     = require('./routes/auth');
const userRoutes     = require('./routes/users');
const roleRoutes     = require('./routes/roles');
const menuRoutes     = require('./routes/menus');
const roleMenuRoutes = require('./routes/roleMenus');
const errorHandler   = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth',       authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/roles',      roleRoutes);
app.use('/api/menus',      menuRoutes);
app.use('/api/role-menus', roleMenuRoutes);

app.get('/', (_req, res) => {
  res.json({ message: 'API is running', version: '1.0.0' });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
