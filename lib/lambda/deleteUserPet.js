const { httpErrorWrapper } = require("wrappers");
const {
  HTTPUnauthorizedError,
  HTTPInternalServerError,
  HTTPBadRequestError,
} = require("httpErrors");
const userDAO = require("userDAO");
const petDAO = require("petDAO");

const userPoolId = process.env.USER_POOL_ID;
const tablePetName = process.env.TABLE_PET_NAME;

const main = async (event, context) => {
  const accessToken = event.headers["x-access-token"];

  const { id } = event.pathParameters;

  if (!id) {
    console.error("Pet ID is required");
    throw new HTTPBadRequestError("Pet ID is required");
  }

  if (!accessToken) {
    console.error("Access token is required");
    throw new HTTPUnauthorizedError("Access token is required");
  }

  const userData = await userDAO.isValidToken(accessToken, userPoolId);
  if (!userData) {
    console.error("ERROR:::", userData);
    throw new HTTPInternalServerError("Error fetching user information");
  }

  const response = await petDAO.deletePet(tablePetName, id, userData.Username);

  console.log("response:::", response);

  return {
    statusCode: 200,
    body: { success: true },
  };
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "DELETE" });
