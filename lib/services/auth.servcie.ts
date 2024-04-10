import { passwordValidationOrSignature } from '../providers/crypto/password';
import authProvider from '../providers/auth/firebase';
import Crypto from '../providers/crypto/crypto';
import evmWallet from '../networks/evm';
import { CHAIN_DEFAULT, KEYS } from '../constant';
import { storageService } from './storage.service';

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
	const privateKey = await storageService.getItem(KEYS.STORAGE_PRIVATEKEY_KEY);
	if (!privateKey && !skip) {
		// store to local storage tag to trigger download of the private key
		// when the user is connected (using listener onConnectStateChanged)
		localStorage.setItem(
			KEYS.STORAGE_BACKUP_KEY,
			withEncryption ? 'true' : 'false'
		);
	}

	// encrypt secret with user secret and store it
	const encryptedSecret = await Crypto.encrypt(
		storageService.getUniqueID(),
		password
	);
	await storageService.setItem(KEYS.STORAGE_SECRET_KEY, encryptedSecret);

	// Now we can connect with Google
	return await authProvider.signinWithGoogle();
};

export const authWithExternalWallet = async (
	networkId: number = CHAIN_DEFAULT.id
) => {
	console.log('authWithExternalWallet:', { networkId });

	const { did, address, provider } =
		await evmWallet.connectWithExternalWallet();
	const {
		user: { uid }
	} = await authProvider.signInAsAnonymous();
	return { did, address, provider, uid };
};

export const authByImportPrivateKey = async (ops: {
	password: string;
	privateKey: string;
}) => {
	const { password, privateKey } = ops;

	// encrypt private key before storing it
	const encryptedPrivateKey = await Crypto.encrypt(password, privateKey);
	await storageService.setItem(
		KEYS.STORAGE_PRIVATEKEY_KEY,
		encryptedPrivateKey
	);
	// trigger Auth with Google
	const { uid } = await authWithGoogle({
		password,
		skip: true,
		withEncryption: true
	});
	return { uid };
};
