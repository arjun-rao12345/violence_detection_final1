// Dynamic API URL resolver for both desktop (localhost) and mobile (LAN IP)
export const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = window.location.hostname || "localhost";
  return `http://${hostname}:4001`;
};

export const API_URL = getApiUrl();
export default API_URL;
