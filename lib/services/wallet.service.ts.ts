import evmWallet from '../networks/evm';
import Crypto from '../providers/crypto/crypto';
import authProvider from '../providers/auth/firebase';
import { KEYS } from '../constant';
import { storageService } from './storage.service';
import { Web3Wallet } from '../networks/web3-wallet';

export const initWallet = async (
	user: {
		uid: string;
		isAnonymous: boolean;
	} | null,
	secret?: string,
	chainId?: number
): Promise<Web3Wallet> => {
	console.log('[INFO] initWallet:', { user, secret });

	if (!secret && user && !user.isAnonymous) {
		// check if secret is stored in local storage
		const encryptedSecret = await storageService.getItem(
			KEYS.STORAGE_SECRET_KEY
		);
		console.log('>> no secret > get encryptedSecret:', encryptedSecret);
		if (encryptedSecret) {
			secret = await Crypto.decrypt(
				storageService.getUniqueID(),
				encryptedSecret
			);
		}
	}

	// connect with external wallet
	if (!secret && user && user.isAnonymous === true) {
		const wallet = await evmWallet.connectWithExternalWallet();
		return wallet;
	}

	// others methods require _secret.
	// Handle case where _secret is not required
	if (!secret) {
		throw new Error(
			'Secret is required to decrypt the private key and initialize the wallet.'
		);
		// return null;
	}

	// connect using auth service
	// check if encrypted private key is available from storage
	const storedEncryptedPrivateKey = await storageService.getItem(
		KEYS.STORAGE_PRIVATEKEY_KEY
	);
	// generate wallet from encrypted private key or generate new from random mnemonic
	if (storedEncryptedPrivateKey) {
		// decrypt private key before generating wallet
		const storedPrivateKey = await Crypto.decrypt(
			secret,
			storedEncryptedPrivateKey
		);
		const wallet = await evmWallet.generateWalletFromPrivateKey(
			storedPrivateKey,
			chainId
		);
		return wallet;
	} else {
		const wallet = await evmWallet.generateWalletFromMnemonic();
		if (!secret) {
			await authProvider.signOut();
			throw new Error('Secret is required to encrypt the private key.');
		}
		if (!wallet.privateKey) {
			throw new Error('Failed to generate wallet from mnemonic');
		}
		// encrypt private key before storing it
		const encryptedPrivateKey = await Crypto.encrypt(secret, wallet.privateKey);
		await storageService.setItem(
			KEYS.STORAGE_PRIVATEKEY_KEY,
			encryptedPrivateKey
		);
		return wallet;
	}
};
