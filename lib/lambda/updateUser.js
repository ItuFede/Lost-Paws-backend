const { httpErrorWrapper } = require("wrappers");
const { HTTPBadRequestError } = require("httpErrors");
const userDAO = require("userDAO");

const userPoolId = process.env.USER_POOL_ID;

const main = async (event) => {
  const accessToken = event.headers["x-access-token"];
  const body = JSON.parse(event.body);
  const name = body.name;
  const idPets = body.idPets;
  const phone = body.phone;
  const otherPhone = body.otherPhone;
  const socialMedia = body.socialMedia;

  //TODO: Validar campos

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

  try {
    const response = await userDAO.updateUserAttributesAdmin(
      userPoolId,
      accessToken,
      listAttributes
    );
    console.log("response:::", response);
    return {
      statusCode: 200,
      body: { success: true },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error modificando usuario",
        error,
      }),
    };
  }
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: "PUT" });
