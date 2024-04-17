---
layout: doc
---

# Setup SDK Options

Firebase Web3Connect SDK provides a set of options that can be used to customize the behavior of the SDK. These options can be passed to the SDK during initialization to configure the SDK according to your requirements.

```TypeScript
  FirebaseWeb3Connect(
    auth: Auth,
    apiKey: string,
    ops?: SDKOptions | undefined
  )
```

## **Options**

The following options are available for the Firebase Web3Connect SDK:

```TypeScript

type SDKApiKey = string;

type DialogUIOptions = {
	integrator?: string;
	logoUrl?: string;
	template?: {
		primaryColor?: string;
		secondaryColor?: string;
		backgroundColor?: string;
	};
	isLightMode?: boolean;
	enabledSigninMethods?: SigninMethod[];
};

type SDKOptions = {
	dialogUI?: Omit<DialogUIOptions, 'enabledSigninMethods' | 'isLightMode'>;
	chainId?: number;
	rpcUrl?: string;
	enabledSigninMethods?: SigninMethod[];
	storageService?: IStorageProvider;
};
```
