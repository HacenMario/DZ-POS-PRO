const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.get('/', authMiddleware, roleMiddleware('admin'), userController.getUsers);
router.get('/:id', authMiddleware, roleMiddleware('admin'), userController.getUserById);
router.put('/:id', authMiddleware, roleMiddleware('admin'), userController.updateUser);
router.delete('/:id', authMiddleware, roleMiddleware('admin'), userController.deleteUser);

module.exports = router;