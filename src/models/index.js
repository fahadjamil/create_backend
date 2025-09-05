require("dotenv").config();
let config = require("../config/DB.config").config;

const environment = process.env.ENV || "development";
const dbConfig = config[environment];
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
  host: dbConfig.HOST,
  dialect: dbConfig.dialect,
  dialectModule: require("pg"),
  logging: false,
  dialectOptions: {
    requestTimeout: 10000,
    useUTC: false, // read from DB without UTC conversion
    timezone: "+04:00",
    ssl: {
      rejectUnauthorized: false,
    },
  },
  timezone: "+04:00",
  pool: {
    max: dbConfig.pool.max,
    min: dbConfig.pool.min,
    acquire: dbConfig.pool.acquire,
    idle: dbConfig.pool.idle,
  },
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// ✅ Register Models
db.User = require("./User/user.model")(sequelize, Sequelize);
db.Project = require("./Project/project.modal")(sequelize, Sequelize);
db.DraftProject = require("./Project/draftProject.modal")(sequelize, Sequelize);


// ✅ Example Associations (if needed later)
db.User.hasMany(db.Project, { foreignKey: "userId", as: "projects" });
db.Project.belongsTo(db.User, { foreignKey: "userId", as: "owner" });
db.DraftProject.belongsTo(db.User, { foreignKey: "userId", as: "owner" });

module.exports = db;
