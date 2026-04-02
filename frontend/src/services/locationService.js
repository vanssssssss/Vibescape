import axios from "axios";

export const geocodeLocation = async (query) => {
  const response = await axios.post("/api/location/geocode", {
    query,
  });

  return response.data;
};
