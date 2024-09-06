"use strict"

class HTTPError extends Error {
  constructor(statusCode, errorMessage) {
    super(errorMessage)
    this.statusCode = statusCode
    this.errorMessage = errorMessage
  }
  toJSON() {
    return {
      status_code: this.statusCode,
      error_message: this.errorMessage,
    }
  }
}

class HTTPBadRequestError extends HTTPError {
  constructor(errorMessage = "Bad Request") {
    super(400, errorMessage)
  }
}
class HTTPUnauthorizedError extends HTTPError {
  constructor(errorMessage = "Unauthorized Error") {
    super(401, errorMessage)
  }
}
class HTTPNotFoundError extends HTTPError {
  constructor(errorMessage = "Not Found") {
    super(404, errorMessage)
  }
}
class HTTPInternalServerError extends HTTPError {
  constructor(errorMessage = "Unexpected Exception") {
    super(500, errorMessage)
  }
}

class HTTPInvalidDataError extends HTTPError {
  constructor(errorMessage = "Invalid data") {
    super(422, errorMessage)
  }
}

class HTTPForbiddenError extends HTTPError {
  constructor(errorMessage = "Unauthorized") {
    super(403, errorMessage)
  }
}

module.exports = {
  HTTPError,
  HTTPInternalServerError,
  HTTPBadRequestError,
  HTTPNotFoundError,
  HTTPInvalidDataError,
  HTTPUnauthorizedError,
  HTTPForbiddenError,
}
