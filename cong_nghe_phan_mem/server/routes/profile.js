const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

// GET thông tin cá nhân
router.get("/", auth, async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ["id", "username", "name", "gender", "dob", "email", "phone", "role"]
  });
  if (!user) return res.status(404).json({ message: "Không tìm thấy người dùng" });
  res.json(user);
});

// ✅ PUT - Cập nhật thông tin cá nhân
router.put("/", auth, async (req, res) => {
  const { name, gender, dob, email, phone } = req.body;
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: "Không tìm thấy" });

    await user.update({ name, gender, dob, email, phone });
    res.json({ message: "Cập nhật thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server" });
  }
});

module.exports = router;
