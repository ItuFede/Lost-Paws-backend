const { httpErrorWrapper } = require("wrappers");
const petDAO = require("petDAO");

const bucketPet = process.env.BUCKET_PETS;

const main = async (event, context) => {
  try {
    const id = event.pathParameters.id;

    if (!id) {
      console.error("Id is required");
      throw new Error("Id is required");
    }

    const data = await petDAO.getPetImages(bucketPet, id);
    return {
      statusCode: 200,
      body: data,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Error fetching pet images", error }),
    };
  }
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "GET" });
