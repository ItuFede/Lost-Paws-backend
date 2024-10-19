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

  const email = response.UserAttributes.find(
    (attr) => attr.Name === "email"
  )?.Value;
  const name = response.UserAttributes.find(
    (attr) => attr.Name === "name"
  )?.Value;
  const phone = response.UserAttributes.find(
    (attr) => attr.Name === "custom:phone"
  )?.Value;
  const otherPhone = response.UserAttributes.find(
    (attr) => attr.Name === "custom:otherPhone"
  )?.Value;
  const idPets = response.UserAttributes.find(
    (attr) => attr.Name === "custom:idPets"
  )?.Value;

  /* {"facebook":"","instagram":"","tiktok":""} */
  let socialMedia = response.UserAttributes.find(
    (attr) => attr.Name === "custom:socialMedia"
  )?.Value;

  if (socialMedia) socialMedia = JSON.parse(socialMedia);

  return { email, name, phone, otherPhone, idPets, socialMedia };
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

module.exports = {
  getUser,
  getUserInfoByUserName,
  updateUserAttributes,
  updateUserAttributesAdmin,
  getUserPetIdsByUserName,
};
