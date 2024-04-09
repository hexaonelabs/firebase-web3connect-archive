import Crypto from "./crypto";
import storageProvider from "../storage/local";
import { KEYS } from "../../constant";

export const passwordValidationOrSignature = (value: string) => ({
  execute: async () => {
    try {
      const privateKey = await storageProvider.isExistingPrivateKeyStored();
      const signature = await storageProvider.getItem(KEYS.AUTH_SIGNATURE_KEY);
      if (privateKey && signature) {
        const isSignatureValid = await Crypto.verifySignatureFromPassword(
          value,
          KEYS.AUTH_SIGNATURE_VALUE,
          signature
        );
        if (!isSignatureValid) {
          throw new Error("Invalid password");
        }
      } else {
        const signature = await Crypto.signMessageFromPassword(
          value,
          KEYS.AUTH_SIGNATURE_VALUE,
        );
        await storageProvider.setItem(KEYS.AUTH_SIGNATURE_KEY, signature);
      }
    } catch (error) {
      throw error;      
    }
  },
});
