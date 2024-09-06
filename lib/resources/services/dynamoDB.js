const DB = require('aws-cdk-lib/aws-dynamodb');
const { ScanCommand } = require("@aws-sdk/lib-dynamodb")
const dynamoDb = new DB.DocumentClient();

async function createItem(tableName, item) {
  try {
    const params = {
      TableName: tableName,
      Item: item,
    };
    await dynamoDb.put(params).promise();
    return { success: true, message: 'Item created successfully' };
  } catch (error) {
    console.error('Error creating item:', error);
    return { success: false, message: 'Error creating item', error };
  }
}

async function getItem(tableName, key) {
  try {
    const params = {
      TableName: tableName,
      Key: key,
    };
    const data = await dynamoDb.get(params).promise();
    return { success: true, data };
  } catch (error) {
    console.error('Error retrieving item:', error);
    return { success: false, message: 'Error retrieving item', error };
  }
}

async function updateItem(tableName, key, updateExpression, expressionAttributes) {
  try {
    const params = {
      TableName: tableName,
      Key: key,
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributes,
      ReturnValues: 'UPDATED_NEW',
    };
    const data = await dynamoDb.update(params).promise();
    return { success: true, data };
  } catch (error) {
    console.error('Error updating item:', error);
    return { success: false, message: 'Error updating item', error };
  }
}

async function deleteItem(tableName, key) {
  try {
    const params = {
      TableName: tableName,
      Key: key,
    };
    await dynamoDb.delete(params).promise();
    return { success: true, message: 'Item deleted successfully' };
  } catch (error) {
    console.error('Error deleting item:', error);
    return { success: false, message: 'Error deleting item', error };
  }
}

async function scan(tableName, query, maxItems) {

  const params = {
    ...query,
    TableName: tableName,
  }

  if (maxItems) params.Limit = parseInt(maxItems)

  const command = new ScanCommand(params)
  const result = await dynamoDb.send(command)

  return result
}

module.exports = {
  createItem,
  getItem,
  updateItem,
  deleteItem,
  scan
};
