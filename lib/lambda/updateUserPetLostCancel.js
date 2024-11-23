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
  const petId = body.petId;

  if (!petId) {
    console.error("Invalid input parameters:", {
      petId,
    });
    throw new HTTPBadRequestError("PetId are required.");
  }

  const response = await petDAO.updatePetLostCancel(
    tablePetName,
    petId,
    userData.Username
  );

  console.log("response:::", response);
  //TODO: Manejar el success false del response cuando falla

  return {
    statusCode: 200,
    body: { success: true },
  };
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "PUT" });
