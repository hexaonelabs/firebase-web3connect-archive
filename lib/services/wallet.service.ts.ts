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
	// check if encrypted mnemonic is available from storage
	const storedEncryptedMnemonic = await storageService.getItem(
		KEYS.STORAGE_PRIVATEKEY_KEY
	);
	const mnemonic = storedEncryptedMnemonic
		? await Crypto.decrypt(secret, storedEncryptedMnemonic)
		: undefined;
	// generate wallet from encrypted mnemonic or generate new from random mnemonic

	const wallet = await evmWallet.generateWalletFromMnemonic(mnemonic, chainId);
	if (!secret) {
		await authProvider.signOut();
		throw new Error('Secret is required to encrypt the mnemonic.');
	}
	if (!wallet.privateKey) {
		throw new Error('Failed to generate wallet from mnemonic');
	}
	// encrypt mnemonic before storing it
	if (wallet.mnemonic) {
		const encryptedMnemonic = await Crypto.encrypt(secret, wallet.mnemonic);
		await storageService.setItem(
			KEYS.STORAGE_PRIVATEKEY_KEY,
			encryptedMnemonic
		);
	}
	return wallet;
};
