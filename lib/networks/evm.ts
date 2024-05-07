import { Wallet, utils, providers } from 'ethers';
import { CHAIN_AVAILABLES, CHAIN_DEFAULT } from '../constant';
import { generateMnemonic, validateMnemonic } from 'bip39';
import { IWalletProvider } from '../interfaces/walllet-provider.interface';
import { Web3Wallet } from './web3-wallet';
// import cryptoRandomString from 'crypto-random-string';

// const generatePrivateKey = () => {
// 	// Générer une clé privée aléatoire de 32 octets
// 	return cryptoRandomString({ length: 64, type: 'hex' });
// };

// Generate a DID from an Ethereum address
const generateDID = (address: string) => {
	return `did:ethr:${address}`;
};

class EVMWallet extends Web3Wallet {
	public did!: string;
	constructor(privateKey: string, provider: providers.JsonRpcProvider) {
		super(privateKey, provider);
		const wallet = new Wallet(privateKey, provider);
		this.address = wallet.address;
		this.publicKey = wallet.publicKey;
		this.did = generateDID(this.address);
	}

	sendTransaction(
		tx: utils.Deferrable<providers.TransactionRequest>
	): Promise<providers.TransactionResponse> {
		if (!this.privateKey) {
			throw new Error('Private key is required to send transaction');
		}
		const wallet = new Wallet(this.privateKey, this.provider);
		return wallet.sendTransaction(tx);
	}

	signMessage(message: string): Promise<string> {
		if (!this.privateKey) {
			throw new Error('Private key is required to sign message');
		}
		const wallet = new Wallet(this.privateKey, this.provider);
		return wallet.signMessage(message);
	}

	signTransaction(message: providers.TransactionRequest): Promise<string> {
		if (!this.privateKey) {
			throw new Error('Private key is required to sign transaction');
		}
		const wallet = new Wallet(this.privateKey, this.provider);
		return wallet.signTransaction(message);
	}

	verifySignature(message: string, signature: string): boolean {
		if (!this.publicKey) {
			throw new Error('Public key is required to verify signature');
		}
		return utils.verifyMessage(message, signature) === this.address;
	}
}

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

const generateWalletFromMnemonic = async (
	mnemonic: string = generateMnemonic(),
	chainId?: number
) => {
	// validate mnemonic
	if (!validateMnemonic(mnemonic)) {
		throw new Error('Invalid mnemonic');
	}
	const chain = CHAIN_AVAILABLES.find(c => c.id === chainId) || CHAIN_DEFAULT;
	const provider = new providers.JsonRpcProvider(chain.rpcUrl, chain.id);
	const wallet = Wallet.fromMnemonic(mnemonic);
	const web3Wallet = new EVMWallet(wallet.privateKey, provider);
	return web3Wallet;
};

const generateWalletFromPrivateKey = async (
	privateKey: string,
	chainId?: number
): Promise<Web3Wallet> => {
	if (!utils.isHexString(privateKey)) {
		throw new Error('Invalid private key');
	}

	const chain = CHAIN_AVAILABLES.find(c => c.id === chainId) || CHAIN_DEFAULT;
	const provider = new providers.JsonRpcProvider(chain.rpcUrl, chain.id);
	const wallet = new EVMWallet(privateKey, provider);
	return wallet;
	// const ethrDid = generateDID(wallet.address);
	// return {
	// 	privateKey: wallet.privateKey,
	// 	publicKey: wallet.publicKey,
	// 	address: wallet.address,
	// 	provider
	// };
};

interface WindowWithEthereumProvider extends Window {
	ethereum: providers.ExternalProvider;
}

const connectWithExternalWallet = async (): Promise<Web3Wallet> => {
	// check if metamask/browser extension is installed
	if (!(window as unknown as WindowWithEthereumProvider).ethereum) {
		throw new Error(`
      No web3 wallet extension found. 
      Install browser extensions like Metamask or Rabby wallet to connect with the app using your existing or hardware wallet.
    `);
	}
	// get current account
	const web3Provider = new providers.Web3Provider(
		(window as unknown as WindowWithEthereumProvider).ethereum
	);
	const accounts = await web3Provider.send('eth_requestAccounts', []);
	console.log(`[INFO] connectWithExternalWallet: `, accounts);
	// set to default chain
	try {
		const chainIdAsHex = utils.hexValue(CHAIN_DEFAULT.id);
		await web3Provider.send('wallet_switchEthereumChain', [
			{ chainId: chainIdAsHex }
		]);
	} catch (error: unknown) {
		console.log('[ERROR]', error);
	}
	const signer = web3Provider?.getSigner();
	const address = await signer.getAddress();
	const chainId = await signer.getChainId();
	console.log('[INFO] connectWithExternalWallet', {
		accounts,
		address,
		chainId
	});

	// return object fromated as Web3Wallet
	return {
		privateKey: undefined,
		publicKey: undefined,
		address,
		provider: web3Provider,
		sendTransaction: async (
			tx: utils.Deferrable<providers.TransactionRequest>
		) => {
			return signer.sendTransaction(tx);
		},
		signMessage(message) {
			return signer.signMessage(message);
		},
		signTransaction(tx: utils.Deferrable<providers.TransactionRequest>) {
			return signer.signTransaction(tx);
		},
		verifySignature(message, signature) {
			return utils.verifyMessage(message, signature) === address;
		}
	};
};

const evmWallet: Readonly<IWalletProvider> = Object.freeze({
	connectWithExternalWallet,
	generateWalletFromPrivateKey,
	generateWalletFromMnemonic,
	generateDID
});

export default evmWallet;
