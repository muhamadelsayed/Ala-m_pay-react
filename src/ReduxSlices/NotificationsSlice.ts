import { createSlice } from '@reduxjs/toolkit';
const slice = createSlice({
  name: 'notifications',
  initialState: {},
  reducers: {
    setToastOptions: (state, action) => console.log('Redux Mock: setToastOptions', action.payload),
    setToastShow: (state, action) => console.log('Redux Mock: setToastShow', action.payload),
  },
});
export const { setToastOptions, setToastShow } = slice.actions;
export default slice.reducer;