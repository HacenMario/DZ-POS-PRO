// backend/routes/sessions.js
const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const authMiddleware = require('../middleware/auth');
const roleMiddleware = require('../middleware/role');

router.post('/open', authMiddleware, sessionController.openSession);
router.get('/current', authMiddleware, sessionController.getCurrentSession);
router.put('/close', authMiddleware, sessionController.closeSession);
router.get('/history', authMiddleware, roleMiddleware('admin', 'manager'), sessionController.getSessionsHistory);

module.exports = router;