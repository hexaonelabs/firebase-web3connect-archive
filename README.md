# 🔌 Firebase Web3Connect

> 🔥 Introducing Firebase Web3Connect: Your Gateway to Seamless Web3 Integration! 🌐

Firebase Web3Connect brings the power of Web3 directly to your Firebase Authentication workflow, seamlessly integrating with Firebase's robust authentication system.

With Firebase Web3Connect, you can effortlessly leverage all the advantages of Firebase Authentication, including support for multiple sign-in methods, user management, and secure authentication flows.

Gone are the days of managing separate authentication systems for your Web3 applications. With Firebase Web3Connect, you can easily extend Firebase Authentication to support Web3 sign-in methods, allowing your users to authenticate with their favorite Web3 wallets alongside traditional email/password or social sign-ins.

By plugging Firebase Web3Connect into your Firebase project, you unlock a world of possibilities for your Web3 applications. Whether you're building a decentralized marketplace, a blockchain-based game, or a decentralized finance (DeFi) platform, Firebase Web3Connect seamlessly integrates with Firebase Authentication to provide a unified authentication experience for your users.

Experience the simplicity of integrating Web3 authentication with Firebase Authentication. With Firebase Web3Connect, connecting your Web3 application to Firebase has never been easier. Get started today and elevate your Web3 authentication experience with Firebase Web3Connect. 🔐🌐

## Features

- **Seamless Integration:** Easily plug Web3 authentication into your Firebase project.
- **Multiple Sign-in Methods:** Support for multiple sign-in methods, including Web3 wallets, email/password, and social sign-ins.
- **Firebase Authentication:** Leverage all the advantages of Firebase Authentication, including user management and secure authentication flows.
- **Robust and Secure:** Built on Firebase's robust infrastructure, ensuring security and reliability for your authentication system.
- **Non-Custodial Wallet:** Firebase Web3Connect is non-custodial, meaning users retain control of their private keys and funds.
- **Open Source:** Firebase Web3Connect is open source, allowing for contributions from the community and transparency in development.

## Getting Started

To get started with Firebase Web3Connect, follow these steps:

### **1. Installation:**

Install Firebase Web3Connect in your project using npm or yarn.

```bash
npm install firebase-web3-connect
# or
yarn add firebase-web3-connect
```

### **2. Configuration:**

Configure Firebase Web3Connect with your Firebase project settings.

```javascript
import { HexaConnect, SigninMethod } from '../lib';

// create local instance of FirebaseWeb3Connect
const APIKEY = ''; // Your Firebase Web3Conect API Key

export const firebaseWeb3Connect = new FirebaseWeb3Connect(APIKEY);
```

### **3. Usage:**

Start using Firebase Web3Connect in your application to authenticate users with Web3 wallets.

```javascript
// Connect user with Web3 wallet using Firebase Authentication
const connect = async () => {
	const userInfo = await firebaseWeb3Connect.connectWithUI();
	// userInfo contains user information
	return userInfo;
};
```

```javascript
// Listen user connnection state change with `.onConnectStateChanged()` callback
firebaseWeb3Connect.onConnectStateChanged(async user => {
	if (user) {
		// user is connected with web3 wallet + firebase
	} else {
		// user is not connected
	}
});
```

### **4. Documentation:**

Explore the Firebase Web3Connect documentation for more detailed usage instructions and examples.

## Contributing

Firebase Web3Connect is open source and welcomes contributions from the community.
If you'd like to contribute, please follow the contribution guidelines outlined in the `CONTRIBUTING.md` file.

## License

Firebase Web3Connect is licensed under the MIT License.

## Support

If you like this project, please consider supporting it by giving a ⭐️ on Github and sharing it with your friends!
