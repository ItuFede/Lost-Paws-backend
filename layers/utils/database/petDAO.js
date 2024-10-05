const db = require("database");
const s3 = require("s3");

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
    console.error("Error retrieving pet:", error);
    return { success: false, message: "Error retrieving pets", error };
  }
};

const getPet = async (tableName, id) => {
  console.log("In getPet");

  try {
    const { Item } = await db.get(tableName, { id: id });

    return {
      pet: Item,
    };
  } catch (error) {
    throw new Error(`Error retrieving pet, ${error}`);
  }
};

const getPetImages = async (bucketName, idPet) => {
  let fileNames = await s3.getFiles(bucketName, idPet);
  fileNames = fileNames.filter((obj) => obj.includes(".")); //Remuevo la carpeta
  console.log("FileNames:::", fileNames);

  let images = [];

  for (const fileName of fileNames) {
    try {
      const params = {
        Bucket: bucketName,
        Key: fileName,
      };
      console.log("params:::", params);

      const img = await s3.getObject(params);
      //console.log("img:::", img);

      let base64String;
      if (img) base64String = Buffer.from(img.Body).toString("base64");

      images.push(`data:image/jpeg;base64,${base64String}`);
    } catch (error) {
      console.error("Se ha producido un error:", error.message);
    }
  }

  //console.log("Images:::", images);

  return images;
};

module.exports = {
  updateMissingPetState,
  scanPet,
  getPet,
  getPetImages,
};
