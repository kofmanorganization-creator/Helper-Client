import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";

const functions = getFunctions(getApp());

/**
 * Créer une commande client
 */
export const createOrder = async (orderData: {
  serviceType: string;
  latitude: number;
  longitude: number;
}) => {
  const fn = httpsCallable(functions, "createOrder");
  const result = await fn(orderData);
  return result.data;
};
