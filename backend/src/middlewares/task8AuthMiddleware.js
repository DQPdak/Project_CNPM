const checkTask8Role = (allowedRoles) => {
    return (req, res, next) => {
        // Lấy thông tin role và id giả lập gửi lên từ Header để test độc lập công năng
        const userRole = req.headers['x-user-role']; 
        const userId = req.headers['x-user-id'];

        if (!userRole) {
            return res.status(401).json({ error: "Unauthorized. Vui lòng truyền header x-user-role để check phân quyền." });
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ error: "Forbidden. Tài khoản của bạn không có quyền thực hiện chức năng này." });
        }

        req.user = { role: userRole, id: userId };
        next();
    };
};

module.exports = { checkTask8Role };