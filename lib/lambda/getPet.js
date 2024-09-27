const { httpErrorWrapper } = require("wrappers");
const petDAO = require("petDAO");

const tablePetName = process.env.TABLE_PET_NAME;

const main = async (event, context) => {
  try {
    const id = event.pathParameters.id;

    if (!id) {
      console.error("Id is required");
      throw new Error("Id is required");
    }

    const data = await petDAO.getPet(tablePetName, id);
    return {
      statusCode: 200,
      body: data,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error fetching pet", error }),
    };
  }
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "GET" });
