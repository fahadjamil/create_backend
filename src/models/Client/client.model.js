// models/Client.js
const { DataTypes } = require("sequelize");

module.exports = (sequelize, Sequelize) => {
  const Client = sequelize.define(
    "Client",
    {
      cid: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      // 🧾 Basic Client Info
      fullName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      clientType: {
        type: DataTypes.ENUM("individual", "brand"),
        allowNull: false,
      },
      company: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { len: [7, 15] },
      },
      address: {
        type: DataTypes.TEXT,
      },

      // 👤 Contact Details
      contactPersonName: {
        type: DataTypes.STRING,
      },
      contactPersonRole: {
        type: DataTypes.STRING,
      },

      // 🔗 Foreign Key — optional during creation
      projectId: {
        type: DataTypes.UUID,
        allowNull: true, // ✅ make nullable so sync doesn't break
        references: {
          model: "projects", // must match Project.tableName
          key: "pid",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    },
    {
      timestamps: true,
      paranoid: true, // enables soft deletes
      tableName: "clients",
    }
  );

  return Client;
};
