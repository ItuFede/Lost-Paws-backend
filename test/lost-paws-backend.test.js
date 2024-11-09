const { App } = require("aws-cdk-lib");
const { LostPawsBackendStack } = require("../lib/lost-paws-backend-stack");
const { Template } = require("@aws-cdk/assertions");

describe("LostPawsBackendStack", () => {
  let app;
  let stack;

  beforeEach(() => {
    app = new App();

    stack = new LostPawsBackendStack(app, "LostPawsBackendStack");
  });

  test("Debe crear una tabla DynamoDB para los Vets", () => {
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::DynamoDB::Table", {
      TableName: "vet",
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
    });
  });

  test("Debe crear un Bucket S3 con el nombre esperado", () => {
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::S3::Bucket", {
      BucketName: "pet-bucket-landp-dev",
    });
  });

  test("Debe crear una función Lambda para obtener información de las mascotas", () => {
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::Lambda::Function", {
      Handler: "getLostPet.handler",
      Runtime: "nodejs18.x",
      Environment: {
        Variables: {
          TABLE_PET_NAME: {
            Ref: "pet209D1A1E",
          },
        },
      },
    });
  });

  test("Debe crear un API Gateway con el endpoint /pets", () => {
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ApiGateway::Resource", {
      PathPart: "pets",
      ParentId: { "Fn::GetAtt": ["LostAndPawsApi59DD59D1", "RootResourceId"] },
    });
  });

  test("Debe crear un Authorizer de Cognito para la autenticación", () => {
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ApiGateway::Authorizer", {
      Type: "COGNITO_USER_POOLS",
      IdentitySource: "method.request.header.Authorization",
    });
  });
});
