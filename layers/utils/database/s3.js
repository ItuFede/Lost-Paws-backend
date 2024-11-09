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
    console.log(
      `Data S3, bucketName:::${bucketName} and path:::${path} :::`,
      data
    );
    if (data.KeyCount == 0) return [];
    const files = data.Contents.map((item) => item.Key);

    return files;
  } catch (error) {
    console.error("Error al listar los archivos:", error);
    throw new Error(`Error al listar los archivos en S3 ERROR::: ${error}`);
  }
};

/**
 * Guarda un archivo en S3 en un subdirectorio especificado.
 *
 * @param {string} bucketName - El nombre del bucket de S3.
 * @param {string} subdirectory - La ruta del subdirectorio donde guardar el archivo.
 * @param {string} fileName - El nombre del archivo a guardar.
 * @param {Buffer|string} fileContent - El contenido del archivo.
 * @param {string} [contentType] - El tipo de contenido del archivo.
 * @returns {Promise}
 */
exports.uploadFile = async (
  bucketName,
  subdirectory,
  fileName,
  fileContent,
  contentType = "image/jpeg"
) => {
  const key = `${subdirectory}/${fileName}`;

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
    ContentType: contentType,
  };

  try {
    const response = await s3.putObject(params);
    console.log("Archivo guardado exitosamente:", response);
    return response;
  } catch (error) {
    console.error("Error al guardar el archivo en S3:", error);
    throw new Error(`Error al guardar el archivo en S3 ERROR::: ${error}`);
  }
};
