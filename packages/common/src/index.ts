export const createSlug = (str: string) => {
  return str
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .split(" ")
    .map((e) => e.trim())
    .filter(Boolean)
    .join("-");
};
