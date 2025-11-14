import jwt from 'jsonwebtoken';
import User from '../features/user/user.model.js';

const jwtAuth = async (req, res, next) => {
   
    const token = req.headers['authorization']?.split(" ")[1];

    
    if (!token) {
        return res.status(401).json('Unauthorized');
    }
    
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        req.user = user;
    }
    catch(err){
        return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    next();
}

export default jwtAuth;