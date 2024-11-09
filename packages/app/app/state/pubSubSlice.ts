import { createId } from "@paralleldrive/cuid2";
import { createSlice } from "@reduxjs/toolkit";

export interface PubSubState {
  publisherId: string;
}

const initialState: PubSubState = {
  publisherId: createId(),
};

export const pubSubSlice = createSlice({
  name: "pubsub",
  initialState,
  reducers: {},
});

export const pubSubActions = pubSubSlice.actions;
export const pubSubReducer = pubSubSlice.reducer;
