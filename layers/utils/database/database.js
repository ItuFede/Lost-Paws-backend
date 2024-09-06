"use strict"

const { getDynamoDBExpressions } = require("helpers")
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb")
const { ScanCommand, QueryCommand, GetCommand, UpdateCommand, PutCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb")

const REGION = process.env.REGION
const dynamoDbClient = new DynamoDBClient({ region: "us-east-1" })

exports.list = async (tableName) => {
  const params = {
    TableName: tableName,
  }
  const command = new ScanCommand(params)
  const result = await dynamoDbClient.send(command)

  return result
}

exports.scan = async (tableName, query, maxItems) => {
  console.log("REGION:::", REGION)
  const params = {
    ...query,
    TableName: tableName,
  }

  if (maxItems) params.Limit = parseInt(maxItems)

  const command = new ScanCommand(params)
  const result = await dynamoDbClient.send(command)

  return result
}

exports.query = async (tableName, query, maxItems) => {
  const params = {
    ...query,
    TableName: tableName,
  }

  if (maxItems) params.Limit = maxItems

  const command = new QueryCommand(params)
  const result = await dynamoDbClient.send(command)

  return result
}

exports.get = async (tableName, key) => {
  const params = {
    TableName: tableName,
    Key: key,
  }
  const command = new GetCommand(params)
  const result = await dynamoDbClient.send(command)

  return result
}

exports.create = async (tableName, item) => {
  const params = {
    TableName: tableName,
    Item: item,
  }

  const command = new PutCommand(params)
  const result = await dynamoDbClient.send(command)

  return result
}

exports.update = async (tableName, key, item) => {
  const { conditionExpr, exprAttrVal, exprAttrNames } = getDynamoDBExpressions(item)

  const params = {
    TableName: tableName,
    Key: key,
    UpdateExpression: `SET ${conditionExpr.join(',')}`,
    ExpressionAttributeNames: exprAttrNames,
    ExpressionAttributeValues: exprAttrVal,
    ReturnValues: "ALL_NEW",
  }

  console.log("params:::", params)

  const command = new UpdateCommand(params)
  const result = await dynamoDbClient.send(command)

  return result
}

exports.delete = async (tableName, key) => {
  try {
    const params = {
      TableName: tableName,
      Key: key,
    }
    const command = new DeleteCommand(params)
    await dynamoDbClient.send(command)
  } catch (ex) {
    console.log("Database error", ex)
  }
}
