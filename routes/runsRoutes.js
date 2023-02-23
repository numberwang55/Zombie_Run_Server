const {
  postRun,
  updateRun,
  getRunsByUser,
  deleteRun,
} = require("../controllers/controllers");
const express = require("express");
const router = express.Router();

// runs routes
router.get("/:user_id", getRunsByUser);

router.post("/", postRun);

router.patch("/update_run", updateRun);

router.delete("/run/:run_id", deleteRun);

module.exports = router;