
require('dotenv').config()
let config = {
    "development": {
        HOST: process.env.DB_HOST,
        USER: process.env.DB_USER,
        PASSWORD: process.env.DB_PASSWORD,
        DB: process.env.DB_DATABASE,
        dialect: "postgres",
        dialectOptions: {
            useUTC: false, // for reading from database
            timezone: '+04:00'
        }, // for writing to database
        timezone: '+05:00',
        pool: {
            max: 5,
            min: 0,
            acquire: 60000,
            idle: 10000,
        },
    },
    "staging": {

    },
    "production": {
        HOST: process.env.DB_HOST,
        USER: process.env.DB_USER,
        PASSWORD: process.env.DB_PASSWORD,
        DB: process.env.PROD_DB_DATABASE,
        dialect: "postgres",
        dialectOptions: {
            useUTC: false, // for reading from database
            timezone: '+04:00'
        }, // for writing to database
        timezone: '+05:00',
        pool: {
            max: 5,
            min: 0,
            acquire: 60000,
            idle: 10000,
        },
    }
}
module.exports = { config }