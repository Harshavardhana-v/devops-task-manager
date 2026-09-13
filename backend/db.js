const {Pool}=require("pg");
const fs=require("fs");

const dbPassword=fs
.readFileSync("/run/secrets/db_password", "utf8")
.trim();

const pool=new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: dbPassword
});

module.exports=pool;