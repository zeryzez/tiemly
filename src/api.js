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
    // Si la requête réussit (Code 2xx), on laisse passer la réponse normalement
    return response;
  },
  (error) => {
    // Si la requête échoue (Code 4xx ou 5xx)

    // On extrait le message de l'API s'il existe
    const apiMessage = error.response?.data?.message || error.message;
    const statusCode = error.response?.status;

    // Exception : On ignore l'erreur 404 (Not Found) pour éviter le spam
    // lors des vérifications de suppression/désactivation que nous avons codées précédemment.
    // Exception 2 : On ignore 401 si on est sur la page login
    if (
      statusCode !== 404 &&
      !(statusCode === 401 && window.location.pathname === "/login")
    ) {
      toast.error(`Erreur ${statusCode || ""} : ${apiMessage}`);
    }

    // On rejette quand même la promesse pour que le code appelant (le store) sache qu'il y a eu échec
    return Promise.reject(error);
  },
);

export default api;
