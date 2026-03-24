const express = require("express");
const router = express.Router();
const controller = require("../controllers/employee.controller");

router.post("/employee", controller.addEmployee);
router.get("/employee", controller.getEmployees);
router.put("/employee/:id", controller.updateEmployee);
router.delete("/employee/:id", controller.deleteEmployee);

router.post("/salary", controller.addSalary);
router.get("/salary", controller.getSalary);

module.exports = router;