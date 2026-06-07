const authService = require("../services/auth.service");

const buildErrorResponse = (error) => ({
  error: {
    code: error.code || "AUTH_UNKNOWN_ERROR",
    message: error.message || "Authentication request failed.",
  },
});

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: {
        code: "AUTH_INVALID_PAYLOAD",
        message: "Email and password are required.",
      },
    });
  }

  try {
    const result = await authService.login({ email, password });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.status || 500).json(buildErrorResponse(error));
  }
};

const logout = async (req, res) => {
  try {
    await authService.logout(req.body.refreshToken);
    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    return res.status(error.status || 500).json(buildErrorResponse(error));
  }
};

const refresh = async (req, res) => {
  try {
    const result = await authService.refresh(req.body.refreshToken);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(error.status || 500).json(buildErrorResponse(error));
  }
};

const me = async (req, res) => res.status(200).json({ user: req.user });

module.exports = {
  login,
  logout,
  me,
  refresh,
};
