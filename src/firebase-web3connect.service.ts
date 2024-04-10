import { FirebaseWeb3Connect } from '../lib';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { parseApiKey } from '../lib/utils';

const SECRET = import.meta.env.VITE_FIREBASE_CONFIG || ''; // get config from .env file
const FIREBASE_CONFIG = parseApiKey(SECRET.slice(2));

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
// Initialize Firebase Auth
const auth = getAuth(app);

// Initialize local instance of FirebaseWeb3Connect
export const firebaseWeb3Connect = new FirebaseWeb3Connect(auth, 'APIKEY', {
	// enabledSigninMethods: [
	//   SigninMethod.Google,
	// ],
	// storageService: {
	//   apiKey: import.meta.env.VITE_STORAGE_APIKEY,
	// }
});

export const isConnectWithLink = async () => {
	return FirebaseWeb3Connect.isConnectWithLink();
};
export const connectWithLink = async () => {
	return FirebaseWeb3Connect.connectWithLink();
};
