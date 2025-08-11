import { createSlice } from '@reduxjs/toolkit';
const slice = createSlice({
    name: 'modalStates',
    initialState: {},
    reducers: {
        setActionConfirmationData: (state, action) => console.log('Redux Mock: setActionConfirmationData', action.payload),
    },
});
export const { setActionConfirmationData } = slice.actions;
export default slice.reducer;