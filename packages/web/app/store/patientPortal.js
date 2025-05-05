import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Create the async thunk for submitting form responses
export const submitFormResponse = createAsyncThunk(
  'patientPortal/submitFormResponse',
  async (formData, { getState, rejectWithValue }) => {
    try {
      const { api } = getState();

      // Submit form response data to the API
      const response = await api.post('surveyResponse', {
        surveyId: formData.surveyId,
        patientId: formData.patientId,
        startTime: formData.startTime || new Date().toISOString(),
        endTime: new Date().toISOString(),
        answers: formData.responses || {},
      });

      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: 'Failed to submit form response' });
    }
  },
);

// Create the patient portal slice
const patientPortalSlice = createSlice({
  name: 'patientPortal',
  initialState: {
    loading: false,
    error: null,
    surveys: [],
    responses: [],
  },
  reducers: {
    clearErrors(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(submitFormResponse.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitFormResponse.fulfilled, (state, action) => {
        state.loading = false;
        state.responses.push(action.payload);
      })
      .addCase(submitFormResponse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || { message: 'Failed to submit form response' };
      });
  },
});

// Export actions and reducer
export const { clearErrors } = patientPortalSlice.actions;
export default patientPortalSlice.reducer;
