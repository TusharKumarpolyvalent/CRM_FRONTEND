import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

export const UsersThunk = createAsyncThunk('usersThunk', async (role) => {
  try {
    //make api call

    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/admin/get-user/${role}`
    );
    return response.data.data;
  } catch (err) {
    console.log('Error in usersThunk:', err.message);
  }
});

const UsersSlice = createSlice({
  name: 'Users',
  initialState: {
    loader: false,
    data: [],
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(UsersThunk.pending, (state) => {
        state.loader = true;
        state.error = null;
      })
      .addCase(UsersThunk.fulfilled, (state, action) => {
        state.loader = false;
        state.data = action.payload;
      })
      .addCase(UsersThunk.rejected, (state, action) => {
        state.loader = false;
        state.error = action.error.message;
      });
  },
});

export default UsersSlice.reducer;
