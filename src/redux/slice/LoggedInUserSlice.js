import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";



export const LoggedInUserLeadThunk = createAsyncThunk('loggedInUserLeadThunk', async (id) => {
 try{
  const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/agent/get-leads?id=${id}`
    );
   console.log("dataaaaaaa",response.data.data);
   
    return response.data.data;

 }catch(err){
    console.log("Error in leadThunk:", err.message);
 }
});
const LoggedInUserSlice = createSlice({
name: "loggedInUser",
initialState:{
    data:{},
    leads: []
},
reducers: {
  setLoggedInUser(state, action) {
    state.data = action.payload;},
  
},
extraReducers:(builder)=>{
builder.addCase(LoggedInUserLeadThunk.fulfilled,(state,action)=>{
    state.leads = action.payload;
})
}
})

export const { setLoggedInUser } = LoggedInUserSlice.actions;
export default LoggedInUserSlice.reducer;

