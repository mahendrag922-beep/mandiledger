const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const AppError = require("../utils/AppError");

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Email and password required", 400));
  }

  const [[user]] = await pool.query(
    "SELECT id, role FROM users WHERE email=? AND password=?",
    [email, password]
  );

  if (!user) {
    return next(new AppError("Invalid email or password", 401));
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    status: "success",
    token,
    role: user.role,
  });
};
