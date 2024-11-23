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
  const information = body.information;
  const lostDate = body.lostDate;
  const location = body.location;
  const petId = body.petId;

  if (!information || !lostDate || !location || !petId) {
    console.error("Invalid input parameters:", {
      information,
      lostDate,
      location,
      petId,
    });
    throw new HTTPBadRequestError(
      "Information, lostDate, location (latitude, longitude) and petId are required."
    );
  }

  const timestamp = new Date(lostDate).getTime();

  const missingReportObj = {
    missingDate: timestamp,
    locationsView: [
      {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: timestamp,
      },
    ],
    info: information,
  };

  console.log("missingReportObj:::", missingReportObj);
  const response = await petDAO.updatePetLost(
    tablePetName,
    petId,
    missingReportObj,
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
