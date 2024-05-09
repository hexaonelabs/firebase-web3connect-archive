import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { BIP32Factory } from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { Web3Wallet } from './web3-wallet';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import { IWalletProvider } from '../interfaces/walllet-provider.interface';

const generateDID = (address: string) => {
	return `did:ethr:${address}`;
};

class BTCWallet extends Web3Wallet {
	public chainId: number;

	constructor(
		mnemonic: string,
		network: bitcoin.Network = bitcoin.networks.bitcoin,
		derivationPath: string = "m/44'/0'/0'/0/0"
	) {
		super(mnemonic);
		if (!this._mnemonic) {
			throw new Error('Mnemonic is required to generate wallet');
		}
		const bip32 = BIP32Factory(ecc);
		const seed = mnemonicToSeedSync(this._mnemonic);
		const path = derivationPath;
		// generate key pair
		const node = bip32.fromSeed(seed);
		const keyPair = node.derivePath(path);
		const pubkey = keyPair.publicKey;
		const publicKey = pubkey.toString('hex');
		const privateKey = keyPair.toWIF();
		if (!privateKey || !publicKey) {
			throw new Error('Failed to generate key pair');
		}
		// generate address
		const { address } = bitcoin.payments.p2pkh({
			pubkey,
			network
		});
		// check if address is generated
		if (!address) {
			throw new Error('Failed to generate wallet');
		}
		// set wallet properties
		this.address = address;
		this.publicKey = publicKey;
		this.privateKey = privateKey;
		this.chainId = network.wif;
	}

	sendTransaction(tx: unknown): Promise<TransactionResponse> {
		console.log('sendTransaction', tx);
		throw new Error('Method not implemented.');
	}

	signTransaction(tx: unknown): Promise<string> {
		console.log('signTransaction', tx);
		throw new Error('Method not implemented.');
	}

	signMessage(message: string): Promise<string> {
		console.log('signMessage', message);
		throw new Error('Method not implemented.');
	}

	verifySignature(message: string, signature: string): boolean {
		console.log('verifySignature', message, signature);
		throw new Error('Method not implemented.');
	}
}

const generateWalletFromMnemonic = async (ops: {
	mnemonic?: string;
	derivationPath?: string;
	network?: bitcoin.Network;
}): Promise<Web3Wallet> => {
	const { mnemonic = generateMnemonic(), derivationPath, network } = ops;
	if (derivationPath) {
		const purpose = derivationPath?.split('/')[1];
		if (purpose !== "44'") {
			throw new Error('Invalid derivation path ');
		}
	}
	const wallet = new BTCWallet(mnemonic, network, derivationPath);
	return wallet;
};

const btcWallet: Readonly<
	IWalletProvider<{
		mnemonic?: string;
		derivationPath?: string;
		network?: bitcoin.Network;
	}>
> = Object.freeze({
	connectWithExternalWallet: async () => {
		throw new Error('Method not implemented.');
	},
	generateWalletFromMnemonic,
	generateDID
});

export default btcWallet;
