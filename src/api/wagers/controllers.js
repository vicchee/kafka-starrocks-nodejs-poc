const { queryWagers, queryWagersCombined } = require("./services");

async function getWagers(req, res) {
  try {
    const mode = req.params.mode;
    let result;

    switch (mode) {
      case "2-query": {
        result = await queryWagers(req.query);
        break;
      }
      case "1-query":
      default: {
        result = await queryWagersCombined(req.query);
        break;
      }
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
}

module.exports = { getWagers };
