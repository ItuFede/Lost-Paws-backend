const { httpErrorWrapper } = require("wrappers");
const userDAO = require("userDAO");

const userPoolId = process.env.USER_POOL_ID;

const main = async (event) => {
  const accessToken = event.headers["x-access-token"];

  try {
    const response = await userDAO.getUserInfoByUserName(
      accessToken,
      userPoolId
    );
    return {
      statusCode: 200,
      body: response,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error obteniendo información del usuario",
        error,
      }),
    };
  }
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "GET" });
