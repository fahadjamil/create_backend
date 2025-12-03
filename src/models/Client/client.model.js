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

      // 🔗 Project Relationship
      projectId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "projects",
          key: "pid",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

      // 🔗 User Relationship (IMPORTANT)
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
        references: {
          model: "user", // match your User model table name
          key: "uid",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
    },
    {
      timestamps: true,
      paranoid: true,
      tableName: "clients",
    }
  );

  return Client;
};
