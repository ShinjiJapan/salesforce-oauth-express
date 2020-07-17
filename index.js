const express = require("express");
const fetch = require("node-fetch");
const qs = require("querystring");
const session = require("express-session");

const client_id =
  "コンシューマ鍵を指定してください";
const client_secret =
  "コンシューマの秘密を指定してください";
const redirect_uri = "http://localhost:3000/oauth/callback"; // salesforceの接続アプリケーションで指定したURL
const response_type = "code";
const scope = "full";
const display = "popup";

const auth_uri = "https://login.salesforce.com/services/oauth2/authorize";
const token_uri = "https://login.salesforce.com/services/oauth2/token";

const app = express();

app.use(
  session({
    secret: "secret",
    resave: false,
    httpOnly: true,
    saveUninitialized: true,
  })
);
app.get("/", (req, res) => {
  const params = qs.stringify({
    client_id,
    redirect_uri,
    response_type,
    scope,
    display, //効かない？
  });
  res.redirect(302, `${auth_uri}?${params}`);
});

/** salesforceの接続アプリケーションで指定したURL。認証画面でログイン後、ここに飛ばされる */
app.get("/oauth/callback", async (req, res) => {
  // 受け取ったcodeでaccess tokenを要求
  const fetchRes = await fetch(token_uri, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: qs.stringify({
      client_id,
      client_secret,
      code: req.query.code,
      grant_type: "authorization_code",
      redirect_uri,
    }),
  });

  const json = await fetchRes.json();

  req.session.instanceUrl = json.instance_url;
  req.session.accessToken = json.access_token;
  res.redirect("/api/chatter");
});

app.get("/api/chatter", async (req, res) => {
  // 受け取ったaccess token と instanceUrlでSalesforceのAPIを叩いてみる
  const fetchRes = await fetch(
    req.session.instanceUrl + "/services/data/v48.0/chatter/users/me",
    {
      headers: {
        Authorization: `Bearer ${req.session.accessToken}`,
      },
    }
  );

  const json = await fetchRes.json();
  res.send("chatter!" + JSON.stringify(json));
});

app.listen(3000, () => console.log("listening on port 3000"));
