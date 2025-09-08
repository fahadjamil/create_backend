const db = require("../models");
const Project = db.Project;
const DraftProject = db.DraftProject;
const upload = require("../middlewares/upload");
const { cloudinary } = require("../config/cloudinary");

// Create and store a new project
exports.Newproject = async (req, res) => {
  try {
    console.log("📌 make new project");

    const requiredFields = [
      "projectName",
      "projectType",
      "client",
      "startDate",
      "endDate",
    ];

    // ✅ Validate required fields only if creating new project
    if (!req.body.pid) {
      const missingFields = requiredFields.filter(
        (field) => !req.body[field] || req.body[field].toString().trim() === ""
      );

      if (missingFields.length > 0) {
        return res.status(400).json({
          message: "❌ Missing required fields",
          missing: missingFields,
        });
      }
    }

    if (!req.body.userId) {
      return res.status(400).json({
        message: "❌ userId is required (project must belong to a user)",
      });
    }

    let project;

    if (req.body.pid) {
      // 🔹 Update existing project
      project = await Project.findOne({ where: { pid: req.body.pid } });

      if (!project) {
        return res.status(404).json({
          message: "❌ Project not found with given PID",
        });
      }

      await project.update({
        ...req.body,
        userId: req.body.userId,
      });

      // ✅ Remove from draft if exists
      await DraftProject.destroy({ where: { dpid: req.body.pid } });

      return res.status(200).json({
        message: "✅ Project updated successfully (draft removed)",
        project,
      });
    } else {
      // 🔹 Create new project
      project = await Project.create({
        ...req.body,
        userId: req.body.userId,
      });

      // ✅ Remove from draft if exists (in case it's being promoted)
      if (req.body.dpid || req.body.pid) {
        await DraftProject.destroy({ where: { dpid: req.body.dpid || req.body.pid } });
      }

      return res.status(201).json({
        success: true,
        message: "✅ Project created successfully (draft removed if existed)",
        project,
      });
    }
  } catch (error) {
    console.error("❌ Error in Newproject:", error);
    return res.status(500).json({
      message: "Something went wrong while creating/updating project",
      error: error.message,
    });
  }
};


// ✅ Get all projects
exports.allprojects = async (req, res) => {
  try {
    // ✅ Get logged-in userId (from token or request body/query)
    const userId = req.user?.id || req.query.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // ✅ Fetch projects of this user only
    const projects = await Project.findAll({
      where: { userId }, // filter by logged-in user
    });

    res.status(200).json({
      success: true,
      message: "Projects fetched successfully",
      data: projects,
    });
  } catch (error) {
    console.error("❌ Error fetching projects:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
};

exports.uploadProjectPictures = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    let project;

    // If projectId exists, update that project
    if (req.body.projectId) {
      project = await Project.findOne({ where: { pid: req.body.projectId } });
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
    } else {
      // Create a new project
      project = await Project.create({
        userId: req.body.userId || null,
        projectName: req.body.projectName || "Untitled Project",
        projectType: req.body.projectType || "General",
        client: req.body.client || "Unknown",
        status: req.body.status || "Pending",
        startDate: new Date(),
        endDate: new Date(),
        media: JSON.stringify([]),
      });
    }

    // Extract Cloudinary URLs from uploaded files
    const uploadedUrls = req.files.map((file) => file.path); // file.path is the Cloudinary URL

    // Merge with existing media
    let existingMedia = [];
    if (project.media) {
      try {
        existingMedia = JSON.parse(project.media);
      } catch {
        existingMedia = [];
      }
    }

    // Save updated media list
    await project.update({
      media: JSON.stringify([...existingMedia, ...uploadedUrls]),
    });

    return res.status(200).json({
      success: true,
      message: "✅ Pictures uploaded successfully to Cloudinary",
      project,
    });
  } catch (error) {
    console.error("❌ Error uploading pictures:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Get single project by ID
exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    // Find project by primary key
    const project = await Project.findOne({ where: { pid: id } });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "❌ Project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "✅ Project fetched successfully",
      data: project,
    });
  } catch (error) {
    console.error("❌ Error fetching project:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project",
      error: error.message,
    });
  }
};

// ✅ Update project
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;

    // check if project exists
    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ✅ whitelist fields you allow to update (to avoid overwriting system fields like userId, createdAt)
    const updatableFields = [
      "projectName",
      "projectType",
      "client",
      "startDate",
      "endDate",
      "description",
      "tags",
      "projectStatus",
    ];

    const updates = {};
    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // update only safe fields
    await project.update(updates);

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

//  add Draft project
// 📌 Create or Update Draft Project
exports.DraftProject = async (req, res) => {
  try {
    console.log("📌 make draft project");

    const { pid, userId, ...rest } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "❌ userId is required" });
    }

    // 🔹 If pid exists → update, otherwise → create
    const [draft, created] = await DraftProject.upsert(
      {
        dpid: pid, // Sequelize will match this
        ...rest,
        userId,
      },
      { returning: true } // ensures we get the updated/created row
    );

    return res.status(created ? 201 : 200).json({
      success: true,
      message: created
        ? "✅ Project draft created successfully"
        : "✅ Project draft updated successfully",
      draft,
    });
  } catch (error) {
    console.error("❌ Error in DraftProject:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating/updating project",
      error: error.message,
    });
  }
};

// Set all Draft project
exports.allDraftprojects = async (req, res) => {
  try {
    const userId = req.user?.id || req.query.userId || req.body.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const draftProjects = await DraftProject.findAll({
      where: { userId },
    });

    res.status(200).json({
      success: true,
      message: "Draft Projects fetched successfully",
      data: draftProjects,
    });
  } catch (error) {
    console.error("❌ Error fetching projects:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
      error: error.message,
    });
  }
};

// 📌 Get Single Draft Project by ID
exports.getSingleDraftProject = async (req, res) => {
  try {
    const { id } = req.params; // draft project id
    const userId =
      req.user?.uid || req.user?.id || req.query.userId || req.body.userId;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Draft project ID is required",
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const draftProject = await DraftProject.findOne({
      where: { dpid: id, userId },
    });

    if (!draftProject) {
      return res.status(404).json({
        success: false,
        message: "❌ Draft project not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "✅ Draft project fetched successfully",
      data: draftProject,
    });
  } catch (error) {
    console.error("❌ Error fetching single project:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch draft project",
      error: error.message,
    });
  }
};
