module.exports = (app) => {
  require("./user.route")(app);
  require("./project.route")(app);
  require("./client.route")(app);
};