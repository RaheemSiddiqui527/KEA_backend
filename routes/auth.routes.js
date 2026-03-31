import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  adminRegister,
  adminLogin
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
// Public — pehla admin (secret key se protected, JWT nahi chahiye)
router.post("/admin/register", adminRegister);

router.post("/admin/login", adminLogin);     // admin-only login (role-checked)


export default router;
