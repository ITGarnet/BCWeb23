const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const { save_user_information } = require("./models/server_db");

const port = 3000;

/* handling all the parsing */
app.use(bodyParser.json());

app.post("/", async (req, res) => {
  var email = req.body.email;
  var amount = req.body.amount;

  if (amount <= 1) {
    return_info = {};
    return_info.error = true;
    return_info.message = "The amount should be greater than 1";
    return res.send(return_info);
  }

  const result = await save_user_information({ amount: amount, email: email });
  res.send(result);
});

app.listen(port, () => {
  console.log("servr is runnint on port: ", port);
});
