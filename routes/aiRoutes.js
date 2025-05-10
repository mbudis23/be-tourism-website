const express = require('express')
const router = express.Router();
const aiController = require('../controllers/aiController')

router.post('/searchAI', aiController.searchAI)

module.exports = router;