const express = require('express');
const router  = express.Router();

const ctrl             = require('../controllers/roleMenuController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/:roleId',              ctrl.getMenusByRole);
router.post('/',                    ctrl.assign);
router.post('/bulk',                ctrl.assignBulk);
router.delete('/:roleId/:menuId',   ctrl.remove);

module.exports = router;
