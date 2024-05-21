import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import * as solanaWeb3 from '@solana/web3.js';
import {
	getOrCreateAssociatedTokenAccount,
	transfer as transferToken,
	getMint
} from '@solana/spl-token';
import { derivePath } from 'ed25519-hd-key';
import * as bs58 from 'bs58';
import { Web3Wallet } from './web3-wallet';
import { IWalletProvider } from '../interfaces/walllet-provider.interface';
import { NETWORK } from '../constant';

const generateDID = (address: string) => {
	return `did:ethr:${address}`;
};

class SolanaWallet extends Web3Wallet {
	private _rpcUrl: string = '';
	public chainId: number = NETWORK.solana;

	constructor(mnemonic: string, derivationPath: string = "m/44'/501'/0'/0'") {
		super();
		if (!mnemonic) {
			throw new Error('Mnemonic is required to generate wallet');
		}
		const seed = mnemonicToSeedSync(mnemonic);
		const path = derivationPath;
		const derivedSeed = derivePath(path, seed as unknown as string).key;
		// generate key pair
		const { publicKey, secretKey } = solanaWeb3.Keypair.fromSeed(derivedSeed);
		const privateKey = bs58.encode(secretKey);
		if (!privateKey || !publicKey) {
			throw new Error('Failed to generate key pair');
		}
		// generate address
		const address = publicKey.toBase58();
		// check if address is generated
		if (!address) {
			throw new Error('Failed to generate wallet');
		}
		// set wallet properties
		this.address = address;
		this.publicKey = publicKey.toString();
		this._privateKey = privateKey;
	}

	async sendTransaction(tx: {
		recipientAddress: string;
		amount: number;
		tokenAddress?: string;
	}): Promise<solanaWeb3.TransactionResponse> {
		console.log('sendTransaction', tx);
		if (!this._privateKey) {
			throw new Error('Private key is required to send transaction');
		}
		const connection = this._getConnection(this._rpcUrl);

		const recipient = new solanaWeb3.PublicKey(tx.recipientAddress);
		let secretKey;
		let signature;

		if (this._privateKey.split(',').length > 1) {
			secretKey = new Uint8Array(
				this._privateKey.split(',') as Iterable<number>
			);
		} else {
			secretKey = bs58.decode(this._privateKey);
		}

		const from = solanaWeb3.Keypair.fromSecretKey(secretKey, {
			skipValidation: true
		});

		if (tx.tokenAddress) {
			// Get token mint
			const mint = await getMint(
				connection,
				new solanaWeb3.PublicKey(tx.tokenAddress)
			);

			// Get the token account of the from address, and if it does not exist, create it
			const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
				connection,
				from,
				mint.address,
				from.publicKey
			);

			// Get the token account of the recipient address, and if it does not exist, create it
			const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
				connection,
				from,
				mint.address,
				recipient
			);

			signature = await transferToken(
				connection,
				from,
				fromTokenAccount.address,
				recipientTokenAccount.address,
				from.publicKey,
				solanaWeb3.LAMPORTS_PER_SOL * tx.amount
			);
		} else {
			const transaction = new solanaWeb3.Transaction().add(
				solanaWeb3.SystemProgram.transfer({
					fromPubkey: from.publicKey,
					toPubkey: recipient,
					lamports: solanaWeb3.LAMPORTS_PER_SOL * tx.amount
				})
			);

			// Sign transaction, broadcast, and confirm
			signature = await solanaWeb3.sendAndConfirmTransaction(
				connection,
				transaction,
				[from]
			);
		}

		const txRecipe = await connection.getTransaction(signature);
		if (!txRecipe) {
			throw new Error('Transaction not found');
		}
		return {
			...txRecipe
		};
	}

	signTransaction(tx: unknown): Promise<string> {
		console.log('signTransaction', tx);
		throw new Error('Method not implemented.');
	}

	async signMessage(message: string): Promise<string> {
		console.log('signMessage', message);
		throw new Error('Method not implemented.');
	}

	verifySignature(message: string, signature: string): boolean {
		console.log('[INFO]: verifySignature:', { message, signature });
		if (!this.address) {
			throw new Error('Address is required to verify signature');
		}
		throw new Error('Method not implemented.');
	}

	async switchNetwork(chainId: number): Promise<void> {
		console.log('switchNetwork', chainId);
		throw new Error('Method not implemented.');
	}

	private _getConnection = (rpcUrl?: string) => {
		const connection = this._provider(rpcUrl);

		return connection;
	};

	private _provider(rpcUrl?: string) {
		return new solanaWeb3.Connection(rpcUrl as string);
	}
}

const generateWalletFromMnemonic = async (ops: {
	mnemonic?: string;
	derivationPath?: string;
}): Promise<Web3Wallet> => {
	const { mnemonic = generateMnemonic(), derivationPath } = ops;
	if (derivationPath) {
		const purpose = derivationPath?.split('/')[1];
		if (purpose !== "44'") {
			throw new Error('Invalid derivation path ');
		}
	}
	const wallet = new SolanaWallet(mnemonic, derivationPath);
	return wallet;
};

const solanaWallet: Readonly<
	IWalletProvider<{
		mnemonic?: string;
		derivationPath?: string;
	}>
> = Object.freeze({
	connectWithExternalWallet: async () => {
		throw new Error('Method not implemented.');
	},
	generateWalletFromMnemonic,
	generateDID
});

export default solanaWallet;
