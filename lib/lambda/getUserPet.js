const { httpErrorWrapper } = require("wrappers");
const userDAO = require("userDAO");
const petDAO = require("petDAO");

const userPoolId = process.env.USER_POOL_ID;
const tablePetName = process.env.TABLE_PET_NAME;
const bucketPet = process.env.BUCKET_PETS;

const main = async (event) => {
  const accessToken = event.headers["x-access-token"];

  try {
    const userInfo = await userDAO.getUserInfoByUserName(
      accessToken,
      userPoolId
    );

    console.log("userInfo:::", userInfo);

    let userPets = [];
    if (userInfo) {
      userPets = await petDAO.getUserPets(tablePetName, userInfo.id);
      await Promise.all(
        userPets.pets.map(async (pet) => {
          pet.images = await petDAO.getPetImages(bucketPet, pet.id);
        })
      );
    }

    return {
      statusCode: 200,
      body: userPets.pets,
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
