# Setup SDK

Setup Firebase Web3Connect with your Firebase project settings.

```javascript
import { FirebaseOptions, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Import FirebaseWeb3Connect from the package
import { FirebaseWeb3Connect, SigninMethod } from '@hexaonelabs/firebase-web3connect';

const firebaseConfig: FirebaseOptions = {
  // Your Firebase configuration here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Initialize Firebase Auth
const auth = getAuth(app);

// create local instance of FirebaseWeb3Connect that you will use
// into your application to connect and manage users with Web3 wallets
const firebaseWeb3Connect = new FirebaseWeb3Connect(auth, APIKEY);

// now you can use `firebaseWeb3Connect` instance to connect and manage users with Web3 wallets

```
