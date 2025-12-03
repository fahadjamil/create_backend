const clientController = require("../controllers/client.controller");

module.exports = (app) => {
  // Create client
  app.post("/api/clients", clientController.createClient);

  // Get all clients
  app.get("/api/clients", clientController.getAllClients);

  // ✅ Get single client by ID
  app.get("/api/clients/:id", clientController.getClientById);

  app.put("/api/clients/:id", clientController.updateClient);
  
  app.get("/clients/user/:userId", clientController.getClientsByUser);
};
