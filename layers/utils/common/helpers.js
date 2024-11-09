const uuid = require("uuid");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function shortenUUID(uuid) {
  const hash = crypto.createHash("md5").update(uuid).digest("hex");
  return hash.substring(0, 8);
}

const generateUUIDV4 = () => {
  console.log("In generateUUIDV4");
  return uuid.v4();
};

const generateUUID = () => {
  console.log("In generateUUID");

  const newUUID = uuid.v4();
  return shortenUUID(newUUID);
};

const getDynamoDBArrayExpression = (array, prefix = "v") => {
  const expressionAttributeArray = array.reduce((acc, v, i) => {
    acc[`:${prefix}${i}`] = v;
    return acc;
  }, {});

  const filterExpresionArray = Object.keys(expressionAttributeArray).toString();

  return { expressionAttributeArray, filterExpresionArray };
};

const getDynamoDBExpressions = (attr) => {
  const entries = Object.entries(attr);

  const conditionExpr = entries.map(([k], i) => `#k${i} = :v${i}`);

  const exprAttrVal = entries.reduce((acc, [_, v], i) => {
    acc[`:v${i}`] = v;
    return acc;
  }, {});

  const exprAttrNames = entries.reduce((acc, [k, _], i) => {
    acc[`#k${i}`] = k;
    return acc;
  }, {});

  return { conditionExpr, exprAttrVal, exprAttrNames };
};

const getUserNameByJWT = (token) => {
  console.log("on getUserNameByJWT");
  const decoded = jwt.decode(token);

  console.log("decoded:::", decoded);
  if (!decoded) {
    console.error("Token inválido");
    throw new Error("Token inválido");
  }

  const currentTime = Math.floor(Date.now() / 1000);
  if (decoded.exp < currentTime) {
    console.error(
      "Token caducado:::",
      `decoded.payload.exp: ${decoded.exp}, currentTime: ${currentTime}`
    );
    throw new Error("Token caducado");
  }

  console.log("exit getUserNameByJWT");
  return decoded.username;
};

module.exports = {
  generateUUID,
  generateUUIDV4,
  getUserNameByJWT,
  getDynamoDBExpressions,
  getDynamoDBArrayExpression,
};
