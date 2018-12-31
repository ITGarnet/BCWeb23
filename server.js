const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const port = 3000;

/* handling all the parsing */
app.use(bodyParser.json());

app.post("/", (req, res) => {
  var email = req.body.email;
  var amount = req.body.amount;

  res.send({ amount: amount, email: email });
});

app.listen(port, () => {
  console.log("servr is runnint on port: ", port);
});
