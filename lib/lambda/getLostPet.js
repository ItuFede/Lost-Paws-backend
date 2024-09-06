const { httpErrorWrapper } = require('wrappers')
const petDAO = require('petDAO')

const tablePetName = process.env.TABLE_PET_NAME;

const main = async (event, context) => {
  try {

    const lastEvaluatedKey = event.queryStringParameters ? event.queryStringParameters.LastEvaluatedKey : null
    const pagination = event.queryStringParameters ? event.queryStringParameters.pagination : undefined

    //const data = await petDAO.getLostPet(tablePetName, "TRUE").promise();
    const data = await petDAO.scanPet(tablePetName, {
      lastEvaluatedKey,
      pagination,
    })
    return {
      statusCode: 200,
      body: data,
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error fetching item', error }),
    };
  }
};


exports.handler = httpErrorWrapper({ handler: main, httpMethod: 'GET' })
