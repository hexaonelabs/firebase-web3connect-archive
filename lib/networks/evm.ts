import { Wallet, utils, providers, Contract, constants, Signer } from 'ethers';
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
	public chainId: number;

	constructor(mnemonic: string, provider: providers.JsonRpcProvider) {
		super();
		if (!mnemonic) {
			throw new Error('Mnemonic is required to generate wallet');
		}
		const _w = Wallet.fromMnemonic(mnemonic);
		const _wallet = new Wallet(_w.privateKey, provider);
		const wallet = _wallet.connect(provider);
		this.address = wallet.address;
		this.publicKey = wallet.publicKey;
		this._privateKey = wallet.privateKey;
		this.did = generateDID(this.address);
		this.provider = provider;
		this.chainId = provider.network.chainId;
	}

	async sendTransaction(tx: {
		to: string;
		value: string;
		contractAddress: string;
	}): Promise<providers.TransactionResponse> {
		if (!this._privateKey) {
			throw new Error('Private key is required to send token');
		}
		const {
			to: destination,
			value: decimalAmount,
			contractAddress = constants.AddressZero
		} = tx;
		try {
			const wallet = new Wallet(this._privateKey, this.provider);
			// Check if the receiver address is the same as the token contract address
			if (destination.toLowerCase() === contractAddress.toLowerCase()) {
				// Sending tokens to the token contract address
				throw new Error(
					'Sending tokens to ERC20 contract address is not allowed.'
				);
			}
			const amount = utils.parseUnits(decimalAmount.toString()); // Convert 1 ether to wei

			let tx;
			// Check if the token address is the same as the native ETH address
			if (
				contractAddress.toLowerCase() === constants.AddressZero.toLowerCase()
			) {
				console.log('[INFO] Sending native token');
				tx = await wallet.sendTransaction({
					to: destination,
					value: amount
				});
			} else {
				console.log('[INFO] Sending erc20 token');
				// ABI (Application Binary Interface) of the ERC20 token contract
				const tokenABI = [
					// Standard ERC20 functions
					'function balanceOf(address) view returns (uint)',
					'function transfer(address to, uint amount) returns (boolean)'
				];
				const wallet = new Wallet(this._privateKey, this.provider);
				// Load the ERC20 token contract
				const tokenContract = new Contract(contractAddress, tokenABI, wallet);
				// Convert amount to wei if necessary
				// (depends on the token's decimal precision)
				// Call the transfer function of the ERC20 token contract
				tx = await tokenContract.transfer(destination, amount);
			}
			console.log('[INFO] Transaction Hash:', tx.hash);
			const receipt = await tx.wait();
			console.log('[INFO] Transaction confirmed');
			return receipt;
		} catch (error) {
			console.error('[ERROR] _sendToken:', error);
			throw error;
		}
	}

	signMessage(message: string): Promise<string> {
		if (!this._privateKey) {
			throw new Error('Private key is required to sign message');
		}
		const wallet = new Wallet(this._privateKey, this.provider);
		return wallet.signMessage(message);
	}

	signTransaction(message: providers.TransactionRequest): Promise<string> {
		if (!this._privateKey) {
			throw new Error('Private key is required to sign transaction');
		}
		const wallet = new Wallet(this._privateKey, this.provider);
		return wallet.signTransaction(message);
	}

	verifySignature(message: string, signature: string): boolean {
		if (!this.publicKey) {
			throw new Error('Public key is required to verify signature');
		}
		return utils.verifyMessage(message, signature) === this.address;
	}

	async switchNetwork(chainId: number): Promise<void> {
		if (this.chainId === chainId) {
			return;
		}
		const chain = CHAIN_AVAILABLES.find(c => c.id === chainId);
		if (!chain) {
			throw new Error('Chain not available');
		}
		if (!this.provider) {
			throw new Error('Provider not available');
		}
		const provider = new providers.JsonRpcProvider(chain.rpcUrl, chain.id);
		this.provider = provider;
		this.chainId = chainId;
	}
}

class ExternalEVMWallet extends Web3Wallet {
	privateKey = undefined;
	publicKey = undefined;
	signer!: Signer;
	externalProvider!: providers.Web3Provider;

	constructor(
		public chainId: number,
		fromInitializer: boolean = false
	) {
		super();
		if (!fromInitializer) {
			throw new Error('Use create method to initialize ExternalEVMWallet');
		}
	}

	static async create(chainId: number) {
		const wallet = new ExternalEVMWallet(chainId, true);
		// get current account
		const externalProvider = new providers.Web3Provider(
			(window as unknown as WindowWithEthereumProvider).ethereum,
			chainId
		);
		wallet.externalProvider = externalProvider;
		wallet.signer = externalProvider.getSigner();
		wallet.chainId = chainId;
		wallet.address = await wallet.signer.getAddress();
		return wallet;
	}

	async switchNetwork(chainId: number): Promise<void> {
		const chain = CHAIN_AVAILABLES.find(c => c.id === chainId);
		if (!chain) {
			throw new Error('Chain not available');
		}
		if (chain.type !== 'evm') {
			throw new Error('Only EVM chain is supported with external wallet.');
		}
		const chainIdAsHex = utils.hexValue(chainId);
		await this.externalProvider.send('wallet_switchEthereumChain', [
			{ chainId: chainIdAsHex }
		]);
		this.chainId = chainId;
	}
	async sendTransaction(tx: utils.Deferrable<providers.TransactionRequest>) {
		return this.signer.sendTransaction(tx);
	}
	signMessage(message: string) {
		return this.signer.signMessage(message);
	}

	signTransaction(tx: utils.Deferrable<providers.TransactionRequest>) {
		return this.signer.signTransaction(tx);
	}
	verifySignature(message: string, signature: string) {
		return utils.verifyMessage(message, signature) === this.address;
	}
}

const generateWalletFromMnemonic = async (
	ops: {
		mnemonic?: string;
		chainId?: number;
	} = {}
) => {
	const { mnemonic = generateMnemonic(), chainId } = ops;
	// validate mnemonic
	if (!validateMnemonic(mnemonic)) {
		throw new Error('Invalid mnemonic');
	}
	const chain = CHAIN_AVAILABLES.find(c => c.id === chainId) || CHAIN_DEFAULT;
	const provider = new providers.JsonRpcProvider(chain.rpcUrl, chain.id);
	const web3Wallet = new EVMWallet(mnemonic, provider);
	return web3Wallet;
};

// const generateWalletFromPrivateKey = async (
// 	privateKey: string,
// 	chainId?: number
// ): Promise<Web3Wallet> => {
// 	if (!utils.isHexString(privateKey)) {
// 		throw new Error('Invalid private key');
// 	}

// 	const chain = CHAIN_AVAILABLES.find(c => c.id === chainId) || CHAIN_DEFAULT;
// 	const provider = new providers.JsonRpcProvider(chain.rpcUrl, chain.id);
// 	const wallet = new EVMWallet(privateKey, provider);
// 	return wallet;
// 	// const ethrDid = generateDID(wallet.address);
// 	// return {
// 	// 	privateKey: wallet.privateKey,
// 	// 	publicKey: wallet.publicKey,
// 	// 	address: wallet.address,
// 	// 	provider
// 	// };
// };

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
	const wallet = await ExternalEVMWallet.create(chainId);
	return wallet;
};

const evmWallet: Readonly<
	IWalletProvider<{ mnemonic?: string; chainId?: number }>
> = Object.freeze({
	connectWithExternalWallet,
	generateWalletFromMnemonic,
	generateDID
});

export default evmWallet;
