const { httpErrorWrapper } = require("wrappers");
const { HTTPUnauthorizedError, HTTPBadRequestError } = require("httpErrors");
const userDAO = require("userDAO");

const userPoolId = process.env.USER_POOL_ID;

const main = async (event) => {
  const accessToken = event.headers["x-access-token"];

  if (!accessToken) {
    console.error("Access token is required");
    throw new HTTPUnauthorizedError("Access token is required");
  }

  const body = JSON.parse(event.body);
  const name = body.name;
  const idPets = body.idPets;
  const phone = body.phone;
  const otherPhone = body.otherPhone;
  const socialMedia = body.socialMedia;

  if (!name && !idPets && !phone && !otherPhone && !socialMedia) {
    console.error("At least one attribute is required to update");
    throw new HTTPBadRequestError(
      "At least one attribute (name, idPets, phone, otherPhone, socialMedia) is required"
    );
  }

  let listAttributes = [];

  if (name) {
    listAttributes.push({
      Name: "name",
      Value: name,
    });
  }

  if (idPets) {
    listAttributes.push({
      Name: "custom:idPets",
      Value: JSON.stringify(idPets),
    });
  }

  if (phone) {
    listAttributes.push({
      Name: "custom:phone",
      Value: phone,
    });
  }

  if (otherPhone) {
    listAttributes.push({
      Name: "custom:otherPhone",
      Value: otherPhone,
    });
  }

  if (socialMedia) {
    listAttributes.push({
      Name: "custom:socialMedia",
      Value: JSON.stringify(socialMedia),
    });
  }

  const response = await userDAO.updateUserAttributesAdmin(
    userPoolId,
    accessToken,
    listAttributes
  );

  return {
    statusCode: 200,
    body: { success: true },
  };
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "PUT" });
