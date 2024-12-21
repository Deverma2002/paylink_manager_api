const jwt=require("jsonwebtoken")
JWT_SECRET="679992956"
const tokenBlacklist = new Set();

const authenticateToken = (req, res, next) => {
    const authorization = req.headers.authorization
  
    if (!authorization) return res.status(401).json({ error: 'Token Not Found' });
  
    
    const token = req.headers.authorization.split(' ')[1];
    if (tokenBlacklist.has(token)) {
      return res.status(401).send("Token is blacklisted");
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
        console.error(err);
        res.status(401).json({ error: 'Invalid token' });  // Forbidden if the token is invalid
    }
  };

  // const authorizeRole = async (requiredRole) => {
  //   return async (req, res, next) => {
  //     try {
  //       // Ensure the user is authenticated first
  //       if (!req.user) {
  //         return res.status(401).json({ error: 'Unauthorized: No user data found' });
  //       }
  
  //       // Check if the user's role matches the required role
  //       if (req.user.role !== requiredRole) {
  //         return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
  //       }
  
  //       next(); // Proceed to the next middleware or route handler
  //     } catch (err) {
  //       console.error(err);
  //       res.status(500).json({ message: 'Internal server error' });
  //     }
  //   };
  // };

  module.exports = {authenticateToken};