import { FirebaseOptions } from "firebase/app";

export const parseApiKey = (hex: string) => {
  try {
    // converte hex string to utf-8 string
    const json = Buffer.from(hex, "hex").toString("utf-8");
    const apiKey  = JSON.parse(json);
    return apiKey as FirebaseOptions;
  } catch (error) {
    throw new Error("Invalid API key");
  }
}