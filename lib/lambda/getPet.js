const { httpErrorWrapper } = require("wrappers");
const { HTTPNotFoundError, HTTPBadRequestError } = require("httpErrors");
const petDAO = require("petDAO");

const tablePetName = process.env.TABLE_PET_NAME;

const main = async (event, context) => {
  const id = event.pathParameters.id;

  if (!id) {
    console.error("Id is required");
    throw new HTTPBadRequestError("Id is required");
  }

  const data = await petDAO.getPet(tablePetName, id);
  console.log("data:::", data);

  if (!data.pet) {
    console.error(`Pet with id ${id} not found`);
    throw new HTTPNotFoundError(`Pet with id ${id} not found`);
  }

  return {
    statusCode: 200,
    body: data,
  };
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "GET" });
