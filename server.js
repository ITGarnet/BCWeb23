const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const {
  save_user_information,
  get_list_of_participants,
  get_total_amount
} = require("./models/server_db");
const path = require("path");
const publicPath = path.join(__dirname, "./public");
const paypal = require("paypal-rest-sdk");
const session = require("express-session");

const port = 3000;

app.use(
  session({
    secret: "my web app",
    cookie: { maxAge: 6000 },
    saveUninitialized: true,
    resave: true
  })
);

/* handling all the parsing */
app.use(bodyParser.json());
app.use(express.static(publicPath));

/* paypal configuration */
paypal.configure({
  mode: "sandbox", // snadbox or live
  client_id:
    "AQenuaezZphXYLNtR2evi5Yb9kYoVb76UJwlctPeq6-63qOghzTyzAnfYMwtEhwkT6bE47shpPC-pQnM",
  client_secret:
    "EFYeBRdwxerYuLO46JCR3ny-WQA06qWPtFL0DOBq85T8rjOla23upA28l13RPBlEUE0r4dUN4Eg260w0"
});

app.post("/post_info", async (req, res) => {
  var email = req.body.email;
  var amount = req.body.amount;

  if (amount <= 1) {
    return_info = {};
    return_info.error = true;
    return_info.message = "The amount should be greater than 1";
    return res.send(return_info);
  }

  let fee_amount = amount * 0.9;
  // here we save to the database
  const result = await save_user_information({
    amount: fee_amount,
    email: email
  });
  req.session.paypal_amount = amount;

  var create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal"
    },
    redirect_urls: {
      return_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel"
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: "Lottery",
              sku: "Funding",
              price: amount,
              currency: "USD",
              quantity: 1
            }
          ]
        },
        amount: {
          currency: "USD",
          total: amount
        },
        payee: {
          email: "lotterymng@lotteryapp.com"
        },
        description: "Lottery perchase"
      }
    ]
  };

  paypal.payment.create(create_payment_json, function(error, payment) {
    if (error) {
      throw error;
    } else {
      console.log("Create Payment Response");
      console.log(payment);
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel == "approval_url") {
          console.log(i);
          return res.send(payment.links[i].href);
          //res.redirect(payment.links[i].href);
        }
      }
    }
  });
});

app.get("/success", async (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: req.session.paypal_amount
        }
      }
    ]
  };

  paypal.payment.execute(paymentId, execute_payment_json, function(
    error,
    payment
  ) {
    if (error) {
      console.log(error.response);
      throw error;
    } else {
      console.log(JSON.stringify(payment));
    }
  });
  /* delete all mysql users */
  if(req.session.winner_picked) {
    let deleted = await delete_users();
  }
  req.session.winner_picked = false;git status
  res.redirect("http://localhost:3000");
});

app.get("/get_total_amount", async (req, res) => {
  const result = await get_total_amount();
  res.send(result);
});

app.get("/pick_winner", async (req, res) => {
  const result = await get_total_amount();
  let total_amount = result[0].total_amount;
  req.session.paypal_amount = total_amount;

  /* Placeholder for picking the winner,
  1) We need to write a query to get a list of alll the participants
  2) we need to pick a winner */
  let list_of_participants = await get_list_of_participants();
  list_of_participants = JSON.parse(JSON.stringify(list_of_participants));
  let email_array = [];
  list_of_participants.forEach(element => {
    email_array.push(element.email);
  });
  let winner_email =
    email_array[Math.floor(Math.random() * email_array.length)];
  req.session.winner_picked = true;
  /* Create paypal payment */
  var create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal"
    },
    redirect_urls: {
      return_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel"
    },
    transactions: [
      {
        item_list: {
          items: [
            {
              name: "Lottery",
              sku: "Funding",
              price: req.session.paypal_amount,
              currency: "USD",
              quantity: 1
            }
          ]
        },
        amount: {
          currency: "USD",
          total: req.session.paypal_amount
        },
        payee: {
          email: winner_email
        },
        description: "Paying the winner of the lottery application"
      }
    ]
  };

  paypal.payment.create(create_payment_json, function(error, payment) {
    if (error) {
      throw error;
    } else {
      console.log("Create Payment Response");
      console.log(payment);
      for (let i = 0; i < payment.links.length; i++) {
        if (payment.links[i].rel == "approval_url") {
          console.log(i);
          return res.send(payment.links[i].href);
          //res.redirect(payment.links[i].href);
        }
      }
    }
  });
});

app.listen(port, () => {
  console.log("servr is runnint on port: ", port);
});
