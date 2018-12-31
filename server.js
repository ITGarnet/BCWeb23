const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello Tziki!");
});

app.listen(port, () => {
  console.log("servr is runnint on port: ", port);
});
