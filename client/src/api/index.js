import axios from "axios";

const API = axios.create({
  baseURL: "https://ssip-xv3o.onrender.com/api/",
});

// Register a new user
export const registerUser = async (data) => {
  const response = await API.post("/user/signup", data);
  return response;
};

// Login a user
export const UserSignIn = async (data) => API.post("/user/signin", data);

// Get data by date
export const getDataByDate = async (token, queryString) =>
  await API.get(`/user/databydate${queryString}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

// Submit a contact message
export const contact = async (token, data) => {
  try {
    const response = await API.post("/user/contact", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "An unexpected error occurred." };
  }
};

export const gatepass = async (token, data) => {
  try {
    const response = await API.post("/user/gatepass", data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "An unexpected error occurred." };
  }
};

export const generateQrCode = async (token, data) =>
  await API.post("/user/generate-qr", data, {
    headers: { Authorization: `Bearer ${token}` },
  });