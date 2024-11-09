import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { pubSubReducer } from "./pubSubSlice";

export const reduxStore = configureStore({
  reducer: { pubsub: pubSubReducer },
});

export type RootState = ReturnType<typeof reduxStore.getState>;
export type AppDispatch = typeof reduxStore.dispatch;
export const useRootDispatch = useDispatch.withTypes<AppDispatch>();
export const useRootSelector = useSelector.withTypes<RootState>();
