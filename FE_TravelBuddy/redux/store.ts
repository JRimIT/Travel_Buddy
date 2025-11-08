import { configureStore } from '@reduxjs/toolkit';
import inforUserTravelReducer from './inforUserTravel/inforUserTravelSlice';

export const store = configureStore({
    reducer: {
        inforUserTravel: inforUserTravelReducer,
    },
});