const { queryWagers } = require("./services");

async function getWagers(req, res) {
  try {
    const result = await queryWagers(req.query);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { getWagers };
