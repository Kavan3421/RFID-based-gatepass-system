import axios from "axios";

const API = axios.create({
  baseURL: "https://ssip-xv3o.onrender.com/api/", // Adjust to your Flask server URL
});

// Login a user
export const AdminSignIn = async (data) => API.post("/admin/signin", data);

// Get data by date
export const getDataByDate = async (token, queryString) =>
  await API.get(`/admin/databydate${queryString}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getPassByDate = async (token, queryString) =>
  await API.get(`/admin/passbydate${queryString}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
