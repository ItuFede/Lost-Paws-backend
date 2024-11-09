const { httpErrorWrapper } = require("wrappers");
const https = require("https");
const querystring = require("querystring");

const cognitoClientId = process.env.COGNITO_CLIENT_ID;
const redirectUri = "http://localhost:5173/";
const userPoolDomain = "lnp-login.auth.us-east-1.amazoncognito.com";

const main = async (event) => {
  const body = JSON.parse(event.body);
  const refreshToken = body.refreshToken;
  console.log("refreshToken:::", refreshToken);

  const clientId = cognitoClientId;

  console.log("Parametros Cognito:::", {
    clientId,
    redirectUri,
    userPoolDomain,
  });

  const postData = querystring.stringify({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
    redirect_uri: redirectUri,
  });

  const options = {
    hostname: `${userPoolDomain}`,
    path: "/oauth2/token",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": postData.length,
    },
  };

  const tokenResponse = await new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        resolve(JSON.parse(data));
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });

  console.log("tokenResponse", tokenResponse);

  const {
    access_token,
    id_token,
    refresh_token: newRefreshToken,
  } = tokenResponse;

  return {
    statusCode: 200,
    body: {
      accessToken: access_token,
      idToken: id_token,
      refreshToken: newRefreshToken,
    },
  };
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "POST" });
