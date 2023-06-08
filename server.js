const { http, https } = require("follow-redirects");

let accessToken = null;
let renewalToken = null;
let expiryTime = null;

function login() {
  return new Promise((resolve, reject) => {
    var options = {
      method: "POST",
      hostname: "api.staging.tides.coloredcow.com",
      path: "/api/v1/session",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      maxRedirects: 20,
    };

    var req = https.request(options, function (res) {
      var chunks = [];

      res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function (chunk) {
        var body = Buffer.concat(chunks);
        console.log(body.toString());
        var responseData = JSON.parse(body.toString());
        accessToken = responseData.data.access_token;
        renewalToken = responseData.data.renewal_token;
        expiryTime = responseData.data.token_expiry_time;
        resolve();
      });

      res.on("error", function (error) {
        console.error(error);
        reject(error);
      });
    });

    var postData = JSON.stringify({
      user: {
        phone: "917834811114",
        password: "secret1234",
      },
    });

    req.write(postData);

    req.end();
  });
}

async function tokenRenewal() {
  var options = {
    method: "POST",
    hostname: "api.staging.tides.coloredcow.com",
    path: "/api/v1/session/renew",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + accessToken,
    },
    maxRedirects: 20,
  };

  var req = https.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function (chunk) {
      var body = Buffer.concat(chunks);
      console.log(body.toString());
    });

    res.on("error", function (error) {
      console.error(error);
    });
  });

  var postData = JSON.stringify({
    data: {
      data: {
        access_token: accessToken,
        token_expiry_time: expiryTime,
        renewal_token: renewalToken,
      },
    },
  });

  req.write(postData);

  req.end();
}

function checkTokenExpiry() {
  setInterval(async () => {
    const current_time = Date.now() / 1000;
    console.log(current_time, "  ", Date.parse(expiryTime));
    if (current_time >= Date.parse(expiryTime)) {
      try {
        await tokenRenewal();
        console.log("Token renewed successfully");
      } catch (error) {
        console.error("Token renewal failed:", error);
      }
    }
  }, 5000);
}

http
  .createServer(async function (req, res) {
    console.log("listening on port 8080");
    login();

    try {
      await login();
      if (accessToken) {
        checkTokenExpiry();
      } else {
        console.log("Access token is null");
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  })
  .listen(8080);
