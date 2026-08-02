export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const notFound = (what: string) => new ApiError(404, `${what} not found`);
export const conflict = (msg: string) => new ApiError(409, msg);
