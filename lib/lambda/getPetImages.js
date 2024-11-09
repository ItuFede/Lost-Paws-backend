const { httpErrorWrapper } = require("wrappers");
const { HTTPBadRequestError } = require("httpErrors");
const petDAO = require("petDAO");

const bucketPet = process.env.BUCKET_PETS;

const main = async (event, context) => {
  const id = event.pathParameters.id;

  if (!id) {
    console.error("Id is required");
    throw new HTTPBadRequestError("Id is required");
  }

  const data = await petDAO.getPetImages(bucketPet, id);
  return {
    statusCode: 200,
    body: data,
  };
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "GET" });
