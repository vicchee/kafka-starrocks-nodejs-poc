const express = require("express");
const { getWagers } = require("./controllers");

const router = express.Router();

router.get("/wagers/:mode", getWagers);

module.exports = router;
