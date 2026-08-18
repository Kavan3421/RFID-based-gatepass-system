import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentUser: null,
  token: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.currentUser = action.payload.user;
      state.token = action.payload.token;
      if (typeof window !== "undefined") {
        localStorage.setItem("surveileye_user_token", action.payload.token);
        localStorage.setItem("surveileye_user_data", JSON.stringify(action.payload.user));
      }
    },
    logout: (state) => {
      state.currentUser = null;
      state.token = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("surveileye_user_token");
        localStorage.removeItem("surveileye_user_data");
      }
    },
    restoreUserSession: (state, action) => {
      state.currentUser = action.payload.user;
      state.token = action.payload.token;
    },
  },
});

export const { loginSuccess, logout, restoreUserSession } = userSlice.actions;
export default userSlice.reducer;
