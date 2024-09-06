const db = require("dynamoDB")

// TODO: Voy a tener que agregar un interface de los users y pets y un historial de las mascotas que se perdieron y encontraron

/*
async function getLostPet(tableName, isLost) {
  const params = {
    TableName: tableName,
    IndexName: 'IsLostIndex',
    KeyConditionExpression: 'isLost = :isLost',
    ExpressionAttributeValues: {
      ':isLost': isLost,
    },
  };

  try {
    const data = await db.query(params).promise();
    return { success: true, data };
  } catch (error) {
    console.error('Error retrieving lost pets:', error);
    return { success: false, message: 'Error retrieving lost pets', error };
  }
};
*/

const scanPet = async (tableName, { lastEvaluatedKey, pagination }) => {
  console.log("In scanPet")

  let petScanCommand = {}

  if (lastEvaluatedKey && Object.keys(lastEvaluatedKey).length > 0) petScanCommand.ExclusiveStartKey = lastEvaluatedKey

  try {
    console.log("PetScan:::", petScanCommand)
    let dbResultClients = await db.scan(tableName, petScanCommand, pagination)
    console.log("dbResultClients:::", dbResultClients)

    if (!dbResultClients.Items) {
      return
    }

    return { pets: dbResultClients.Items, LastEvaluatedKey: dbResultClients.LastEvaluatedKey }
  } catch (error) {
    console.error('Error retrieving pets:', error);
    return { success: false, message: 'Error retrieving pets', error };
  }
}

module.exports = {
  getLostPet,
  scanPet
};
