import axios from "axios";
import { toast } from "vue3-toastify";

const api = axios.create({
  baseURL: "https://timely.edu.netlor.fr",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const apiMessage = error.response?.data?.message || error.message;
    const statusCode = error.response?.status;
    if (
      statusCode !== 404 &&
      !(statusCode === 401 && window.location.pathname === "/login")
    ) {
      toast.error(`Erreur ${statusCode || ""} : ${apiMessage}`);
    }
    return Promise.reject(error);
  },
);

export default api;
