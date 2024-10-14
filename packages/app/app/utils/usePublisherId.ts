import { createId } from "@paralleldrive/cuid2";
import { create } from "zustand";

// Global state we use to set the pubsub publisher ID once
// This is unique per browser session
export const usePublisherId = create(() => createId());
