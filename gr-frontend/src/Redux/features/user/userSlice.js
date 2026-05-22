import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  loading: false,
  auth:false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.loading = false;
      state.auth = true;
      state.user = action.payload;
    },
    loginFailure: (state, action) => {
      state.loading = false;
      state.auth = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.auth = false;
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } =
  userSlice.actions;

export default userSlice.reducer;
