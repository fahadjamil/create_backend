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

      // Client main details
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
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [7, 15], // keep same as frontend regex
        },
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      // Contact person details
      contactPersonName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      contactPersonRole: {
        type: DataTypes.STRING,
        allowNull: true,
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
