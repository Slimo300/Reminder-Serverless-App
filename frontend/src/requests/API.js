import axios from "axios";
import { getIDToken } from "./Cognito";

const axiosObject = axios.create();
axiosObject.defaults.headers.common['Content-Type'] = "application/json";
axiosObject.defaults.baseURL = "https://i7pve2skde.execute-api.eu-central-1.amazonaws.com/V1";

// Request interceptor for API calls
axiosObject.interceptors.request.use(
    config => {
        config.headers = { 
            'Authorization': getIDToken(),
            'Accept': 'application/json',
        };
        return config;
    },
    error => {
      Promise.reject(error);
  })

export default axiosObject;