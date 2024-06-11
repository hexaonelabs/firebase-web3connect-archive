// Import the functions you need from the SDKs you need
// import { FirebaseOptions, initializeApp } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import {
	GoogleAuthProvider,
	signInWithPopup,
	sendSignInLinkToEmail,
	isSignInWithEmailLink,
	signInWithEmailLink,
	signInAnonymously,
	signOut as signOutFormFirebase,
	Auth,
	onAuthStateChanged as onAuthStateChangedFirebase,
	User,
	browserPopupRedirectResolver,
	signInWithEmailAndPassword,
	createUserWithEmailAndPassword,
	sendEmailVerification,
	// beforeAuthStateChanged,
	getAdditionalUserInfo
} from 'firebase/auth';
import { IAuthProvider } from '../../interfaces/auth-provider.interface';
import { KEYS } from '../../constant';
import { Logger } from '../../utils';

let auth!: Auth;

const signinWithGoogle = async (privateKey?: string) => {
	// Initialize Firebase Google Auth
	let credential;
	try {
		const provider = new GoogleAuthProvider();
		credential = await signInWithPopup(
			auth,
			provider,
			browserPopupRedirectResolver
		);
		// alert('DEBUG: uuid - ' + credential.user.uid);
		credential.user;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		const message = error.message || error.code || 'Signin with Google failed';
		// alert('DEBUG: ' + message);
		throw new Error(message);
	}
	if (!credential) {
		throw new Error('Credential not found');
	}
	const { isNewUser } = getAdditionalUserInfo(credential) || {};
	if (!isNewUser && !privateKey) {
		await signOut();
		throw new Error(`auth/google-account-already-in-use`);
	}
	return credential.user;
};

const sendLinkToEmail = async (email: string) => {
	const url = `${window.location.origin}/?${KEYS.URL_QUERYPARAM_FINISH_SIGNUP}=true`;
	const actionCodeSettings = {
		// URL you want to redirect back to. The domain (www.example.com) for this
		// URL must be in the authorized domains list in the Firebase Logger.
		url,
		// This must be true.
		handleCodeInApp: true
		// dynamicLinkDomain: 'example.page.link'
	};
	// Initialize Firebase email Auth

	// await setPersistence(auth, browserLocalPersistence);
	await sendSignInLinkToEmail(auth, email, actionCodeSettings);
	// The link was successfully sent. Inform the user.
	// Save the email locally so you don't need to ask the user for it again
	// if they open the link on the same device.
	window.localStorage.setItem(KEYS.STORAGE_EMAIL_FOR_SIGNIN_KEY, email);
};

const signInWithLink = async () => {
	if (!isSignInWithEmailLink(auth, window.location.href)) {
		return undefined;
	}
	Logger.log(
		'[INFO] FirebaseWeb3Connect - signInWithLink: ',
		window.location.href
	);
	// Additional state parameters can also be passed via URL.
	// This can be used to continue the user's intended action before triggering
	// the sign-in operation.
	// Get the email if available. This should be available if the user completes
	// the flow on the same device where they started it.
	let email = window.localStorage.getItem(KEYS.STORAGE_EMAIL_FOR_SIGNIN_KEY);
	if (!email) {
		// User opened the link on a different device. To prevent session fixation
		// attacks, ask the user to provide the associated email again. For example:
		email = window.prompt('Please provide your email for confirmation');
	}
	if (!email) {
		throw new Error('No email provided');
	}

	// The client SDK will parse the code from the link for you.
	const credential = await signInWithEmailLink(
		auth,
		email,
		window.location.href
	); //.catch(err => err)
	// You can check if the user is new or existing:
	// result.additionalUserInfo.isNewUser
	// Clear email from storage.
	window.localStorage.removeItem(KEYS.STORAGE_EMAIL_FOR_SIGNIN_KEY);
	return credential;
};

const signInAsAnonymous = async () => {
	return await signInAnonymously(auth);
};

const signInWithEmailPwd = async (
	email: string,
	password: string,
	privateKey?: string
) => {
	let user!: User;
	try {
		// Create user with email and password
		const credential = await createUserWithEmailAndPassword(
			auth,
			email,
			password
		);
		user = credential.user;
		if (!user.emailVerified) {
			await sendEmailVerification(user);
		}
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} catch (error: any) {
		// only error with { code: string } type
		if (error?.code === 'auth/email-already-in-use' && privateKey) {
			const credential = await signInWithEmailAndPassword(
				auth,
				email,
				password
			);
			user = credential.user;
			return user;
		}
		throw error;
	}
	if (!user) {
		throw new Error('User not found');
	}
	return user;
};

const signOut = async () => {
	await signOutFormFirebase(auth);
};

const initialize = (_auth: Auth) => {
	auth = _auth;
	// Object.freeze(auth);
};

const getOnAuthStateChanged = (cb: (user: User | null) => void) =>
	onAuthStateChangedFirebase(auth, user => cb(user));

const getCurrentUserAuth = async () => {
	return auth.currentUser;
};

const FirebaseAuthProvider: IAuthProvider = {
	signinWithGoogle,
	sendLinkToEmail,
	signInWithLink,
	signInAsAnonymous,
	signInWithEmailPwd,
	signOut,
	getOnAuthStateChanged,
	getCurrentUserAuth,
	initialize
};

export default FirebaseAuthProvider;
