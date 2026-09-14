const express = require('express');
const router = express.Router();
const { Insert, GetAll, Dismiss, Delete } = require('../Controller/alertController');

router.post('/', Insert);
router.get('/', GetAll);
router.put('/:id/dismiss', Dismiss);
router.delete('/:id', Delete);

module.exports = router;
