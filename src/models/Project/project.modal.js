const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const Project = sequelize.define("Project", {
    pid: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4,
    },
    projectName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    projectType: DataTypes.STRING,
    client: DataTypes.STRING,
    startDate: DataTypes.DATE,
    endDate: DataTypes.DATE,
    description: DataTypes.TEXT,
    tags: DataTypes.JSON,
    media: DataTypes.JSON,

    // Contact person / Point of contact
    pointName: DataTypes.STRING,
    pointRole: DataTypes.STRING,
    pointBrand: DataTypes.STRING,
    pointEmail: DataTypes.STRING,
    pointMobile: DataTypes.STRING,

    // Payment details
    paymentType: DataTypes.STRING,
    amount: DataTypes.DECIMAL(15, 2),
    dueDate: DataTypes.DATE,
    projectAmount: DataTypes.DECIMAL(15, 2),
    currency: DataTypes.STRING,
    taxHandling: DataTypes.STRING,
    paymentFrequency: DataTypes.ENUM("weekly", "monthly", "quarterly"),
    paymentStartDate: DataTypes.DATE,
    contractDuration: DataTypes.INTEGER, // months
    financing: DataTypes.STRING,
    paymentMethod: DataTypes.STRING,
    paymentStructure: DataTypes.ENUM("single", "recurring", "multiple"),
    milestones: DataTypes.JSON,
    agree: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // ✅ New fields from dataset
    projectStatus: DataTypes.STRING,
    contactName: DataTypes.STRING,
    contactEmail: DataTypes.STRING,
    contactNumber: DataTypes.STRING,
    contactRole: DataTypes.STRING,
    contactBrand: DataTypes.STRING,

    // ✅ Foreign key (link to User)
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  });

  // ✅ Convert empty strings to NULL automatically
  Project.beforeValidate((project) => {
    for (let key in project.dataValues) {
      if (project[key] === "") {
        project[key] = null;
      }
    }
  });

  return Project;
};
