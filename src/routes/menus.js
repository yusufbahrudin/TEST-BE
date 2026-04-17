const express = require('express');
const router  = express.Router();

const ctrl             = require('../controllers/menuController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/',       ctrl.getAll);   
router.get('/:id',    ctrl.getById);
router.post('/',      ctrl.create);
router.put('/:id',    ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;
