import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/firebaseConfig";

export const createMission = async (payload: {
  serviceType: string;
  price: number;
  location: { lat: number; lng: number };
  radiusKm: number;
}) => {
  const fn = httpsCallable(functions, "createMission");
  const result = await fn(payload);
  return result.data;
};
