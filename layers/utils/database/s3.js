"use strict";

const AWS = require("aws-sdk");
const s3 = new AWS.S3();

exports.getObject = async (params) => {
  try {
    return await s3.getObject(params).promise();
  } catch (error) {
    console.error("Error al buscar el objeto en S3:", error);
    throw new Error(`Error al buscar el objeto en S3 ERROR::: ${error}`);
  }
};

exports.getFiles = async (bucketName, path) => {
  const params = {
    Bucket: bucketName,
    Prefix: path,
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    const files = data.Contents.map((item) => item.Key);

    return files;
  } catch (error) {
    console.error("Error al listar los archivos:", error);
    throw new Error(`Error al listar los archivos en S3 ERROR::: ${error}`);
  }
};
