import { createSlice } from '@reduxjs/toolkit';
import { set } from 'lodash';

const initialState = {

    userTravelDays: 0,
    userProvince: {},
    userCurrentLocation: {},
    userDistrict: '',
    userHomeType: '',
    userStartDate: '',
    userEndDate: '',
    userHotelBudget: '',
    userInforHotel: [],
    userFunBudget: '',
    userFlightBudget: '',
    userFlightTicket: [],
    userChosenFlight: [],
    userTransportType: '',
    userTransportBudget: '',
    userActivities: [],
    userSchedule: [],
};

const inforUserTravelSlice = createSlice({
    name: 'inforUserTravel',
    initialState,
    reducers: {
        setUserTravelDays: (state, action) => {
            state.userTravelDays = action.payload;
        },
        setUserProvince: (state, action) => {
            state.userProvince = action.payload;
        },
        setUserCurrentLocation: (state, action) => {
            state.userCurrentLocation = action.payload;
        },
        setUserDistrict: (state, action) => {
            state.userDistrict = action.payload;
        },
      
        setUserHomeType: (state, action) => {
            state.userHomeType = action.payload;
        }
        ,
        setUserStartDate: (state, action) => {
            state.userStartDate = action.payload;
        }
        ,
        setUserEndDate: (state, action) => {
            state.userEndDate = action.payload;
        },
        setUserHotelBudget: (state, action) => {
            state.userHotelBudget = action.payload;
        }
        ,
        setUserFunBudget: (state, action) => {
            state.userFunBudget = action.payload;
        },
        setUserInforHotel: (state, action) => {
            state.userInforHotel = action.payload;
        },
        setUserFlightBudget: (state, action) => {
            state.userFlightBudget = action.payload;
        }
        ,
        setUserTransportType: (state, action) => {
            state.userTransportType = action.payload;
        }
        ,
        setUserTransportBudget: (state, action) => {
            state.userTransportBudget = action.payload;
        },
        setUserActivities: (state, action) => {
            state.userActivities = action.payload;
        },
        setUserSchedule: (state, action) => {
            state.userSchedule = action.payload;
        },
        setUserFlightTicket: (state, action) => {
            state.userFlightTicket = action.payload;
        },
        setUserChosenFlight: (state, action) => {
            state.userChosenFlight = action.payload;
        }
    },
});

export const { setUserProvince, setUserDistrict, setUserStartDate, setUserEndDate, setUserHomeType, setUserHotelBudget, setUserActivities, setUserFlightBudget, setUserFunBudget, setUserTransportBudget, setUserTransportType, setUserCurrentLocation, setUserInforHotel, setUserTravelDays, setUserSchedule, setUserFlightTicket, setUserChosenFlight } = inforUserTravelSlice.actions;
export default inforUserTravelSlice.reducer;