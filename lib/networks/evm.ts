import { PBKDF2, AES, enc } from "crypto-js";
import cryptoRandomString from "crypto-random-string";
import { Wallet, utils, providers } from "ethers";
import { CHAIN_AVAILABLES, CHAIN_DEFAULT } from "../constant";

const generatePrivateKey = () => {
  // Générer une clé privée aléatoire de 32 octets
  return cryptoRandomString({ length: 64, type: "hex" });
};

// Generate a DID from an Ethereum address
const generateDID = (address: string) => {
  return `did:ethr:${address}`;
};

export const encrypt = (data: string, password: string) => {
  // Generate a random salt
  const salt = cryptoRandomString({ length: 32, type: "hex" });
  // Derive a key from the password and salt
  const key = PBKDF2(password, salt, { keySize: 256 / 32, iterations: 10000 });
  // Encrypt the data with the key
  const encryptedData = AES.encrypt(data, key.toString()).toString();
  // Return the encrypted data and salt
  return { encryptedData, salt };
}
export const decrypt = (encryptedData: string, password: string, salt: string) => {
  // Derive a key from the password and salt
  const key = PBKDF2(password, salt, { keySize: 256 / 32, iterations: 10000 });
  // Decrypt the data with the key
  const decryptedData = AES.decrypt(encryptedData, key.toString()).toString(
    enc.Utf8
  );
  // Return the decrypted data
  return decryptedData;
}

// Sign a message with a private key
export const signMessage = (message: string, privateKey: any) => {
  const wallet = new Wallet(privateKey);
  return wallet.signMessage(message);
};

// Verify a message signature with a public key or address
export const verifySignature = (
  message: string,
  signature: string,
  publicKeyOrAddress: string
) => {
  try {
    const recoveredAddress = utils.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() === publicKeyOrAddress.toLowerCase()) {
      return true; // Signature is valid
    }
    return false; // Signature does not match public key or address
  } catch (error) {
    console.log(error);
    return false; // Invalid signature format
  }
};

// Verify an EVM signature with a message hash and signature
export const verifyEvmSignature = (
  messageHash: string,
  signature: string,
  address: string
) => {
  const wallet = new Wallet(address);
  console.log(wallet);
  const recoveredAddress = utils.verifyMessage(
    utils.arrayify(messageHash),
    signature
  );
  return recoveredAddress.toLowerCase() === wallet.address.toLowerCase();
};

// Génère une clé privée à partir d'un mot de passe et d'un sel
export const generatePrivateKeyFromPassword = (
  password: string,
  salt: string
) => {
  // Applique PBKDF2 avec SHA-256 pour dériver la clé
  const key = PBKDF2(password, salt, { keySize: 256 / 32, iterations: 10000 });
  // Retourne la clé dérivée en format hexadécimal
  const wallet = new Wallet(key.toString());
  return wallet.privateKey;
};

export const generateEvmAddress = (
  derivativePrivateKey: string = generatePrivateKey(),
  chainId?: number
) => {
  const chain = chainId
  ? CHAIN_AVAILABLES.find((c) => c.id === chainId) || CHAIN_DEFAULT
  : CHAIN_DEFAULT;
  // build default provider
  const provider = new providers.JsonRpcProvider(
    chain.rpcUrl,
    chain.id
  );
  const { privateKey, publicKey, address } = new Wallet(
    derivativePrivateKey,
    provider
  );
  const ethrDid = generateDID(address);
  return {
    privateKey,
    publicKey,
    address,
    did: ethrDid,
    provider,
  };
};
