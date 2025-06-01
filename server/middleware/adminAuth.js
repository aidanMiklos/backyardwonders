const adminAuth = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin or Super Admin role required.' });
  }
};

const superadminAuth = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Access denied. Superadmin privileges required.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'Error checking superadmin privileges' });
  }
};

module.exports = { adminAuth, superadminAuth }; 