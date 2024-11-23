const { httpErrorWrapper } = require("wrappers");
const petDAO = require("petDAO");

const tablePetName = process.env.TABLE_PET_NAME;

const main = async (event, context) => {
  const lastEvaluatedKey =
    event.queryStringParameters?.LastEvaluatedKey || null;
  const pagination = event.queryStringParameters?.pagination;

  const data = await petDAO.scanPet(tablePetName, {
    lastEvaluatedKey,
    pagination,
  });

  const lostPets = { pets: data.pets.filter((pet) => pet.isLost === "TRUE") };

  return {
    statusCode: 200,
    body: lostPets,
  };
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "GET" });
