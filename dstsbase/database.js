const mysql = require('mysql2');
require('dotenv').config();

const mysqlconnection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "gurihage",
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = mysqlconnection;


// const mysql = require('mysql2');

// const mysqlconnection = mysql.createPool({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'gurihage', // change this
//   port: 3306,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

// module.exports = mysqlconnection;