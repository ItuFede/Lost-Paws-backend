"use strict";

const { S3 } = require("@aws-sdk/client-s3");
const s3 = new S3();

exports.getObject = async (params) => {
  try {
    const response = await s3.getObject(params);
    // Leer el stream del Body y convertirlo a Buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);

    return { ...response, Body: body };
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
    const data = await s3.listObjectsV2(params);
    const files = data.Contents.map((item) => item.Key);

    return files;
  } catch (error) {
    console.error("Error al listar los archivos:", error);
    throw new Error(`Error al listar los archivos en S3 ERROR::: ${error}`);
  }
};
