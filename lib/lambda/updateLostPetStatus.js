const { httpErrorWrapper } = require('wrappers')
const petDAO = require('petDAO')

const tablePetName = process.env.TABLE_PET_NAME;

const main = async (event, context) => {
  try {

    const body = JSON.parse(event.body)
    const id = body.id

    const position = {
      Latitud: body.Latitud, //body.latitude,
      Longitud: body.Longitud //body.longitude
    }

    if (!id || !position.Latitud || !position.Longitud) return

    const result = await petDAO.updateMissingPetState(tablePetName, id, position)

    return {
      statusCode: 200,
      body: result
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: { message: 'Error updating item', error },
    };
  }
};

exports.handler = httpErrorWrapper({ handler: main, httpMethod: 'PUT' })