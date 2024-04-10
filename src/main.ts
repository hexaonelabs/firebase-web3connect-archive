import { setupAccountTab } from './account';
import { setupConnectTab } from './connect';
import {
	firebaseWeb3Connect,
	isConnectWithLink,
	connectWithLink
} from './firebase-web3connect.service';
import './style.css';

console.log('[INFO] App demo initialization...', import.meta.env);
// get the root app element and check if it exists
const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
	throw new Error('no root app provided');
}

// check if user is connecting with email link
const isConnecting = await isConnectWithLink();

// if user is connecting with email link, connect with email link
// otherwise, setup the UI using FirebaseWeb3Connect.onConnectStateChanged() callback
// to show the connect tab or account tab based on user state
if (isConnecting) {
	try {
		await connectWithLink();
		app.innerHTML = `
      <h1>Sign in with email link</h1>
      <p>
      Thank you for signing in with email link. You can close this tab now and go back to the app.
      </p>
    `;
	} catch (err: any) {
		app.innerHTML = `
      <h1>Error</h1>
      <p>
      ${err.message}
      </p>
    `;
	}
} else {
	// setup the UI using FirebaseWeb3Connect.onConnectStateChanged() callback
	firebaseWeb3Connect.onConnectStateChanged(async user => {
		if (user) {
			setupAccountTab(app, firebaseWeb3Connect);
		} else {
			setupConnectTab(app);
		}
	});
}
