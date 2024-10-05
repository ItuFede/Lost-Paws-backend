const db = require("database");

const scanVet = async (tableName, { lastEvaluatedKey, pagination }) => {
  console.log("In scanVet");

  let vetScanCommand = {};

  if (lastEvaluatedKey && Object.keys(lastEvaluatedKey).length > 0)
    vetScanCommand.ExclusiveStartKey = lastEvaluatedKey;

  try {
    console.log("VetScan:::", vetScanCommand);
    let dbResult = await db.scan(tableName, vetScanCommand, pagination);
    console.log("dbResultVets:::", dbResult);

    if (!dbResult.Items) {
      return;
    }

    return {
      vets: dbResult.Items,
      LastEvaluatedKey: dbResult.LastEvaluatedKey,
    };
  } catch (error) {
    console.error("Error retrieving vets:", error);
    return { success: false, message: "Error retrieving vets", error };
  }
};

module.exports = {
  scanVet,
};
