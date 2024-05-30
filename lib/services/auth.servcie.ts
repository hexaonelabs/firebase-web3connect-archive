import { passwordValidationOrSignature } from '../providers/crypto/password';
import authProvider from '../providers/auth/firebase';
import Crypto from '../providers/crypto/crypto';
import { KEYS } from '../constant';
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

	// store to local storage tag to trigger download of the private key
	// if user want to skip now and download later on connectWithUI()
	// use timestamp to trigger download later
	if (skip === true) {
		await storageService.setItem(KEYS.STORAGE_SKIP_BACKUP_KEY, `${Date.now()}`);
	}
	// Now we can connect with Google
	const result = await authProvider
		.signinWithGoogle(privateKey || undefined)
		.catch(async (error: { code?: string; message?: string }) => {
			const { code = '', message = '' } = error;
			switch (true) {
				case (code === 'auth/google-account-already-in-use' ||
					message === 'auth/google-account-already-in-use') &&
					!privateKey: {
					console.log(`[ERROR] Signin Step: ${code || message}`);
					// if email already in use & no ptivatekey, ask to import Wallet Backup file instead
					storageService.clear();
					localStorage.removeItem(KEYS.STORAGE_BACKUP_KEY);
					await authProvider.signOut();
					throw new Error(
						`This Google Account is already used and connected to other device. Import your private key instead using: "Connect Wallet -> Import Wallet".`
					);
				}
			}
			throw error;
		});
	return result;
};

export const authWithEmailPwd = async (ops: {
	email: string;
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
	const privateKey =
		(await storageService.getItem(KEYS.STORAGE_PRIVATEKEY_KEY)) || undefined;
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
	const result = await authProvider
		.signInWithEmailPwd(ops.email, ops.password, privateKey)
		.catch(async (error: { code?: string; message?: string }) => {
			// clean storage if error on creation step
			const { code = '', message = '' } = error;
			switch (true) {
				case code === 'auth/email-already-in-use' && !privateKey: {
					// if email already in use & no ptivatekey, ask to import Wallet Backup file instead
					storageService.clear();
					localStorage.removeItem(KEYS.STORAGE_BACKUP_KEY);
					await authProvider.signOut();
					throw new Error(
						`This email is already used and connected to other device. Import your private key instead using: "Connect Wallet -> Import Wallet".`
					);
				}
				case code === 'auth/weak-password':
				case code === 'auth/invalid-email': {
					console.error(`[ERROR] Signin Step: ${code}: ${message}`);
					storageService.clear();
					localStorage.removeItem(KEYS.STORAGE_BACKUP_KEY);
					break;
				}
				case code === 'auth/invalid-credential': {
					console.error(`[ERROR] Signin Step: ${code}: ${message}`);
					storageService.clear();
					localStorage.removeItem(KEYS.STORAGE_BACKUP_KEY);
					throw new Error(
						`This email is already used and connected to other device. Import your private key instead using: "Connect Wallet -> Import Wallet".`
					);
				}
			}
			throw error;
		});
	return result;
};

export const authWithExternalWallet = async () => {
	console.log('authWithExternalWallet');
	const {
		user: { uid }
	} = await authProvider.signInAsAnonymous();
	return { uid };
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
		password
	});
	return { uid };
};
