const { httpErrorWrapper } = require("wrappers");
const userDAO = require("userDAO");
const petDAO = require("petDAO");

const userPoolId = process.env.USER_POOL_ID;
const tablePetName = process.env.TABLE_PET_NAME;
const bucketPet = process.env.BUCKET_PETS;

const main = async (event) => {
  const accessToken = event.headers["x-access-token"];

  try {
    const petIds = await userDAO.getUserPetIdsByUserName(
      accessToken,
      userPoolId
    );

    console.log("petIds:::", petIds);

    let userPets = [];
    if (petIds.length > 0) {
      for (const petId of petIds) {
        const petInfo = await petDAO.getPet(tablePetName, petId);
        petInfo.pet.images = await petDAO.getPetImages(bucketPet, petId);
        userPets.push(petInfo.pet);
      }
    }

    console.log("userPets:::", userPets);

    return {
      statusCode: 200,
      body: userPets,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error obteniendo información del usuario",
        error,
      }),
    };
  }
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "GET" });
