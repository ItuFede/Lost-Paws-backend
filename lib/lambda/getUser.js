const { httpErrorWrapper } = require("wrappers");
const { HTTPUnauthorizedError } = require("httpErrors");
const userDAO = require("userDAO");

const userPoolId = process.env.USER_POOL_ID;

const main = async (event) => {
  const accessToken = event.headers["x-access-token"];

  if (!accessToken) {
    console.error("Access token is required");
    throw new HTTPUnauthorizedError("Access token is required");
  }

  const response = await userDAO.getUserInfoByUserName(accessToken, userPoolId);

  return {
    statusCode: 200,
    body: response,
  };
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "GET" });
