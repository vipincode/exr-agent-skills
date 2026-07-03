import axios from "axios";
// Direct-to-backend: the browser hits the backend's absolute URL. No BFF/proxy layer.
export const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_URL });
export const fetcher = (url: string) => apiClient.get(url).then((r) => r.data);
