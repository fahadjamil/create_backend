const db = require("../models");
const Project = db.Project;
const upload = require("../middlewares/upload");

// Create and store a new project
exports.Newproject = async (req, res) => {
  try {
    console.log("make new project");

    const requiredFields = [
      "projectName",
      "projectType",
      "client",
      "startDate",
      "endDate",
    ]; // ❌ removed media

    // ✅ Create new project
    if (!req.body.pid) {
      const missingFields = requiredFields.filter(
        (field) => !req.body[field] || req.body[field].trim() === ""
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

      return res.status(200).json({
        message: "✅ Project updated successfully",
        project,
      });
    } else {
      // 🔹 Create new project
      project = await Project.create({
        ...req.body,
        userId: req.body.userId,
      });

      return res.status(201).json({
        success: true,
        message: "✅ Project created successfully",
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
    // Ensure files exist
    if (!req.files || req.files.length === 0)
      return res.status(400).json({ message: "No files uploaded" });

    let project;

    // Check if projectId is provided
    if (req.body.projectId) {
      project = await Project.findByPk(req.body.projectId);
      if (!project)
        return res.status(404).json({ message: "Project not found" });
    } else {
      // If no projectId, create a new project with minimal info
      project = await Project.create({
        userId: req.body.userId || null, // optional: associate user
        projectName: req.body.projectName || "Untitled Project",
        projectType: req.body.projectType || "General",
        client: req.body.client || "Unknown",
        status: req.body.status || "Pending",
        startDate: new Date(),
        endDate: new Date(),
        media: JSON.stringify([]),
      });
    }

    // Map uploaded files to paths
    const filePaths = req.files.map((f) => `/uploads/projects/${f.filename}`);

    // Merge with existing media
    let existingMedia = [];
    if (project.media) {
      try {
        existingMedia = JSON.parse(project.media);
      } catch {
        existingMedia = [];
      }
    }

    // Update project media
    await project.update({
      media: JSON.stringify([...existingMedia, ...filePaths]),
    });

    return res.status(200).json({
      success: true,
      message: "✅ Pictures uploaded successfully",
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
