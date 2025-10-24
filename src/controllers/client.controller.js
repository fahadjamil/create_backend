const db = require("../models");
const Client = db.Client;
const Project = db.Project;

// Create new client
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
    } = req.body;

    // Basic validation
    if (!fullName || !clientType || !email || !phone) {
      return res.status(400).json({
        message: "Full name, client type, email and phone are required",
      });
    }

    // Check duplicate phone
    const existingClient = await Client.findOne({ where: { phone } });
    if (existingClient) {
      return res
        .status(409)
        .json({ message: "Client with this phone number already exists" });
    }

    // Create client
    const client = await Client.create({
      fullName,
      clientType,
      company,
      email,
      phone,
      address,
      contactPersonName,
      contactPersonRole,
    });

    return res.status(201).json({
      message: "Client created successfully",
      client,
    });
  } catch (err) {
    console.error("Error creating client:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

// ✅ Get all clients (with project data if available)
exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.findAll({
      order: [["createdAt", "DESC"]], // newest first
      include: [
        {
          model: Project,
          as: "project", // 👈 must match your association alias
          required: false, // left join → includes even if project is null
          attributes: [
            "pid",
            "projectName",
            "projectType",
            "startDate",
            "endDate",
          ], // choose what you need
        },
      ],
    });

    return res.status(200).json(clients);
  } catch (err) {
    console.error("❌ Error fetching clients:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

// ✅ Get single client by ID (with project data)
exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Client ID is required" });
    }

    const client = await Client.findByPk(id, {
      include: [
        {
          model: Project,
          as: "project",
          required: false,
          attributes: [
            "pid",
            "projectName",
            "projectType",
            "startDate",
            "endDate",
          ],
        },
      ],
    });

    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    return res.status(200).json(client);
  } catch (err) {
    console.error("❌ Error fetching client by ID:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};

// ✅ Update (Edit) client by ID
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
    } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Client ID is required" });
    }

    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }

    // Optional: Check if the new phone already exists for another client
    if (phone && phone !== client.phone) {
      const existingPhone = await Client.findOne({ where: { phone } });
      if (existingPhone) {
        return res
          .status(409)
          .json({
            message: "Another client with this phone number already exists",
          });
      }
    }

    // Update fields
    await client.update({
      fullName: fullName ?? client.fullName,
      clientType: clientType ?? client.clientType,
      company: company ?? client.company,
      email: email ?? client.email,
      phone: phone ?? client.phone,
      address: address ?? client.address,
      contactPersonName: contactPersonName ?? client.contactPersonName,
      contactPersonRole: contactPersonRole ?? client.contactPersonRole,
    });

    return res.status(200).json({
      message: "Client updated successfully",
      client,
    });
  } catch (err) {
    console.error("Error updating client:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
};
