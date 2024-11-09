const {
  CognitoIdentityProviderClient,
  AdminUpdateUserAttributesCommand,
  UpdateUserAttributesCommand,
  AdminGetUserCommand,
  GetUserCommand,
} = require("@aws-sdk/client-cognito-identity-provider");
const { getUserNameByJWT } = require("helpers");

const client = new CognitoIdentityProviderClient({ region: "us-east-1" });

const getUser = async (accessToken) => {
  const command = new GetUserCommand({
    AccessToken: accessToken,
  });

  const response = await client.send(command);
  return response;
};

const getUserInfoByUserName = async (token, userPoolId) => {
  const username = getUserNameByJWT(token);

  console.log("username", username);

  const command = new AdminGetUserCommand({
    UserPoolId: userPoolId,
    Username: username,
  });

  const response = await client.send(command);
  console.log("response", response);

  const getValue = (fieldName) =>
    response.UserAttributes.find((attr) => attr.Name === fieldName)?.Value;

  const id = getValue("sub");
  const email = getValue("email");
  const name = getValue("name");
  const phone = getValue("custom:phone");
  const otherPhone = getValue("custom:otherPhone");
  const idPets = getValue("custom:idPets");

  /* {"facebook":"","instagram":"","tiktok":""} */
  const originalSocialMedia = getValue("custom:socialMedia");
  const socialMedia = originalSocialMedia
    ? JSON.parse(originalSocialMedia)
    : undefined;

  return { id, email, name, phone, otherPhone, idPets, socialMedia };
};

const getUserPetIdsByUserName = async (token, userPoolId) => {
  const username = getUserNameByJWT(token);

  console.log("username", username);

  const command = new AdminGetUserCommand({
    UserPoolId: userPoolId,
    Username: username,
  });

  const response = await client.send(command);
  console.log("response", response);

  /* {"idPets":["id1", "id2", ...]} */
  let ids = [];

  if (
    response.UserAttributes &&
    response.UserAttributes.some((attr) => attr.Name === "custom:idPets")
  ) {
    ids =
      response.UserAttributes.find((attr) => attr.Name === "custom:idPets")
        ?.Value || [];
  }

  if (ids.length > 0) ids = JSON.parse(ids).idPets;

  return ids;
};

const updateUserAttributes = async (accessToken, phoneNumber) => {
  const command = new UpdateUserAttributesCommand({
    AccessToken: accessToken,
    UserAttributes: [
      {
        Name: "phone_number",
        Value: phoneNumber,
      },
    ],
  });

  return await client.send(command);
};

const updateUserAttributesAdmin = async (userPoolId, token, listAttributes) => {
  const username = getUserNameByJWT(token);

  console.log("DATA:::", { listAttributes, username, userPoolId });

  const command = new AdminUpdateUserAttributesCommand({
    UserPoolId: userPoolId,
    Username: username,
    UserAttributes: listAttributes,
  });

  return await client.send(command);
};

const isValidToken = async (token, userPoolId) => {
  try {
    const username = getUserNameByJWT(token);
    const command = new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    });

    return await client
      .send(command)
      .then((userData) => userData)
      .catch((e) => {
        console.error("ERROR:::", e);
        throw new Error("Token inválido o usuario no autorizado");
      });
  } catch (error) {
    console.error("Error de validación de token:", error.message);
    throw new Error("Token inválido o usuario no autorizado");
  }
};

module.exports = {
  getUser,
  getUserInfoByUserName,
  updateUserAttributes,
  updateUserAttributesAdmin,
  getUserPetIdsByUserName,
  isValidToken,
};
