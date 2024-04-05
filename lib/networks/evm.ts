import { PBKDF2, AES, enc } from "crypto-js";
import cryptoRandomString from "crypto-random-string";
import { Wallet, utils, providers } from "ethers";
import { CHAIN_AVAILABLES, CHAIN_DEFAULT } from "../constant";
import { generateMnemonic, validateMnemonic,  } from 'bip39';
import { IWalletProvider } from "../interfaces/walllet-provider.interface";

const generatePrivateKey = () => {
  // Générer une clé privée aléatoire de 32 octets
  return cryptoRandomString({ length: 64, type: "hex" });
};

// Generate a DID from an Ethereum address
const generateDID = (address: string) => {
  return `did:ethr:${address}`;
};

// // Sign a message with a private key
// export const signMessage = (message: string, privateKey: any) => {
//   const wallet = new Wallet(privateKey);
//   return wallet.signMessage(message);
// };

// // Verify a message signature with a public key or address
// export const verifySignature = (
//   message: string,
//   signature: string,
//   publicKeyOrAddress: string
// ) => {
//   try {
//     const recoveredAddress = utils.verifyMessage(message, signature);
//     if (recoveredAddress.toLowerCase() === publicKeyOrAddress.toLowerCase()) {
//       return true; // Signature is valid
//     }
//     return false; // Signature does not match public key or address
//   } catch (error) {
//     console.log(error);
//     return false; // Invalid signature format
//   }
// };

// // Verify an EVM signature with a message hash and signature
// export const verifyEvmSignature = (
//   messageHash: string,
//   signature: string,
//   address: string
// ) => {
//   const wallet = new Wallet(address);
//   console.log(wallet);
//   const recoveredAddress = utils.verifyMessage(
//     utils.arrayify(messageHash),
//     signature
//   );
//   return recoveredAddress.toLowerCase() === wallet.address.toLowerCase();
// };

// // Génère une clé privée à partir d'un mot de passe et d'un sel
// export const generatePrivateKeyFromPassword = (
//   password: string,
//   salt: string
// ) => {
//   // Applique PBKDF2 avec SHA-256 pour dériver la clé
//   const key = PBKDF2(password, salt, { keySize: 256 / 32, iterations: 10000 });
//   // Retourne la clé dérivée en format hexadécimal
//   const wallet = new Wallet(key.toString());
//   return wallet.privateKey;
// };

// export const generateEvmAddress = (
//   derivativePrivateKey: string = generatePrivateKey(),
//   chainId?: number
// ) => {
//   const chain = chainId
//   ? CHAIN_AVAILABLES.find((c) => c.id === chainId) || CHAIN_DEFAULT
//   : CHAIN_DEFAULT;
//   // build default provider
//   const provider = new providers.JsonRpcProvider(
//     chain.rpcUrl,
//     chain.id
//   );
//   const { privateKey, publicKey, address } = new Wallet(
//     derivativePrivateKey,
//     provider
//   );
//   const ethrDid = generateDID(address);
//   return {
//     privateKey,
//     publicKey,
//     address,
//     did: ethrDid,
//     provider,
//   };
// };

const generateWalletFromMnemonic = async (mnemonic: string = generateMnemonic(), chainId?: number) => {
  // validate mnemonic
  if (!validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic");
  }
  const chain = CHAIN_AVAILABLES.find((c) => c.id === chainId) || CHAIN_DEFAULT;
  const provider = new providers.JsonRpcProvider(chain.rpcUrl, chain.id);
  const wallet = Wallet.fromMnemonic(mnemonic);
  const ethrDid = generateDID(wallet.address);
  return {
    privateKey: wallet.privateKey,
    publicKey: wallet.publicKey,
    address: wallet.address,
    did: ethrDid,
    provider,
  };
}

const generateWalletFromPrivateKey = async (privateKey: string, chainId?: number) => {
  if (!utils.isHexString(privateKey)) {
    throw new Error("Invalid private key");
  }
  const chain = CHAIN_AVAILABLES.find((c) => c.id === chainId) || CHAIN_DEFAULT;
  const provider = new providers.JsonRpcProvider(chain.rpcUrl, chain.id);
  const wallet = new Wallet(privateKey);
  const ethrDid = generateDID(wallet.address);
  return {
    privateKey: wallet.privateKey,
    publicKey: wallet.publicKey,
    address: wallet.address,
    did: ethrDid,
    provider,
  };

}

const connectWithExternalWallet = async () => {
  // check if metamask/browser extension is installed
  if (!(window as any).ethereum) {
    throw new Error(`
      No web3 wallet extension found. 
      Install browser extensions like Metamask or Rabby wallet to connect with the app using your existing or hardware wallet.
    `);
  }
  // get current account
  const web3Provider = new providers.Web3Provider(
    (window as any).ethereum
  );
  const accounts = await web3Provider.send('eth_requestAccounts', []);
  console.log(`[INFO] connectWithExternalWallet: `, accounts);
  // set to default chain
  try {
    const chainIdAsHex = '0x' + CHAIN_DEFAULT.id.toString(16);
    await web3Provider.send('wallet_switchEthereumChain', [{ chainId: chainIdAsHex }]);
  } catch (error: unknown) {
    console.log('[ERROR]', error);
  }
  const signer = web3Provider?.getSigner();
  const address = await signer.getAddress();
  const chainId = await signer.getChainId();
  const ethrDid = generateDID(address);
  console.log('[INFO] connectWithExternalWallet', { accounts, address, chainId });

  return {
    privateKey: null,
    publicKey: null,
    address,
    did: ethrDid,
    provider: web3Provider,
  };
};


const evmWallet: Readonly<IWalletProvider> = Object.freeze({
  connectWithExternalWallet,
  generateWalletFromPrivateKey,
  generateWalletFromMnemonic,
  generateDID,
});

export default evmWallet;