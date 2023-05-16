const express = require("express");
const app = express();
app.use(express.json());
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
let db = null;
const bcrypt = require("bcrypt");

let initDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
  }
  app.listen(3000, () => {
    console.log("Server Started Successfully");
  });
};
initDBAndServer();

//REGISTERING USER API

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const userQuery = `
    SELECT * FROM user WHERE username = '${username}';`;
  const userData = await db.get(userQuery);
  if (userData === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const postQuery = `
      INSERT INTO user(username, name, password, gender, location) 
      VALUES (
      '${username}', 
      '${name}', 
      '${hashedPassword}', 
      '${gender}', 
      '${location}');`;
      await db.run(postQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

// LOGIN USER API
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const Query = `
    SELECT * FROM user WHERE username = '${username}';`;
  const users = await db.get(Query);
  if (users === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const passwordValidation = await bcrypt.compare(password, users.password);
    if (passwordValidation === true) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//CHANGE PASSWORD
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const oldPasswordQuery = `
    SELECT * FROM user WHERE username = '${username}';`;
  const myPassword = await db.get(oldPasswordQuery);
  console.log(myPassword);
  const passwordValidation = await bcrypt.compare(
    oldPassword,
    myPassword.password
  );
  if (passwordValidation === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const pass = await bcrypt.hash(newPassword, 10);
      const updatingQuery = `
            UPDATE user SET password = '${pass}'
            WHERE username = '${username}';`;
      await db.run(updatingQuery);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
