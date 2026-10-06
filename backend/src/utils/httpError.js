export class HttpError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}
export const badRequest = (msg, details) => new HttpError(400, msg, details)
export const forbidden = (msg = 'No tienes permisos para esta acción.') => new HttpError(403, msg)
export const notFound = (msg = 'Recurso no encontrado.') => new HttpError(404, msg)
