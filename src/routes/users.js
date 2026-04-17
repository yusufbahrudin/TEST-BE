const express = require('express');
const router  = express.Router();

const ctrl           = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate); 

router.get('/',                  ctrl.getAll);
router.get('/:id',               ctrl.getById);
router.post('/',                 ctrl.create);
router.put('/:id',               ctrl.update);
router.delete('/:id',            ctrl.remove);
router.post('/:id/roles',        ctrl.assignRole);
router.delete('/:id/roles/:roleId', ctrl.removeRole);

module.exports = router;
