const db = require("../db.js");

save_user_information = data =>
  new Promise((resolve, reject) => {
    db.query("INSERT INTO lottery_information SET ?", data, function(
      err,
      results,
      fields
    ) {
      if (err) {
        reject("Could not insert into lottery information");
      }
      resolve("Succesful");
    });
  });

get_total_amount = data =>
  new Promise((resolve, reject) => {
    db.query(
      "SELECT sum(amount) as total_amount from lottery_information",
      null,
      function(err, results, fields) {
        if (err) {
          reject("Could not get total amount");
        }
        resolve(results);
      }
    );
  });

get_list_of_participants = data =>
  new Promise((resolve, reject) => {
    db.query("select email from lottery_information", null, function(
      err,
      results,
      fields
    ) {
      if (err) {
        reject("Could not fetch list of participants");
      }
      resolve(results);
    });
  });

delete_users = data =>
  Promise((resolve, reject) => {
    db.query("delete from lottery_information where ID > 0", null, function(
      err,
      results,
      fields
    ) {
      if (err) {
        reject("Could not dlete all users");
      }
      results("Successfuly deleted all users");
    });
  });

module.exports = {
  save_user_information,
  get_list_of_participants,
  get_total_amount,
  delete_users
};
