const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = db.User;

exports.signup = async (req, res) => {
  const trans = await db.sequelize.transaction();
  try {
    console.log("📥 DEBUG req.body:", req.body); // Add this to debug

    if (!req.body || typeof req.body !== "object") {
      return res
        .status(400)
        .json({ message: "Invalid or missing request body." });
    }

    const { phone, firstName, lastName, email, password, role, searchTerm } =
      req.body;
    // Validation
    if (!phone || !firstName || !lastName || !email || !password) {
      return res.status(400).json({
        message:
          "Phone, first name, last name, email, and password are required.",
      });
    }

    // Check if user already exists (by email or phone)
    const existingUser = await User.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ email }, { phone }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email or phone number already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create(
      {
        phone,
        firstName,
        lastName,
        full_name: `${firstName} ${lastName}`,
        email,
        password: hashedPassword,
        role,
        searchTerm,
      },
      { transaction: trans }
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        uid: user.uid,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await trans.commit();

    res.status(201).json({
      message: "User signup successful",
      token,
      user: {
        uid: user.uid,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        searchTerm: user.searchTerm,
      },
    });
  } catch (error) {
    await trans.rollback();
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { uid: user.uid, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        uid: user.uid,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: {
        exclude: ["password"], // Hide password from the response
      },
      order: [["createdAt", "DESC"]], // Optional: newest first
    });

    res.status(200).json({
      message: "All users retrieved successfully",
      users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.checkEmail = async (req, res) => {
  try {
    console.log("📩 Received body:", req.body);

    const { email } = req.body;

    if (!email) {
      console.warn("⚠️ Email missing in request body");
      return res.status(400).json({ message: "Email is required." });
    }

    const existingUser = await User.findOne({ where: { email } });
    console.log(
      "🔍 existingUser:",
      existingUser ? existingUser.email : "Not found"
    );

    if (existingUser) {
      return res.status(400).json({
        exists: true,
        message: "Email already exists.",
      });
    }

    return res.status(200).json({
      exists: false,
      message: "Email is available.",
    });
  } catch (error) {
    console.error("❌ Check email error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
exports.checkPhoneAndSendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required." });
    }

    // 🔍 Check if phone exists in DB
    const existingUser = await User.findOne({ where: { phone } });

    if (existingUser) {
      return res.status(400).json({
        exists: true,
        message: "This phone number is already registered.",
      });
    }

    // ✅ Generate random 6-digit OTP
    const otpToSend = Math.floor(100000 + Math.random() * 900000);

    // 🔹 Send OTP via external API
    const axios = require("axios");
    const response = await axios.post(
      "https://bsms.its.com.pk/otpsms.php",
      null, // No body
      {
        params: {
          key: "8aaf1d3a0b626b4840b6558792b4506b",
          receiver: phone, // e.g. 03134884635
          sender: "SmartLane",
          otpcode: otpToSend,
          param1: "Toseef Kirmani",
          param2: "Add Money",
        },
      }
    );

    console.log("📤 OTP Response:", response.data);

    // ✅ Respond to client
    return res.status(200).json({
      exists: false,
      message: "Phone not registered. OTP sent successfully.",
      otp: otpToSend, // You can remove this in production for security
    });
  } catch (error) {
    console.error("❌ Phone check or OTP send error:", error.message);
    return res.status(500).json({
      message: "Internal server error or OTP sending failed.",
      error: error.message,
    });
  }
};
