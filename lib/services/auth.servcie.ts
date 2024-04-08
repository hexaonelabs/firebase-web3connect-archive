import { passwordValidationOrSignature } from "../providers/crypto/password";
import storageProvider from "../providers/storage/local";
import authProvider from "../providers/auth/firebase";
import Crypto from "../providers/crypto/crypto";
import evmWallet from "../networks/evm";
import { CHAIN_DEFAULT } from "../constant";

export const authWithGoogle = async (ops: {
  password: string;
  skip?: boolean; 
  withEncryption?: boolean;
}) => {
  const { password, skip, withEncryption } = ops;
  // If user already have a signature stored into Database,
  // we validate the password with validation signature method.
  // Otherwise we sign message with the password and store it in the Database
  await passwordValidationOrSignature(password).execute();

  // if user is requesting to create new privatekey
  const privateKey = await storageProvider.getItem('hexa-private-key');
  if (!privateKey && !skip) {
    // store to local storage tag to trigger download of the private key
    // when the user is connected (using listener onConnectStateChanged)
    localStorage.setItem('hexa-backup', withEncryption ? 'true' : 'false');
  }

  // encrypt secret with user secret and store it
  const encryptedSecret = await Crypto.encrypt(storageProvider.getUniqueID(), password);
  await storageProvider.setItem('hexa-secret', encryptedSecret);

  // Now we can connect with Google
  try {
    return await authProvider.signinWithGoogle();
  } catch (error) {
    throw error;
  }
}

export const authWithExternalWallet = async (networkId: number = CHAIN_DEFAULT.id) => {    
  try {
    const { did, address, provider }  = await evmWallet.connectWithExternalWallet();
    await authProvider.signInAsAnonymous();
    return { did, address, provider };
  } catch (error) {
    throw error;
  }
}

export const authByImportPrivateKey = async (ops: {
  password: string;
  privateKey: string; 
}) => {
  const { password, privateKey } = ops;
  try {
    // encrypt private key before storing it
    const encryptedPrivateKey = await Crypto.encrypt(password, privateKey);
    await storageProvider.setItem('hexa-private-key', encryptedPrivateKey);
    // trigger Auth with Google
    const {uid} = await authWithGoogle({
      password,
      skip: true, 
      withEncryption: true
    });
    return {uid};
  } catch (error) {
    throw error;
  }
}
