const { httpErrorWrapper } = require("wrappers");
const petDAO = require("petDAO");

const tablePetName = process.env.TABLE_PET_NAME;

const main = async (event, context) => {
  let response;
  try {
    const body = JSON.parse(event.body);
    const id = body.id;

    const position = {
      latitude: body.latitude,
      longitude: body.longitude,
    };

    if (!id || !position.latitude || !position.longitude) return;

    console.log("DATA:", { id, position, tablePetName });

    response = await petDAO.updateMissingPetState(tablePetName, id, position);

    return {
      statusCode: 200,
      body: response,
    };
  } catch (error) {
    console.error("ERROR", error);
    return response;
  }
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "PUT" });
