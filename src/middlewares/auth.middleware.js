function isAuthenticated(req, res, next) {
    if (!req.session || !req.session.userId || !req.session.email || !req.session.username) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  }
  module.exports = isAuthenticated;