import { createSlice } from '@reduxjs/toolkit';
const slice = createSlice({
    name: 'modalManager',
    initialState: {},
    reducers: {
        setActionConfirmationShow: (state, action) => console.log('Redux Mock: setActionConfirmationShow', action.payload),
    },
});
export const { setActionConfirmationShow } = slice.actions;
export default slice.reducer;