import axios from "axios";
// Single configured instance. baseURL "/api" = same-origin BFF, never the backend directly.
export const api = axios.create({ baseURL: "/api", withCredentials: true });
