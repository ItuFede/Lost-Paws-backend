const { httpErrorWrapper } = require("wrappers");
const { HTTPBadRequestError } = require("httpErrors");
const petDAO = require("petDAO");

const tablePetName = process.env.TABLE_PET_NAME;

const main = async (event, context) => {
  let response;
  const body = JSON.parse(event.body);
  const id = body.id;

  const position = {
    latitude: body.latitude,
    longitude: body.longitude,
  };

  if (!id || !position.latitude || !position.longitude) {
    console.error("Invalid input parameters:", { id, position });
    throw new HTTPBadRequestError(
      "Id and position (latitude, longitude) are required."
    );
  }

  return await petDAO.updateMissingPetState(tablePetName, id, position);
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "PUT" });
