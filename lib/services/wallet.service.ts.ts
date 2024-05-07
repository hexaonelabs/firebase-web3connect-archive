import evmWallet from '../networks/evm';
import Crypto from '../providers/crypto/crypto';
import authProvider from '../providers/auth/firebase';
import { KEYS } from '../constant';
import { storageService } from './storage.service';

export const initWallet = async (
	user: {
		uid: string;
		isAnonymous: boolean;
	} | null,
	secret?: string,
	chainId?: number
) => {
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
		const { did, address, provider } =
			await evmWallet.connectWithExternalWallet();
		return { did, address, provider };
	}
	// others methods require _secret.
	// Handle case where _secret is not required
	if (!secret) {
		// throw new Error("Secret is required to decrypt the private key and initialize the wallet.");
		return null;
	}
	// connect using auth service
	// check if encrypted private key is available from storage
	const storedEncryptedPrivateKey = await storageService.getItem(
		KEYS.STORAGE_PRIVATEKEY_KEY
	);
	// generate wallet from encrypted private key or generate new from random mnemonic
	const { address, did, provider, publicKey, privateKey } =
		storedEncryptedPrivateKey
			? // decrypt private key before generating wallet
				await Crypto.decrypt(secret, storedEncryptedPrivateKey).then(
					storedPrivateKey =>
						evmWallet.generateWalletFromPrivateKey(storedPrivateKey, chainId)
				)
			: // generate new wallet from random mnemonic
				await evmWallet.generateWalletFromMnemonic().then(async wallet => {
					if (!secret) {
						await authProvider.signOut();
						throw new Error('Secret is required to encrypt the private key.');
					}
					// encrypt private key before storing it
					const encryptedPrivateKey = await Crypto.encrypt(
						secret,
						wallet.privateKey
					);
					await storageService.setItem(
						KEYS.STORAGE_PRIVATEKEY_KEY,
						encryptedPrivateKey
					);
					return wallet;
				});

	// return wallet values with the generated wallet
	return { did, address, provider, publicKey, privateKey };
};
