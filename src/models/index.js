require('dotenv').config();
let config = require("../config/database.config.js").config;

const environment = process.env.ENV || 'development';
const dbConfig = config[environment];
const Sequelize = require("sequelize");

const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
    host: dbConfig.HOST,
    dialect: dbConfig.dialect,
    dialectModule: require('pg'),
    // operatorsAliases: false,
    logging: false,
    dialectOptions: {
        requestTimeout: 10000,
        useUTC: false, // for reading from database
        timezone: "+04:00",
        ssl: {
            rejectUnauthorized: false
        }
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

db.USER = require("./user/user.model.js")(sequelize, Sequelize);
db.FCM_TOKEN = require("./user/fcm.token.model.js")(sequelize, Sequelize);
db.USER_SESSION = require("./user/user.sessions.js")(sequelize, Sequelize);
db.SUPERADMIN = require("./Admin/admin.model.js")(sequelize, Sequelize);
db.CARINSPECTION = require("./car inspection/car.inspection.js")(sequelize, Sequelize);
db.SALARIEDINDIVIDUAL = require("./AOF/application.model.js")(sequelize, Sequelize)
db.FORMSTATUSES = require("./AOF/application.statuses.model.js")(sequelize, Sequelize)
db.FORMLOGS = require("./AOF/application.status.log.model.js")(sequelize, Sequelize)
db.FORMCOUNTER = require("./AOF/form_counter.js")(sequelize, Sequelize)
db.ASSET = require("./Asset/assets.mode.js")(sequelize, Sequelize)
db.CARMAKE = require("./Asset/carMake.js")(sequelize, Sequelize)
db.CARMODEL = require("./Asset/carModel.js")(sequelize, Sequelize)
db.CARYEAR = require("./Asset/carModelYear.js")(sequelize, Sequelize)
db.INSPECTIONREPORT = require("./car inspection/inspection.report.js")(sequelize, Sequelize)
db.CONTRACT = require("./contract/contract.model.js")(sequelize, Sequelize)
db.CONTRACTCOUNTER = require("./contract/contract.number.model.js")(sequelize, Sequelize)
db.AGENT = require("./AOF/agent.model.js")(sequelize, Sequelize)
db.BANK = require("./Banks/bank.model.js")(sequelize, Sequelize)
db.USERBANKDETAILS = require("./user/user.banks.details.model.js")(sequelize, Sequelize)
db.NOTIFICATION = require("./Notification/notification.model.js")(sequelize, Sequelize)


db.USER.hasMany(db.NOTIFICATION, {
    foreignKey: "user_id"
});

db.NOTIFICATION.belongsTo(db.USER, {
     foreignKey: "user_id"
})

// AGENT
db.AGENT.hasMany(db.SALARIEDINDIVIDUAL, {
    foreignKey: "agentId"
});

db.SALARIEDINDIVIDUAL.belongsTo(db.AGENT, {
    foreignKey: "agentId"
});

// CONTRACT hasOne SALARIEDINDIVIDUAL
db.CONTRACT.hasOne(db.SALARIEDINDIVIDUAL, {
    foreignKey: 'contractId',
    constraints: false
});

db.SALARIEDINDIVIDUAL.belongsTo(db.CONTRACT, {
    foreignKey: 'contractId',
    constraints: false
});

// INSPECTION REPORT
db.CARINSPECTION.hasOne(db.INSPECTIONREPORT, {
    foreignKey: 'inspectionId',
    as: 'report'
});
db.INSPECTIONREPORT.belongsTo(db.CARINSPECTION, {
    foreignKey: 'inspectionId',
    as: 'inspection'
});

// Form Status ↔ Logs
db.FORMSTATUSES.hasMany(db.FORMLOGS, {
    foreignKey: 'statusId'
});
db.FORMLOGS.belongsTo(db.FORMSTATUSES, {
    foreignKey: 'statusId'
});

// Salaried Individual ↔ Status (current status only)

db.SALARIEDINDIVIDUAL.hasMany(db.FORMLOGS, {
    foreignKey: 'applicationId',
    constraints: false
});

db.FORMLOGS.belongsTo(db.SALARIEDINDIVIDUAL, {
    foreignKey: 'applicationId',
    constraints: false
});

db.SALARIEDINDIVIDUAL.belongsTo(db.FORMSTATUSES, {
    foreignKey: 'currentStatusId',
    as: 'currentStatus'
});

db.SALARIEDINDIVIDUAL.belongsTo(db.CARINSPECTION, {
    foreignKey: 'inspectionId',
    onDelete: "NO ACTION",
});
db.CARINSPECTION.hasOne(db.SALARIEDINDIVIDUAL, {
    foreignKey: 'inspectionId',
    onDelete: "NO ACTION",
});

// Assets
db.CARMAKE.hasMany(db.CARMODEL, {
    foreignKey: "make_id",
    as: "models",
    onDelete: "CASCADE",
});

db.CARMODEL.belongsTo(db.CARMAKE, {
    foreignKey: "make_id",
    as: "make",
});

// CarModel -> CarYear (1:N)
db.CARMODEL.hasMany(db.CARYEAR, {
    foreignKey: "model_id",
    as: "years",
    onDelete: "CASCADE",
});

db.CARYEAR.belongsTo(db.CARMODEL, {
    foreignKey: "model_id",
    as: "model",
});

// Asset => Make, Model & Year

db.ASSET.belongsTo(db.CARMAKE, {
    foreignKey: 'make_id',
    as: "make"
});

db.ASSET.belongsTo(db.CARMODEL, {
    foreignKey: 'model_id',
    as: "model"
});

db.ASSET.belongsTo(db.CARYEAR, {
    foreignKey: 'year_id',
    as: "year"
});

db.SALARIEDINDIVIDUAL.belongsTo(db.ASSET, {
    foreignKey: 'asset_id',
    onDelete: "NO ACTION"
})

db.ASSET.hasMany(db.SALARIEDINDIVIDUAL, {
    foreignKey: 'asset_id',
    onDelete: "NO ACTION"
})

db.ASSET.belongsTo(db.USER, {
    foreignKey: 'userId',
    onDelete: "NO ACTION"
})

db.USER.hasMany(db.ASSET, {
    foreignKey: 'userId',
    onDelete: "NO ACTION",
})

db.CARINSPECTION.belongsTo(db.USER, {
    foreignKey: 'userId',
    onDelete: "NO ACTION",
})

db.USER.hasMany(db.CARINSPECTION, {
    foreignKey: 'userId',
    onDelete: "NO ACTION",
})

db.USER.hasMany(db.SALARIEDINDIVIDUAL, {
    foreignKey: "userId",
    onDelete: "NO ACTION",
})
db.SALARIEDINDIVIDUAL.belongsTo(db.USER, {
    foreignKey: 'userId',
    onDelete: "NO ACTION",
})

db.BANK.hasMany(db.USERBANKDETAILS, {
    foreignKey: "bankId",
})

db.USERBANKDETAILS.belongsTo(db.BANK, {
    foreignKey: 'bankId',
})

db.USERBANKDETAILS.hasMany(db.SALARIEDINDIVIDUAL, {
    foreignKey: "bankId",
});

db.SALARIEDINDIVIDUAL.belongsTo(db.USERBANKDETAILS, {
    foreignKey: "bankId"
});

db.CARINSPECTION.belongsTo(db.ASSET, {
    foreignKey: 'asset_id',
    onDelete: "NO ACTION",
});

db.ASSET.hasMany(db.CARINSPECTION, {
    foreignKey: 'asset_id',
    onDelete: "NO ACTION",
});

db.USER.hasMany(db.FCM_TOKEN, {
    foreignKey: 'userId',
    as: 'fcmTokens',
    onDelete: 'CASCADE',
});

db.FCM_TOKEN.belongsTo(db.USER, {
    foreignKey: 'userId',
    as: 'user',
});

db.USER.hasMany(db.USER_SESSION, {
    foreignKey: 'userId'
});

db.USER_SESSION.belongsTo(db.USER, {
    foreignKey: 'userId'
});

db.USER_SESSION.hasOne(db.FCM_TOKEN, {
    foreignKey: 'sessionId'
});

db.FCM_TOKEN.belongsTo(db.USER_SESSION, {
    foreignKey: 'sessionId'
});

module.exports = db;
