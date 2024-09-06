"use strict"

const { HTTPError, HTTPInternalServerError, HTTPForbiddenError } = require("httpErrors")

const httpErrorWrapper = ({ handler, httpMethod, contentType }) => {
  console.log("handler, httpMethod, contentType>>> ", handler, httpMethod, contentType)
  const response = {
    statusCode: 200,
    body: "",
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": `${httpMethod}, OPTIONS`,
      "Content-Type": contentType || "application/json",
    },
  }

  console.log("response>>>> ", response)
  const handler_wrapped = async (event, context) => {
    if (event.headers["Content-Type"] !== "application/pdf") {
      console.log("event", JSON.stringify(event))
    }

    try {
      const { statusCode, body, headers: customHeaders, parameters } = await handler(event, context)

      response.body = customHeaders && customHeaders["Content-Type"] === "application/pdf" ? body : JSON.stringify(body)
      response.statusCode = statusCode
      response.headers = {
        ...response.headers,
        ...customHeaders,
      }
      const customResponse = { ...response, ...parameters }

      return customResponse
    } catch (ex) {
      console.error("Error::", ex)
      console.error("Error Name::", ex.name)
      console.error("Class of error::", ex.constructor?.name)

      let error = ex instanceof HTTPError ? ex : new HTTPInternalServerError()

      if (ex.name == "UnrecognizedClientException" || ex.name == "ExpiredTokenException" || ex.name == "AccessDeniedException")
        error = new HTTPForbiddenError()

      response.body = JSON.stringify(error)
      response.statusCode = error.statusCode
      return response
    } finally {
      console.log("response", response)
    }
  }
  return handler_wrapped
}

module.exports = {
  httpErrorWrapper,
}
