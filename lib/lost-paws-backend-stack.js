const { Stack } = require("aws-cdk-lib")
const { existsSync, readFileSync } = require('fs')
const { resolve } = require('path')
const dynamodb = require('aws-cdk-lib/aws-dynamodb');


class LostPawsBackendStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environment = process.env.ENV || process.env.ENVIRONMENT;

    if (!environment) {
      throw new Error("Environment variable 'ENVIRONMENT/ENV' is not defined. Please set it before deploying.");
    }

    let configFilePath = resolve(__dirname, `../enviroment/appSettings.${environment}.json`);

    if (!existsSync(configFilePath)) {
      configFilePath = resolve(__dirname, '../enviroment/appSettings.json');
    }

    const config = JSON.parse(readFileSync(configFilePath, 'utf8'));
    const config_pet_dynamodb = config.DYNAMODB_PET_CONFIG
    const config_user_dynamodb = config.DYNAMODB_USER_CONFIG

    const petTable = new dynamodb.Table(this, config_pet_dynamodb.TABLE_NAME, {
      tableName: config_pet_dynamodb.TABLE_NAME+"_"+environment,
      partitionKey: { name: config_pet_dynamodb.PARTITION_KEY, type: dynamodb.AttributeType.STRING },
      readCapacity: config_pet_dynamodb.READ_CAPACITY_UNITS,
      writeCapacity: config_pet_dynamodb.WRITE_CAPACITY_UNITS,
      // removalPolicy: process.env.ENV == 'dev' || process.env.ENV == 'qa' ? dynamodb.RemovalPolicy.DESTROY : dynamodb.RemovalPolicy.RETAIN
    });

    const userTable = new dynamodb.Table(this, config_user_dynamodb.TABLE_NAME, {
      tableName: config_user_dynamodb.TABLE_NAME+"_"+environment,
      partitionKey: { name: config_user_dynamodb.PARTITION_KEY, type: dynamodb.AttributeType.STRING },
      readCapacity: config_user_dynamodb.READ_CAPACITY_UNITS,
      writeCapacity: config_user_dynamodb.WRITE_CAPACITY_UNITS,
      // removalPolicy: process.env.ENV == 'dev' || process.env.ENV == 'qa' ? dynamodb.RemovalPolicy.DESTROY : dynamodb.RemovalPolicy.RETAIN
    });
    
  }
}

module.exports = { LostPawsBackendStack }