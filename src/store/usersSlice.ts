import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface User {
  id: number;
  firstName: string;
  email: string;
  age: number;
}

interface CrudState {
  users: User[];
  loading: boolean;
  error: string | null;
}

const initialState: CrudState = {
  users: [],
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk("crud/fetchUsers", async () => {
  const res = await axios.get("https://dummyjson.com/users");
  return res.data.users;
});

export const createUser = createAsyncThunk("crud/createUser", async (user: User) => {
  const res = await axios.post("https://dummyjson.com/users/add", user);
  return res.data;
});

export const updateUser = createAsyncThunk(
  "crud/updateUser",
  async ({ id, user }: { id: number; user: Partial<User> }) => {
    const res = await axios.put(`https://dummyjson.com/users/${id}`, user);
    return res.data;
  }
);

export const deleteUser = createAsyncThunk("crud/deleteUser", async (id: number) => {
  await axios.delete(`https://dummyjson.com/users/${id}`);
  return id;
});

const crudSlice = createSlice({
  name: "crud",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch users";
      })

      // Create
      .addCase(createUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users.push(action.payload);
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create user";
      })

      // Update
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.users.findIndex((u) => u.id === action.payload.id);
        if (index !== -1) state.users[index] = action.payload;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update user";
      })

      // Delete
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.users = state.users.filter((u) => u.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete user";
      });
  },
});

export default crudSlice.reducer;
