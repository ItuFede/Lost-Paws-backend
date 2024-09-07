const db = require("database")

// TODO: Voy a tener que agregar un interface de los users y pets y un historial de las mascotas que se perdieron y encontraron

function generateTimestamp() {
  return Math.floor(Date.now() / 1000);
}

const updateMissingPetState = async (tableName, id, position) => {

  const { Item } = await db.get(tableName, {"id": id})

  if (!Item) {
    throw new Error(`Item with id ${id} not found`)
  }

  if (Item.isLost == "FALSE") {
    throw new Error(`Pet id ${id} is not lost`)
  }

  // missingReports mas actual
  const missingReports = Item.missingReports || []
  const mostRecentReport = missingReports.reduce((latest, report) => {
    return report.missingDate > latest.missingDate ? report : latest
  }, missingReports[0])

  if (!mostRecentReport) {
    throw new Error(`No missing reports found for item with id ${id}`)
  }

  const newLocation = {
    Latitud: position.Latitud,
    Longitud: position.Longitud,
    Timestamp: generateTimestamp(),
  }
  mostRecentReport.locationsView.push(newLocation)
  mostRecentReport.state = "FOUND"
  const updatedItem = {
    isLost: "FALSE",
    missingReports,
  }

  try {
    let dbResultClients = await db.update(tableName, {"id": id}, updatedItem)
    console.log("dbResultClients:::", dbResultClients)
    return dbResultClients

  } catch (error) {
    console.error('Error retrieving pets:', error);
    return { success: false, message: 'Error retrieving pets', error };
  }

}


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
  updateMissingPetState,
  scanPet
};
