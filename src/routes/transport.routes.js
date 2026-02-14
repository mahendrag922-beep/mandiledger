const express = require("express");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const {
  addTransport,
  getTransports,
  getTransportDetails,
  updateTransport,
  deleteTransport,
  addDriverToTransport,
  } = require("../controllers/transport.controller");

const router = express.Router();

router.post("/", auth, role("trader", "munim"), addTransport);
router.get("/", auth, role("trader", "munim"), getTransports);
router.get("/:id", auth, role("trader", "munim"), getTransportDetails,);
router.put("/:id", auth, role("trader", "munim"), updateTransport);
router.delete("/:id", auth, role("trader"), deleteTransport);
router.post("/:id/driver", auth,role("trader", "munim"), addDriverToTransport);

module.exports = router;
