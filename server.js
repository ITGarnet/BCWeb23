const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const {
  save_user_information,
  get_total_amount
} = require("./models/server_db");
const path = require("path");
const publicPath = path.join(__dirname, "./public");
const paypal = require("paypal-rest-sdk");

const port = 3000;

/* handling all the parsing */
app.use(bodyParser.json());
app.use(express.static(publicPath));

/* paypal configuration */
paypal.configure({
  mode: "sandbox", // snadbox or live
  client_id:
    //"Ad6paVM8EnxH7ecp9VO3e0CALZfC3B9yQhPHaneNgV3ulQEcVTYO2hdPoTEI0rYcpTzM6_4U1u7k73p-",
    "AQenuaezZphXYLNtR2evi5Yb9kYoVb76UJwlctPeq6-63qOghzTyzAnfYMwtEhwkT6bE47shpPC-pQnM",
  client_secret:
    //"ENsIYnn63D6o1TXCwEJr5RFbvlCA6mO-mKRE9WRGj6t0TQlz6tEFfmfBd16biOszRZHAZbjAhGHTTAdJ"
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

  const result = await save_user_information({ amount: amount, email: email });

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
          //email: "tzikibusiness@gmail.com"
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

app.get("/success", (req, res) => {
  const payerId = req.query.PayerID;
  const paymentId = req.query.paymentId;

  const execute_payment_json = {
    payer_id: payerId,
    transactions: [
      {
        amount: {
          currency: "USD",
          total: 100
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
  res.redirect("http://localhost:3000");
});

app.get("/get_total_amount", async (req, res) => {
  const result = await get_total_amount();
  res.send(result);
});

app.listen(port, () => {
  console.log("servr is runnint on port: ", port);
});
