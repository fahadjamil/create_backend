const db = require("../models");
const Client = db.Client;
const Project = db.Project;

/* ======================================================
   ✅ CREATE NEW CLIENT (userId required)
====================================================== */
exports.createClient = async (req, res) => {
  try {
    const {
      fullName,
      clientType,
      company,
      email,
      phone,
      address,
      contactPersonName,
      contactPersonRole,
      userId,
    } = req.body;

    // Basic validation
    if (!fullName || !clientType || !phone || !userId) {
      return res.status(400).json({
        message:
          "Full name, client type, phone and userId are required fields.",
      });
    }

    // 🔍 Check duplicate phone for this user
    const existingClient = await Client.findOne({
      where: { phone, user_id: userId },
    });

    if (existingClient) {
      return res.status(409).json({
        message:
          "A client with this phone number already exists for this user.",
      });
    }

    // Create new client
    const client = await Client.create({
      fullName,
      clientType,
      company,
      email,
      phone,
      address,
      contactPersonName,
      contactPersonRole,
      user_id: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Client created successfully",
      client,
    });
  } catch (err) {
    console.error("❌ Error creating client:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

/* ======================================================
   ✅ GET ALL CLIENTS (admin level)
====================================================== */
exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Project,
          as: "project",
          required: false,
          attributes: ["pid", "projectName", "projectType", "startDate", "endDate"],
        },
      ],
    });

    return res.status(200).json(clients);
  } catch (err) {
    console.error("❌ Error fetching clients:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

/* ======================================================
   ✅ GET SINGLE CLIENT BY ID
====================================================== */
exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const client = await Client.findByPk(id, {
      include: [
        {
          model: Project,
          as: "project",
          required: false,
          attributes: ["pid", "projectName", "projectType", "startDate", "endDate"],
        },
      ],
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.status(200).json(client);
  } catch (err) {
    console.error("❌ Error fetching client:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

/* ======================================================
   ✅ UPDATE CLIENT
====================================================== */
exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      fullName,
      clientType,
      company,
      email,
      phone,
      address,
      contactPersonName,
      contactPersonRole,
      userId,
    } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const client = await Client.findOne({ where: { cid: id, user_id: userId } });

    if (!client) {
      return res.status(404).json({
        message: "Client not found or does not belong to this user",
      });
    }

    // 🔍 prevent duplicate phone number for same user
    if (phone && phone !== client.phone) {
      const duplicate = await Client.findOne({
        where: { phone, user_id: userId },
      });

      if (duplicate) {
        return res.status(409).json({
          message:
            "Another client with this phone number already exists for this user.",
        });
      }
    }

    // Update client
    await client.update({
      fullName,
      clientType,
      company,
      email,
      phone,
      address,
      contactPersonName,
      contactPersonRole,
    });

    return res.status(200).json({
      success: true,
      message: "Client updated successfully",
      client,
    });
  } catch (err) {
    console.error("❌ Error updating client:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

/* ======================================================
   ✅ GET ALL CLIENTS OF A SPECIFIC USER
====================================================== */
exports.getClientsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const clients = await Client.findAll({
      where: { user_id: userId },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Project,
          as: "project",
          required: false,
          attributes: ["pid", "projectName", "projectType", "startDate", "endDate"],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      count: clients.length,
      clients,
    });
  } catch (err) {
    console.error("❌ Error fetching user clients:", err);
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
