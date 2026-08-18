import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentAdmin: null,
  adminToken: null,
};

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    adminLoginSuccess: (state, action) => {
      state.currentAdmin = action.payload.admin;
      state.adminToken = action.payload.token;
      if (typeof window !== "undefined") {
        localStorage.setItem("surveileye_admin_token", action.payload.token);
        localStorage.setItem("surveileye_admin_data", JSON.stringify(action.payload.admin));
      }
    },
    adminLogout: (state) => {
      state.currentAdmin = null;
      state.adminToken = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("surveileye_admin_token");
        localStorage.removeItem("surveileye_admin_data");
      }
    },
    restoreAdminSession: (state, action) => {
      state.currentAdmin = action.payload.admin;
      state.adminToken = action.payload.token;
    },
  },
});

export const { adminLoginSuccess, adminLogout, restoreAdminSession } = adminSlice.actions;
export default adminSlice.reducer;
