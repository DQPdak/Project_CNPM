const express = require("express");
const authController = require("../modules/auth/controllers/auth.controller");
const { requireAuth } = require("../modules/auth/middlewares/requireAuth");

const router = express.Router();

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);
router.get("/me", requireAuth, authController.me);

module.exports = router;
