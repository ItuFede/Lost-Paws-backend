const db = require("database");
const s3 = require("s3");
const { generateUUIDV4 } = require("helpers");

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

const updatePetLost = async (tableName, petId, missingReport, ownerId) => {
  const { Item } = await db.get(tableName, { id: petId });

  if (!Item) {
    console.error(`Item with petId ${petId} not found`);
    throw new Error(`Item with petId ${petId} not found`);
  }

  if (Item.ownerId != ownerId) {
    console.error(`Item is not from the same owner`);
    throw new Error(`Item is not from the same owner`);
  }

  if (Item.isLost == "TRUE") {
    console.error(`Pet petId ${petId} is already missing`);
    throw new Error(`Pet petId ${petId} is already missing`);
  }

  const updatedItem = {
    isLost: "TRUE",
    missingReport,
  };

  try {
    let dbResult = await db.update(tableName, { id: petId }, updatedItem);
    console.log("dbResultPets:::", dbResult);
    return dbResult;
  } catch (error) {
    console.error("Error updating pet:", error);
    return { success: false, message: "Error updating pet", error };
  }
};

const updatePetLostCancel = async (tableName, petId, ownerId) => {
  const { Item } = await db.get(tableName, { id: petId });

  if (!Item) {
    console.error(`Item with petId ${petId} not found`);
    throw new Error(`Item with petId ${petId} not found`);
  }

  if (Item.ownerId != ownerId) {
    console.error(`Item is not from the same owner`);
    throw new Error(`Item is not from the same owner`);
  }

  if (Item.isLost == "FALSE") {
    console.error(`Pet petId ${petId} is not missing`);
    throw new Error(`Pet petId ${petId} is not missing`);
  }

  const updatedItem = {
    isLost: "FALSE",
    missingReport: {},
  };

  try {
    let dbResult = await db.update(tableName, { id: petId }, updatedItem);
    console.log("dbResultPets:::", dbResult);
    return dbResult;
  } catch (error) {
    console.error("Error updating pet:", error);
    return { success: false, message: "Error updating pet", error };
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
    console.log("DATA getPet:::", { tableName, id });
    const { Item } = await db.get(tableName, { id: id });
    console.log("DATA getPet:::", { tableName, id, Item });

    return {
      pet: Item,
    };
  } catch (error) {
    throw new Error(`Error retrieving pet, ${error}`);
  }
};

const getUserPets = async (tableName, ownerId) => {
  console.log("In getUserPets");

  const params = {
    IndexName: "OwnerIdIndex",
    KeyConditionExpression: "ownerId = :ownerId",
    ExpressionAttributeValues: {
      ":ownerId": ownerId,
    },
  };

  console.log("DATA getUserPets:::", { tableName, ownerId, params });

  try {
    const { Items } = await db.query(tableName, params, null);

    return {
      pets: Items,
    };
  } catch (error) {
    throw new Error(`Error retrieving pets, ${error}`);
  }
};

const getPetImages = async (bucketName, idPet) => {
  let fileNames = await s3.getFiles(bucketName, idPet);
  fileNames = fileNames.filter((obj) => obj.includes(".")); //Remuevo la carpeta
  console.log("FileNames:::", fileNames);

  let images = [];

  await Promise.all(
    fileNames.map(async (fileName) => {
      try {
        const params = {
          Bucket: bucketName,
          Key: fileName,
        };
        console.log("params:::", params);

        const img = await s3.getObject(params);
        console.log("On getPetImages - img:::", img);

        let base64String;
        if (img && img.Body) {
          base64String = Buffer.from(img.Body).toString("base64");
        }
        console.log("On getPetImages - base64String:::", base64String);
        images.push(`data:image/jpeg;base64,${base64String}`);
      } catch (error) {
        console.error("Se ha producido un error:", error.message);
      }
    })
  );

  return images;
};

const deletePet = async (tableName, petId, ownerId) => {
  const { Item } = await db.get(tableName, { id: petId });

  if (!Item) {
    console.error(`Item with petId ${petId} not found`);
    throw new Error(`Item with petId ${petId} not found`);
  }

  if (Item.ownerId != ownerId) {
    console.error(`Item is not from the same owner`);
    throw new Error(`Item is not from the same owner`);
  }

  try {
    let dbResult = await db.delete(tableName, { id: petId });
    console.log("dbResultPets:::", dbResult);
    return dbResult;
  } catch (error) {
    console.error("Error deleting pet:", error);
    return { success: false, message: "Error deleting pet", error };
  }
};

const base64ToBuffer = (base64String) => {
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
  return Buffer.from(base64Data, "base64");
};

const registerPet = async (
  body,
  userId,
  phoneNumber,
  bucketName,
  tablePetName
) => {
  const UUIDV4 = generateUUIDV4();

  console.log("registerPet:::", {
    UUIDV4,
    body,
    userId,
    bucketName,
    tablePetName,
  });

  for (let index = 0; index < body.images.length; index++) {
    try {
      const imageBase64 = body.images[index].base64;

      const buffer = base64ToBuffer(imageBase64);
      await s3.uploadFile(
        bucketName,
        UUIDV4,
        "image_" + index + ".jfif", //TODO: Extension
        buffer
      );
    } catch (error) {
      console.error("ERROR:::", error);
      throw new Error("Error al guardar el archivo en S3", error);
    }
  }

  const newPet = {
    id: UUIDV4,
    age: body.birthDate,
    animal: body.animal,
    breed: body.breed,
    characteristics: body.characteristics,
    description: body.description,
    generalColor: body.colors,
    isLost: "FALSE",
    missingReport: {},
    name: body.name,
    ownerId: userId,
    phoneNumberOwner: phoneNumber,
    sex: body.sex,
    size: body.size,
    medicalTreatment: body.medicalTreatment,
  };

  return await db.create(tablePetName, newPet);
};

async function clearFolderAndUploadImages(bucketName, folderName, images) {
  try {
    // Limpio S3
    await s3.deleteFiles(bucketName, folderName);

    for (let index = 0; index < images.length; index++) {
      try {
        const imageBase64 = images[index].base64 || images[index];
        const buffer = base64ToBuffer(imageBase64);

        await s3.uploadFile(
          bucketName,
          folderName,
          "image_" + index + ".jfif", // TODO: Cambiar extensión si es necesario
          buffer
        );
      } catch (error) {
        console.error("ERROR:::", error);
        throw new Error("Error al guardar el archivo en S3");
      }
    }

    console.log("Todas las imágenes fueron subidas exitosamente.");
  } catch (error) {
    console.error("Error al limpiar la carpeta o subir las imágenes:", error);
    throw error;
  }
}

const updateUserPet = async (body, userId, bucketName, tablePetName) => {
  const { Item } = await db.get(tablePetName, { id: body.id });

  if (!Item) {
    console.error(`Item with petId ${body.id} not found`);
    throw new Error(`Item with petId ${body.id} not found`);
  }

  if (Item.ownerId != userId) {
    console.error(`Item is not from the same owner`);
    throw new Error(`Item is not from the same owner`);
  }

  await clearFolderAndUploadImages(bucketName, body.id, body.images);

  const updatePet = {
    age: body.birthDate,
    animal: body.animal,
    breed: body.breed,
    characteristics: body.characteristics,
    description: body.description,
    generalColor: body.colors,
    name: body.name,
    sex: body.sex,
    size: body.size,
    medicalTreatment: body.medicalTreatment,
  };

  return await db.update(tablePetName, { id: body.id }, updatePet);
};

module.exports = {
  updateMissingPetState,
  updatePetLost,
  updatePetLostCancel,
  scanPet,
  getPet,
  getUserPets,
  updateUserPet,
  getPetImages,
  registerPet,
  deletePet,
};
