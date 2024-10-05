const { httpErrorWrapper } = require("wrappers");
const { HTTPNotFoundError } = require("httpErrors");
const petDAO = require("petDAO");

const tablePetName = process.env.TABLE_PET_NAME;

const main = async (event, context) => {
  const id = event.pathParameters.id;

  if (!id) {
    console.error("Id is required");
    throw new Error("Id is required");
  }

  const data = await petDAO.getPet(tablePetName, id);
  console.log("data:::", data);

  if (!data.pet) {
    console.error(`Pet with id ${id} not found`);
    return new HTTPNotFoundError();
  }

  return {
    statusCode: 200,
    body: data,
  };
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "GET" });
