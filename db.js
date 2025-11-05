import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", // coloque a senha do seu MySQL se tiver
  database: "doafacil"
});
