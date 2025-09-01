module.exports = (app) => {
  const router = require("express").Router();
  const projectController = require("../controllers/project.controller");
  const upload = require("../middlewares/upload");

  // Create new project
  router.post("/new_project", projectController.Newproject);

  // Get all projects
  router.post("/all_projects", projectController.allprojects);

  // Multiple images upload
  router.put(
    "/upload_pictures",
    upload.array("ProjectPhotos", 5), // max 5 files
    projectController.uploadProjectPictures
  );

  // Get single Project
  router.get("/:id", projectController.getProjectById);

  router.put("/update_project/:id", projectController.updateProject);

  // Mount router on /project
  app.use("/project", router);
};
