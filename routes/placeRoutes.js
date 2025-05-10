const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');
const { insertTourismPlaces } = require('../controllers/placeController');

// router.get('//insertTourismPlaces', placeController.insertTourismPlaces);
router.get('/get-pop-dest', placeController.getPopularDestination)
router.get('/search/:keyword/:limit/:offset', placeController.searchTourismPlaces);

module.exports = router;