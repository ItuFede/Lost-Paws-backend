const { httpErrorWrapper } = require("wrappers");
const {
  HTTPUnauthorizedError,
  HTTPInternalServerError,
} = require("httpErrors");
const userDAO = require("userDAO");
const petDAO = require("petDAO");

const userPoolId = process.env.USER_POOL_ID;
const tablePetName = process.env.TABLE_PET_NAME;
const bucketPet = process.env.BUCKET_PETS;

const main = async (event) => {
  const accessToken = event.headers["x-access-token"];

  if (!accessToken) {
    console.error("Access token is required");
    throw new HTTPUnauthorizedError("Access token is required");
  }

  const userInfo = await userDAO.getUserInfoByUserName(accessToken, userPoolId);
  if (!userInfo) {
    console.error("ERROR:::", userInfo);
    throw new HTTPInternalServerError("Error fetching user information");
  }

  let userPets = [];
  userPets = await petDAO.getUserPets(tablePetName, userInfo.id);
  await Promise.all(
    userPets.pets.map(async (pet) => {
      pet.images = await petDAO.getPetImages(bucketPet, pet.id);
    })
  );

  return {
    statusCode: 200,
    body: userPets.pets,
  };
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "GET" });
