import bcrypt from "bcrypt";
import User from "./user.model.js";
import jwt from "jsonwebtoken";
import { isValidImageURL, getDefaultAvatar } from "../utils/file.utils.js";

class UserService {
  static async signup({ name, email, password, userPhoto }) {
   
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters long.");
    }

    if (!email || !/.+\@.+\..+/.test(email)) {
      throw new Error("Invalid email format.");
    }

    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email is already in use.");
    }

  
    const hashedPassword = await bcrypt.hash(password, 10);

   
    let finalPhoto = userPhoto;
    if (!userPhoto) {
      finalPhoto = getDefaultAvatar(name); // Generate avatar using Iran Liara API
    } else if (!isValidImageURL(userPhoto)) {
      throw new Error("Invalid photo URL. Must be a .jpg, .jpeg, or .png link.");
    }

    
    const newUser = new User({ name, email, password: hashedPassword, userPhoto: finalPhoto });
    return await newUser.save();
  }

  static async login(email, password) {
    // Basic validation
    if (!email || !/.+\@.+\..+/.test(email)) {
      throw new Error("Invalid email format.");
    }
    if (!password) {
      throw new Error("Password is required.");
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) throw new Error("Email not found");

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Password is incorrect");

   
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        userPhoto: user.userPhoto, 
        email: user.email
      }
    };
  }

  static async getCount() {
    try {
      return await User.countDocuments();
    }
    catch (err) {
      throw new Error("Unable to find User count");
    }
  }

  static async findById(id) {
    try {
      const user = await User.findById(id);

      if (!user) {
        return null; 
      }

      return user;
    }
    catch (err) {
      throw new Error("Database error");
    }
  }

  static async findByEmail(email) {
    try {
      const user = await User.findOne({ email }).select("-password");
      return user;
    }
    catch (err) {
      throw new Error("Database error");
    }
  }

  static async searchUsers(searchTerm) {
    try {
      const users = await User.find({
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      }).select("-password").limit(10);
      return users;
    }
    catch (err) {
      throw new Error("Database error");
    }
  }
}

export default UserService;
