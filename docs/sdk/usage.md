# Usage

Start using Firebase Web3Connect in your application to authenticate users with Web3 wallets.

## Authentication with UI Dialog

You can connect users with Web3 wallets using Firebase Authentication with a simple UI dialog using `.connectWithUI()` method from Firebase Web3connect instance. This method will open a dialog to connect users with Web3 wallets and return user information after successful connection.

```javascript
// Connect user with Web3 wallet using Firebase Authentication
const connect = async () => {
	const userInfo = await firebaseWeb3Connect.connectWithUI();
	// userInfo contains user information
	return userInfo;
};
```

## Listening User Connection State

Like Firebase Authentication, you can listen to user connection state change with `.onConnectStateChanged()` callback from Firebase Web3connect instance. This callback will be called whenever the user connection state changes.

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

## Sign Out

You can sign out the user from Firebase Authentication using `.signOut()` method with Firebase Web3Connect instance.

```javascript
// Sign out user from Firebase Authentication
const signOut = async () => {
	await firebaseWeb3Connect.signOut();
};
```

## Get User Information

You can get user information using `.userInfo()` method with Firebase Web3Connect instance.

```javascript
// Get user information
const userInfo = firebaseWeb3Connect.userInfo();
```

## Get Wallet Singer

A Signer is an object that can sign transactions and messages with a private key.
You can get wallet signer using `.getSigner()` method with Firebase Web3Connect instance.

```javascript
// Get wallet signer
const signer = firebaseWeb3Connect.getSigner();
```
