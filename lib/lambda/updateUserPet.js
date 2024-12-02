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
const bucketPet = process.env.BUCKET_PETS;

const main = async (event, context) => {
  const accessToken = event.headers["x-access-token"];

  if (!accessToken) {
    console.error("Access token is required");
    throw new HTTPUnauthorizedError("Access token is required");
  }

  const userData = await userDAO.isValidToken(accessToken, userPoolId);
  if (!userData) {
    console.error("ERROR:::", userData);
    throw new HTTPInternalServerError("Error fetching user information");
  }

  const body = JSON.parse(event.body);
  console.log("body:::", body);

  const response = await petDAO.updateUserPet(
    body,
    userData.Username,
    bucketPet,
    tablePetName
  );

  console.log("response:::", response);

  return {
    statusCode: 200,
    body: { success: true },
  };
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "PUT" });
