const db = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = db.User;

exports.signup = async (req, res) => {
  const trans = await db.sequelize.transaction();
  try {
    const {
      phone,
      firstName,
      lastName,
      email,
      password,
      role, // Default to 'user' if not provided
      searchTerm,
    } = req.body;

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
