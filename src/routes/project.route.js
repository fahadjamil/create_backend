module.exports = (app) => {
  const router = require("express").Router();
  const projectController = require("../controllers/project.controller");
  const upload = require("../middlewares/upload");

  // Create new project
  router.post("/new_project", projectController.Newproject);

  // Get all projects
  router.post("/all_projects", projectController.allprojects);

  // Multiple images upload
  router.post(
    "/upload_pictures",
    upload.array("images", 5), // 'images' should match form field name
    projectController.uploadProjectPictures
  );

  // Get single Project
  router.get("/:id", projectController.getProjectById);

  router.put("/update_project/:id", projectController.updateProject);

  // Create draft project
  router.post("/draftProject", projectController.DraftProject);

  // get draft project
  router.post("/all_draftProject", projectController.allDraftprojects);

  // Get single draft by ID
  router.get("/draft/:id", projectController.getSingleDraftProject);

  // Mount router on /project
  app.use("/project", router);
};
