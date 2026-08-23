"use client";

import { useEffect } from "react";
import { Provider, useDispatch } from "react-redux";
import { store } from "./index";
import { restoreUserSession } from "./userSlice";
import { restoreAdminSession } from "./adminSlice";
import { ThemeProvider } from "@/components/theme/ThemeContext";

// Helper component to restore saved auth tokens on initial app load with backward-compatibility
function SessionRestorer({ children }) {
  const dispatch = useDispatch();

  useEffect(() => {
    try {
      const userToken = localStorage.getItem("gatify_user_token") || localStorage.getItem("surveileye_user_token");
      const userData = localStorage.getItem("gatify_user_data") || localStorage.getItem("surveileye_user_data");
      if (userToken && userData) {
        dispatch(restoreUserSession({ token: userToken, user: JSON.parse(userData) }));
      }

      const adminToken = localStorage.getItem("gatify_admin_token") || localStorage.getItem("surveileye_admin_token");
      const adminData = localStorage.getItem("gatify_admin_data") || localStorage.getItem("surveileye_admin_data");
      if (adminToken && adminData) {
        dispatch(restoreAdminSession({ token: adminToken, admin: JSON.parse(adminData) }));
      }
    } catch (err) {
      console.error("Error restoring user session from local storage:", err);
    }
  }, [dispatch]);

  return <>{children}</>;
}

export default function Providers({ children }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <SessionRestorer>{children}</SessionRestorer>
      </ThemeProvider>
    </Provider>
  );
}
