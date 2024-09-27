const { Stack } = require("aws-cdk-lib");
const { existsSync, readFileSync } = require("fs");
const { resolve } = require("path");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const path = require("path");

class LostPawsBackendStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environment = process.env.ENV || process.env.ENVIRONMENT;

    if (!environment) {
      throw new Error(
        "Environment variable 'ENVIRONMENT/ENV' is not defined. Please set it before deploying."
      );
    }

    let configFilePath = resolve(
      __dirname,
      `../enviroment/appSettings.${environment}.json`
    );

    if (!existsSync(configFilePath)) {
      configFilePath = resolve(__dirname, "../enviroment/appSettings.json");
    }

    const config = JSON.parse(readFileSync(configFilePath, "utf8"));
    const config_pet_dynamodb = config.DYNAMODB_PET_CONFIG;
    const config_user_dynamodb = config.DYNAMODB_USER_CONFIG;
    const config_vet_dynamodb = config.DYNAMODB_VET_CONFIG;

    const petTable = new dynamodb.Table(this, config_pet_dynamodb.TABLE_NAME, {
      tableName: config_pet_dynamodb.TABLE_NAME,
      partitionKey: {
        name: config_pet_dynamodb.PARTITION_KEY,
        type: dynamodb.AttributeType.STRING,
      },
      readCapacity: config_pet_dynamodb.READ_CAPACITY_UNITS,
      writeCapacity: config_pet_dynamodb.WRITE_CAPACITY_UNITS,
      // removalPolicy: process.env.ENV == 'dev' || process.env.ENV == 'qa' ? dynamodb.RemovalPolicy.DESTROY : dynamodb.RemovalPolicy.RETAIN
    });

    const userTable = new dynamodb.Table(
      this,
      config_user_dynamodb.TABLE_NAME,
      {
        tableName: config_user_dynamodb.TABLE_NAME,
        partitionKey: {
          name: config_user_dynamodb.PARTITION_KEY,
          type: dynamodb.AttributeType.STRING,
        },
        readCapacity: config_user_dynamodb.READ_CAPACITY_UNITS,
        writeCapacity: config_user_dynamodb.WRITE_CAPACITY_UNITS,
        // removalPolicy: process.env.ENV == 'dev' || process.env.ENV == 'qa' ? dynamodb.RemovalPolicy.DESTROY : dynamodb.RemovalPolicy.RETAIN
      }
    );

    const vetTable = new dynamodb.Table(this, config_vet_dynamodb.TABLE_NAME, {
      tableName: config_vet_dynamodb.TABLE_NAME,
      partitionKey: {
        name: config_vet_dynamodb.PARTITION_KEY,
        type: dynamodb.AttributeType.STRING,
      },
      readCapacity: config_vet_dynamodb.READ_CAPACITY_UNITS,
      writeCapacity: config_vet_dynamodb.WRITE_CAPACITY_UNITS,
      // removalPolicy: process.env.ENV == 'dev' || process.env.ENV == 'qa' ? dynamodb.RemovalPolicy.DESTROY : dynamodb.RemovalPolicy.RETAIN
    });

    const utilsLayer = new lambda.LayerVersion(this, "UtilsLayer", {
      code: lambda.Code.fromAsset(path.join(__dirname, "../layers/utils")),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
    });

    const getLostPetLambda = new lambda.Function(this, "getLostPet", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "getLostPet.handler",
      code: lambda.Code.fromAsset("lib/lambda"),
      layers: [utilsLayer],
      environment: {
        TABLE_PET_NAME: petTable.tableName,
      },
    });

    petTable.grantReadData(getLostPetLambda);

    const getPetLambda = new lambda.Function(this, "getPet", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "getPet.handler",
      code: lambda.Code.fromAsset("lib/lambda"),
      layers: [utilsLayer],
      environment: {
        TABLE_PET_NAME: petTable.tableName,
      },
    });

    petTable.grantReadData(getPetLambda);

    const getVetsLambda = new lambda.Function(this, "getVets", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "getVets.handler",
      code: lambda.Code.fromAsset("lib/lambda"),
      layers: [utilsLayer],
      environment: {
        TABLE_VET_NAME: vetTable.tableName,
      },
    });

    vetTable.grantReadData(getVetsLambda);

    const updateLostPetStatusLambda = new lambda.Function(
      this,
      "updateLostPetStatus",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: "updateLostPetStatus.handler",
        code: lambda.Code.fromAsset("lib/lambda"),
        layers: [utilsLayer],
        environment: {
          TABLE_PET_NAME: petTable.tableName,
        },
      }
    );

    petTable.grantReadWriteData(updateLostPetStatusLambda);

    const lostAndPawsApi = new apigateway.RestApi(this, "LostAndPawsApi", {
      restApiName: "LostAndPawsApi",
      defaultCorsPreflightOptions: {
        allowHeaders: [apigateway.Cors.DEFAULT_HEADERS],
        allowMethods: [apigateway.Cors.ALL_METHODS],
        allowOrigins: [apigateway.Cors.ALL_ORIGINS],
      },
    });

    const pets = lostAndPawsApi.root.addResource("pets");
    const pet = pets.addResource("{id}");
    const lost = pets.addResource("lost");

    const vets = lostAndPawsApi.root.addResource("vets");

    pets.addMethod("GET", new apigateway.LambdaIntegration(getLostPetLambda), {
      apiKeyRequired: true,
    });

    pet.addMethod("GET", new apigateway.LambdaIntegration(getPetLambda), {
      apiKeyRequired: true,
    });

    vets.addMethod("GET", new apigateway.LambdaIntegration(getVetsLambda), {
      apiKeyRequired: true,
    });

    lost.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateLostPetStatusLambda),
      {
        apiKeyRequired: true,
      }
    );

    const apiKey = new apigateway.ApiKey(this, "ApiKey");

    const usagePlan = new apigateway.UsagePlan(this, "UsagePlan", {
      name: "BasicUsagePlan",
      apiStages: [{ lostAndPawsApi, stage: lostAndPawsApi.deploymentStage }],
    });

    usagePlan.addApiKey(apiKey);
  }
}

module.exports = { LostPawsBackendStack };
