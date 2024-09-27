const db = require("database");

// TODO: Voy a tener que agregar un interface de los users y pets y un historial de las mascotas que se perdieron y encontraron

function generateTimestamp() {
  return Math.floor(Date.now() / 1000);
}

const updateMissingPetState = async (tableName, id, position) => {
  const { Item } = await db.get(tableName, { id: id });

  if (!Item) {
    console.error(`Item with id ${id} not found`);
    throw new Error(`Item with id ${id} not found`);
  }

  if (Item.isLost == "FALSE") {
    console.error(`Pet id ${id} is not lost`);
    throw new Error(`Pet id ${id} is not lost`);
  }

  const missingReport = Item.missingReport;

  const newLocation = {
    latitude: position.latitude,
    longitude: position.longitude,
    timestamp: generateTimestamp(),
  };
  missingReport.locationsView.push(newLocation);
  const updatedItem = {
    isLost: "FALSE",
    missingReport,
  };

  try {
    let dbResult = await db.update(tableName, { id: id }, updatedItem);
    console.log("dbResultPets:::", dbResult);
    return dbResult;
  } catch (error) {
    console.error("Error retrieving pets:", error);
    return { success: false, message: "Error retrieving pets", error };
  }
};

const scanPet = async (tableName, { lastEvaluatedKey, pagination }) => {
  console.log("In scanPet");

  let petScanCommand = {};

  if (lastEvaluatedKey && Object.keys(lastEvaluatedKey).length > 0)
    petScanCommand.ExclusiveStartKey = lastEvaluatedKey;

  try {
    console.log("PetScan:::", petScanCommand);
    let dbResult = await db.scan(tableName, petScanCommand, pagination);
    console.log("dbResultPets:::", dbResult);

    if (!dbResult.Items) {
      return;
    }

    return {
      pets: dbResult.Items,
      LastEvaluatedKey: dbResult.LastEvaluatedKey,
    };
  } catch (error) {
    console.error("Error retrieving pets:", error);
    return { success: false, message: "Error retrieving pets", error };
  }
};

const getPet = async (tableName, id) => {
  console.log("In getPet");

  try {
    const { Item } = await db.get(tableName, { id: id });

    if (!Item) {
      throw new Error(`Item with id ${id} not found`);
    }

    return {
      pet: Item,
    };
  } catch (error) {
    console.error("Error retrieving pets", error);
    return { success: false, message: "Error retrieving pet", error };
  }
};

module.exports = {
  updateMissingPetState,
  scanPet,
  getPet,
};
