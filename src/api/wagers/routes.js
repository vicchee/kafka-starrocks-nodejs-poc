const express = require("express");
const { getWagers } = require("./controllers");

const router = express.Router();

router.get("/wagers", getWagers);

module.exports = router;
