import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { extractDeviation, saveDeviation, editDeviationChat } from './deviationAPI';

const initialFormState = {
  site_plant: '',
  date_of_occurrence: '',
  title: '',
  source: '',
  related_product: '',
  batch_lot_number: '',
  detailed_description: '',
  initial_impact: '',
  initial_severity: '',
  severity_reason: '',
};

const initialState = {
  form: initialFormState,
  extractionStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  extractionError: null,
  saveStatus: 'idle',       // 'idle' | 'loading' | 'succeeded' | 'failed'
  saveError: null,
  savedId: null,
};

// payload: { text: string } OR a FormData object (file upload)
export const runExtraction = createAsyncThunk(
  'deviation/runExtraction',
  async (payload, { rejectWithValue }) => {
    try {
      const result = await extractDeviation(payload);
      return result; // expected shape matches initialFormState keys
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  }
);

export const submitDeviation = createAsyncThunk(
  'deviation/submitDeviation',
  async (formData, { rejectWithValue }) => {
    try {
      const result = await saveDeviation(formData);
      return result;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  }
);

export const editViaChat = createAsyncThunk(
  'deviation/editViaChat',
  async ({ message, currentForm }, { rejectWithValue }) => {
    try {
      return await editDeviationChat(message, currentForm);
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || err.message);
    }
  }
);

const deviationSlice = createSlice({
  name: 'deviation',
  initialState,
  reducers: {
    // for manual edits after AI populates the form
    updateField: (state, action) => {
      const { field, value } = action.payload;
      state.form[field] = value;
    },
    resetForm: (state) => {
      state.form = initialFormState;
      state.extractionStatus = 'idle';
      state.extractionError = null;
      state.saveStatus = 'idle';
      state.saveError = null;
      state.savedId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runExtraction.pending, (state) => {
        state.extractionStatus = 'loading';
        state.extractionError = null;
      })
      .addCase(runExtraction.fulfilled, (state, action) => {
        state.extractionStatus = 'succeeded';
        // merge AI-extracted fields into the form, only overwriting known keys
        state.form = { ...state.form, ...action.payload };
      })
      .addCase(runExtraction.rejected, (state, action) => {
        state.extractionStatus = 'failed';
        state.extractionError = action.payload;
      })
      .addCase(submitDeviation.pending, (state) => {
        state.saveStatus = 'loading';
        state.saveError = null;
      })
      .addCase(submitDeviation.fulfilled, (state, action) => {
        state.saveStatus = 'succeeded';
        state.savedId = action.payload.id;
      })
      .addCase(submitDeviation.rejected, (state, action) => {
        state.saveStatus = 'failed';
        state.saveError = action.payload;
      })
      .addCase(editViaChat.fulfilled, (state, action) => {
        state.form = { ...state.form, ...action.payload };
      });
  },
});

export const { updateField, resetForm } = deviationSlice.actions;
export default deviationSlice.reducer;