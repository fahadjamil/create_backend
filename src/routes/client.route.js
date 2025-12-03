const clientController = require("../controllers/client.controller");

module.exports = (app) => {
  // Create client
  app.post("/api/clients", clientController.createClient);

  // Get all clients
  app.get("/api/clients", clientController.getAllClients);

  // Get single client by ID
  app.get("/api/clients/:id", clientController.getClientById);

  // Update client
  app.put("/api/clients/:id", clientController.updateClient);

  // Get clients by userId
  app.get("/api/clients/user/:userId", clientController.getClientsByUser);
};
