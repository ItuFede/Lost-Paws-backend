const uuid = require("uuid");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function shortenUUID(uuid) {
  const hash = crypto.createHash("md5").update(uuid).digest("hex");
  return hash.substring(0, 8);
}

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
  const decoded = jwt.decode(token);
  return decoded.username;
};

module.exports = {
  generateUUID,
  getUserNameByJWT,
  getDynamoDBExpressions,
  getDynamoDBArrayExpression,
};
