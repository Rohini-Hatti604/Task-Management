import UserService from "./user.service.js";
import jwt from "jsonwebtoken";

export default class UserController {
  async signup(req, res) {
    try {
      const { name, email, password, userPhoto } = req.body;
      const newUser = await UserService.signup({ name, email, password, userPhoto });
      res.status(201).json(newUser);
    } catch (err) {
      res.status(400).json({ message: err.message || "Error in adding user" });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await UserService.login(email, password);

      if (!result) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async getCount(req, res) {
    try {
      const totalUsers = await UserService.getCount();
      res.status(200).json({ totalUsers });
    }
    catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  async getCurrentUser(req, res) {
    try {
      const user = await UserService.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    }
    catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  }

  async getUserByEmail(req, res) {
    try {
      const { email } = req.query;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      const user = await UserService.findByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    }
    catch (err) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  }

  async searchUsers(req, res) {
    try {
      const { search } = req.query;
      if (!search || search.length < 2) {
        return res.status(400).json({ message: "Search term must be at least 2 characters" });
      }
      const users = await UserService.searchUsers(search);
      res.json(users);
    }
    catch (err) {
      res.status(500).json({ message: err.message || "Server error" });
    }
  }
}


