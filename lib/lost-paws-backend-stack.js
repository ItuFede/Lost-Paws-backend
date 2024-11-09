const { Stack, CfnOutput } = require("aws-cdk-lib");
const { existsSync, readFileSync } = require("fs");
const { resolve } = require("path");
const lambda = require("aws-cdk-lib/aws-lambda");
const apigateway = require("aws-cdk-lib/aws-apigateway");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
const path = require("path");
const { Bucket } = require("aws-cdk-lib/aws-s3");
const { RemovalPolicy, Duration } = require("aws-cdk-lib");
const cognito = require("aws-cdk-lib/aws-cognito");
const { PolicyStatement } = require("aws-cdk-lib/aws-iam");

class LostPawsBackendStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    //#region ENVIRONMENT VARIABLES
    const environment = process.env.ENV || process.env.ENVIRONMENT || "dev";

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
    //const config_user_dynamodb = config.DYNAMODB_USER_CONFIG; //TODO: DELETE?
    const config_vet_dynamodb = config.DYNAMODB_VET_CONFIG;

    //#endregion

    //#region COGNITO

    // 1. Crear el User Pool
    const userPool = new cognito.UserPool(this, "LostAndPawsUserPool", {
      userPoolName: "lost-and-paws-user-pool",
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: { email: true },
      standardAttributes: {
        fullname: {
          required: true,
          mutable: true,
        },
      },
      customAttributes: {
        idPets: new cognito.StringAttribute({
          minLen: 0,
          maxLen: 255,
          mutable: true,
        }),
        phone: new cognito.StringAttribute({
          minLen: 0,
          maxLen: 50,
          mutable: true,
        }),
        otherPhone: new cognito.StringAttribute({
          minLen: 0,
          maxLen: 50,
          mutable: true,
        }),
        socialMedia: new cognito.StringAttribute({
          minLen: 0,
          maxLen: 255,
          mutable: true,
        }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    // Dominio para Hosted UI
    const userPoolDomain = new cognito.UserPoolDomain(this, "UserPoolDomain", {
      userPool,
      cognitoDomain: {
        domainPrefix: "lnp-login", // Subdominio personalizado para el Hosted UI
      },
    });

    const userPoolClient = new cognito.UserPoolClient(
      this,
      "LostAndPawsUserPoolClient",
      {
        userPool,
        generateSecret: false,
        authFlows: {
          userPassword: true,
          adminUserPassword: true,
        },
        oAuth: {
          flows: {
            authorizationCodeGrant: true,
          },
          scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID],
          callbackUrls: [config.LOG_IN_URL],
          logoutUrls: [config.LOG_OUT_URL],
        },
      }
    );

    const authorizerCognito = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "UserAuthorizer",
      {
        cognitoUserPools: [userPool],
      }
    );

    // OUTPUTS en consola
    new CfnOutput(this, "HostedUIDomain", {
      value: userPoolDomain.domainName,
    });

    new CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });

    //#endregion

    //#region S3
    const bucket = new Bucket(this, config.BUCKET_PET_NAME, {
      bucketName: config.BUCKET_PET_NAME,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const petTable = new dynamodb.Table(this, config_pet_dynamodb.TABLE_NAME, {
      tableName: config_pet_dynamodb.TABLE_NAME,
      partitionKey: {
        name: config_pet_dynamodb.PARTITION_KEY,
        type: dynamodb.AttributeType.STRING,
      },
      readCapacity: config_pet_dynamodb.READ_CAPACITY_UNITS,
      writeCapacity: config_pet_dynamodb.WRITE_CAPACITY_UNITS,
      removalPolicy:
        environment == "dev" || environment == "qa"
          ? RemovalPolicy.DESTROY
          : RemovalPolicy.RETAIN,
    });

    petTable.addGlobalSecondaryIndex({
      indexName: "OwnerIdIndex",
      partitionKey: {
        name: "ownerId",
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    /*
    //TODO: DELETE?
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
        removalPolicy:
          environment == "dev" || environment == "qa"
            ? dynamodb.RemovalPolicy.DESTROY
            : RemovalPolicy.RETAIN,
      }
    );
    */

    const vetTable = new dynamodb.Table(this, config_vet_dynamodb.TABLE_NAME, {
      tableName: config_vet_dynamodb.TABLE_NAME,
      partitionKey: {
        name: config_vet_dynamodb.PARTITION_KEY,
        type: dynamodb.AttributeType.STRING,
      },
      readCapacity: config_vet_dynamodb.READ_CAPACITY_UNITS,
      writeCapacity: config_vet_dynamodb.WRITE_CAPACITY_UNITS,
      removalPolicy:
        environment == "dev" || environment == "qa"
          ? RemovalPolicy.DESTROY
          : RemovalPolicy.RETAIN,
    });

    //#endregion

    //#region LAMBDAS

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

    const getPetImagesLambda = new lambda.Function(this, "getPetImages", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "getPetImages.handler",
      code: lambda.Code.fromAsset("lib/lambda"),
      layers: [utilsLayer],
      timeout: Duration.seconds(30),
      environment: {
        BUCKET_PETS: bucket.bucketName,
      },
    });

    bucket.grantReadWrite(getPetImagesLambda);

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

    const authoriseLambda = new lambda.Function(this, "authorise", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "authorise.handler",
      code: lambda.Code.fromAsset("lib/lambda"),
      layers: [utilsLayer],
      environment: {
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    const refreshTokenLambda = new lambda.Function(this, "refreshToken", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "refreshToken.handler",
      code: lambda.Code.fromAsset("lib/lambda"),
      layers: [utilsLayer],
      environment: {
        COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
      },
    });

    const getUserLambda = new lambda.Function(this, "getUser", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "getUser.handler",
      code: lambda.Code.fromAsset("lib/lambda"),
      layers: [utilsLayer],
      environment: {
        USER_POOL_ID: userPool.userPoolId,
      },
    });

    getUserLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ["cognito-idp:AdminGetUser"],
        resources: [userPool.userPoolArn],
      })
    );

    const updateUserLambda = new lambda.Function(this, "updateUser", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "updateUser.handler",
      code: lambda.Code.fromAsset("lib/lambda"),
      layers: [utilsLayer],
      environment: {
        USER_POOL_ID: userPool.userPoolId,
      },
    });

    updateUserLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ["cognito-idp:AdminUpdateUserAttributes"],
        resources: [userPool.userPoolArn],
      })
    );

    const getUserPetLambda = new lambda.Function(this, "getUserPet", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "getUserPet.handler",
      code: lambda.Code.fromAsset("lib/lambda"),
      layers: [utilsLayer],
      timeout: Duration.seconds(30),
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        TABLE_PET_NAME: petTable.tableName,
        BUCKET_PETS: bucket.bucketName,
      },
    });

    petTable.grantReadData(getUserPetLambda);
    bucket.grantReadWrite(getUserPetLambda);
    getUserPetLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ["cognito-idp:AdminGetUser"],
        resources: [userPool.userPoolArn],
      })
    );

    const postUserPetLambda = new lambda.Function(this, "postUserPet", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "postUserPet.handler",
      code: lambda.Code.fromAsset("lib/lambda"),
      layers: [utilsLayer],
      timeout: Duration.seconds(30),
      environment: {
        USER_POOL_ID: userPool.userPoolId,
        TABLE_PET_NAME: petTable.tableName,
        BUCKET_PETS: bucket.bucketName,
      },
    });

    petTable.grantWriteData(postUserPetLambda);
    bucket.grantWrite(postUserPetLambda);
    postUserPetLambda.addToRolePolicy(
      new PolicyStatement({
        actions: ["cognito-idp:*"],
        resources: [userPool.userPoolArn],
      })
    );

    //#endregion

    //#region API
    const lostAndPawsApi = new apigateway.RestApi(this, "LostAndPawsApi", {
      restApiName: "LostAndPawsApi",
      defaultCorsPreflightOptions: {
        allowHeaders: ["x-access-token", ...apigateway.Cors.DEFAULT_HEADERS],
        allowMethods: [apigateway.Cors.ALL_METHODS],
        allowOrigins: [apigateway.Cors.ALL_ORIGINS],
      },
    });

    // PATHS
    const pets = lostAndPawsApi.root.addResource("pets");
    const vets = lostAndPawsApi.root.addResource("vets");
    const login = lostAndPawsApi.root.addResource("auth");
    const refresh = lostAndPawsApi.root.addResource("refresh");
    const user = lostAndPawsApi.root.addResource("user");
    const userUpdate = user.addResource("update");
    const userPet = user.addResource("pet");

    const pet = pets.addResource("{id}");
    const petImages = pet.addResource("images");
    const lost = pets.addResource("lost");

    userPet.addMethod(
      "POST",
      new apigateway.LambdaIntegration(postUserPetLambda),
      {
        authorizer: authorizerCognito,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    userPet.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getUserPetLambda),
      {
        authorizer: authorizerCognito,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    user.addMethod("GET", new apigateway.LambdaIntegration(getUserLambda), {
      authorizer: authorizerCognito,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    login.addMethod("GET", new apigateway.LambdaIntegration(authoriseLambda), {
      apiKeyRequired: true,
    });

    refresh.addMethod(
      "POST",
      new apigateway.LambdaIntegration(refreshTokenLambda),
      {
        authorizer: authorizerCognito,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    pets.addMethod("GET", new apigateway.LambdaIntegration(getLostPetLambda), {
      apiKeyRequired: true,
    });

    pet.addMethod("GET", new apigateway.LambdaIntegration(getPetLambda), {
      apiKeyRequired: true,
    });

    petImages.addMethod(
      "GET",
      new apigateway.LambdaIntegration(getPetImagesLambda),
      {
        apiKeyRequired: true,
      }
    );

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

    userUpdate.addMethod(
      "PUT",
      new apigateway.LambdaIntegration(updateUserLambda),
      {
        authorizer: authorizerCognito,
        authorizationType: apigateway.AuthorizationType.COGNITO,
      }
    );

    const apiKey = new apigateway.ApiKey(this, "ApiKey");

    const usagePlan = new apigateway.UsagePlan(this, "UsagePlan", {
      name: "BasicUsagePlan",
      apiStages: [{ lostAndPawsApi, stage: lostAndPawsApi.deploymentStage }],
    });

    usagePlan.addApiKey(apiKey);

    //#endregion
  }
}

module.exports = { LostPawsBackendStack };
