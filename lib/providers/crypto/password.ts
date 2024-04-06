import Crypto from "./crypto";
import storageProvider from "../storage/local";

export const passwordValidationOrSignature = (value: string) => ({
  execute: async () => {
    try {
      const privateKey = await storageProvider.isExistingPrivateKeyStored();
      const signature = await storageProvider.getItem("hexa-signature");
      if (privateKey && signature) {
        const isSignatureValid = await Crypto.verifySignatureFromPassword(
          value,
          "hexa-web3connect-signature-value",
          signature
        );
        if (!isSignatureValid) {
          throw new Error("Invalid password");
        }
      } else {
        const signature = await Crypto.signMessageFromPassword(
          value,
          "hexa-web3connect-signature-value"
        );
        await storageProvider.setItem("hexa-signature", signature);
      }
    } catch (error) {
      throw error;      
    }
  },
});
