import { createAsyncThunk, createSlice, current } from "@reduxjs/toolkit";
import axios from "axios";



export const LoggedInUserLeadThunk = createAsyncThunk('loggedInUserLeadThunk', async (id) => {
 try{
  
  const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/agent/get-leads?id=${id}`
    );

    

   
    return response.data.data;

 }catch(err){
    console.log("Error in leadThunk:", err.message);
 }
});

export const updateFollowUpThunk = createAsyncThunk(
  "updateFollowUpThunk",
  async ({agentId, id, data, attempt, leadData }, { rejectWithValue, dispatch }) => {
    try {

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/agent/follow-up/${id}`,
        data
      );

      dispatch(LoggedInUserLeadThunk(agentId));

      let currentAttempt = parseInt(attempt);
      currentAttempt += 1;
      let statusKey = "status" + currentAttempt.toString();
      let remarkKey = "remark" + currentAttempt.toString();
      let leadRecordData = {
        [statusKey]: data.status,
        [remarkKey]: data.remark,
      };
      dispatch(LeadRecordThunk({ id: id, data: leadRecordData }));
      
      let userId = leadData.assigned_to
      let description = `status changed from ${leadData.status} to ${data.status} with remark :${data.remark}`;
      let activityLeadId = leadData.id.toString();
      let activityData = {
        phone: leadData.phone,
        id: activityLeadId,
        description,
        agentId: userId
      }

      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/activity/add`, activityData)
      return res.data;
    } catch (err) {
      console.log("Error in follow-up update thunk:", err);
      return rejectWithValue(err.response?.data || "Error in follow-up update");
    }
  }
);
export const LeadRecordThunk = createAsyncThunk(
  "LeadRecordThunk",
  async ({ id, data }) => {
    try {

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/agent/leadrecord/${id}`,
        data
      );
      console.log("followup data",res.data);
      
      return res.data;
    } catch (err) {
      console.log("Error in follow-up update thunk:", err);
      return rejectWithValue(err.response?.data || "Error in follow-up update");
    }
  }
);


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
 
  },
}
)

export const { setLoggedInUser } = LoggedInUserSlice.actions;
export default LoggedInUserSlice.reducer;

