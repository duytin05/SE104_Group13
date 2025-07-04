const express = require("express");
const router = express.Router();
const Employee = require("../models/Employee");

// GET all
router.get("/", async (req, res) => {
  const employees = await Employee.findAll();
  res.json(employees);
});

// POST
router.post("/", async (req, res) => {
  const { name, position, department } = req.body;
  try {
    const emp = await Employee.create({ name, position, department });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi thêm nhân viên" });
  }
});

// PUT
router.put("/:id", async (req, res) => {
  const { name, position, department } = req.body;
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    await emp.update({ name, position, department });
    res.json(emp);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi cập nhật" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const emp = await Employee.findByPk(req.params.id);
    if (!emp) return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    await emp.destroy();
    res.json({ message: "Đã xóa" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi xóa" });
  }
});

module.exports = router;