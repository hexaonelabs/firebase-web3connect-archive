import authProvider from './providers/auth/firebase';
import storageProvider from './providers/storage/local';
import './ui/dialog-element/dialogElement';
import {
	addAndWaitUIEventsResult,
	setupSigninDialogElement
} from './ui/dialog-element';
import {
	CHAIN_AVAILABLES,
	CHAIN_DEFAULT,
	DEFAULT_SIGNIN_METHODS,
	KEYS,
	MAX_SKIP_BACKUP_TIME,
	NETWORK,
	SigninMethod
} from './constant';
// import { parseApiKey } from './utils';
import { initWallet } from './services/wallet.service.ts';
import { Auth } from 'firebase/auth';
import { SDKOptions } from './interfaces/sdk.interface.ts';
import { storageService } from './services/storage.service.ts';
import { Web3Wallet } from './networks/web3-wallet.ts';

export class FirebaseWeb3Connect {
	private readonly _apiKey!: string;
	private _ops?: SDKOptions;
	private _secret!: string | undefined;
	private _uid!: string | undefined;
	private _wallet!: Web3Wallet | undefined;
	private _wallets: Web3Wallet[] = [];

	get provider() {
		return this._wallet?.provider;
	}

	get userInfo() {
		return this._wallet
			? {
					address: this._wallet.address,
					publicKey: this._wallet.publicKey,
					chainId: this._wallet.chainId,
					uid: this._uid
				}
			: null;
	}

	get wallet() {
		return this._wallet;
	}

	constructor(auth: Auth, apiKey: string, ops?: SDKOptions) {
		this._apiKey = apiKey; // parseApiKey(apiKey.slice(2));
		this._ops = {
			enabledSigninMethods: DEFAULT_SIGNIN_METHODS,
			...ops
		};
		// initialize service dependencies
		authProvider.initialize(auth);
		// set storage.uid
		storageService.initialize(this._ops?.storageService || storageProvider);
		// check if window is available and HTMLDialogElement is supported
		if (!window || !window.HTMLDialogElement) {
			throw new Error(
				'[ERROR] FirebaseWeb3Connect: HTMLDialogElement not supported'
			);
		}
		console.log(`[INFO] FirebaseWeb3Connect initialized and ready!`, {
			config: this._ops,
			mode: import.meta.env.MODE,
			apiKey: this._apiKey,
			auth
		});
	}

	static isConnectWithLink() {
		// check special paramettre in url
		const isSignInWithLink = window.location.search.includes(
			KEYS.URL_QUERYPARAM_FINISH_SIGNUP
		);
		if (!isSignInWithLink) {
			return false;
		} else {
			return true;
		}
	}

	static connectWithLink() {
		if (!this.isConnectWithLink()) {
			return undefined;
		}
		return authProvider.signInWithLink();
	}

	public async connectWithUI(isLightMode: boolean = false) {
		// check if have an existing auth method setup
		const authMethod = (await storageService.getItem(
			KEYS.STORAGE_AUTH_METHOD_KEY
		)) as SigninMethod | null;
		// build UI
		const dialogElement = setupSigninDialogElement(document.body, {
			isLightMode,
			enabledSigninMethods:
				authMethod && authMethod !== SigninMethod.Wallet
					? [authMethod, SigninMethod.Wallet]
					: this._ops?.enabledSigninMethods,
			integrator: this._ops?.dialogUI?.integrator,
			logoUrl: this._ops?.dialogUI?.logoUrl
		});
		// open modal
		dialogElement.showModal();
		try {
			// wait for connect event
			const {
				password,
				isAnonymous = false,
				uid,
				authMethod
			} = (await addAndWaitUIEventsResult(dialogElement)) || {};
			// store default auth method
			if (authMethod && authMethod !== SigninMethod.Wallet) {
				await storageService.setItem(KEYS.STORAGE_AUTH_METHOD_KEY, authMethod);
			}
			console.log(`[INFO] Closing dialog`, { password, isAnonymous, uid });
			// handle close event && anonymous user
			if (!uid || isAnonymous) {
				dialogElement.hideModal();
				// wait 225ms to let the dialog close wth animation
				await new Promise(resolve => setTimeout(resolve, 225));
				// remove dialog element
				dialogElement?.remove();
				return this.userInfo;
			}
			this._secret = password;
			// init wallet to set user info
			await this._initWallets({
				isAnonymous,
				uid
			});
		} catch (error: unknown) {
			const message =
				(error as Error)?.message || 'An error occured while connecting';
			await dialogElement.toggleSpinnerAsCross(message);
			throw error;
		}

		// check local storage to existing tag to trigger backup download of private key
		const requestBackup = localStorage.getItem(KEYS.STORAGE_BACKUP_KEY);
		if (this.userInfo && requestBackup && this._secret) {
			await storageService.executeBackup(Boolean(requestBackup), this._secret);
		}

		// ask to download if user skip download prompt from more than 15 minutes
		const skip = await storageService.getItem(KEYS.STORAGE_SKIP_BACKUP_KEY);
		const skipTime = skip ? parseInt(skip) : Date.now();
		// check if is more than 15 minutes
		const isOut = Date.now() - skipTime > MAX_SKIP_BACKUP_TIME;
		if (this.userInfo && isOut) {
			const { withEncryption, skip: reSkip } =
				await dialogElement.promptBackup();
			if (!reSkip) {
				await storageService.executeBackup(
					Boolean(withEncryption),
					this._secret
				);
			}
		}

		// close modal with animation and resolve the promise with user info
		dialogElement.hideModal();
		// wait 225ms to let the dialog close wth animation
		await new Promise(resolve => setTimeout(resolve, 225));
		// remove dialog element
		dialogElement?.remove();
		return this.userInfo;
	}

	public async signout() {
		await storageService.removeItem(KEYS.STORAGE_SECRET_KEY);
		await authProvider.signOut();
	}

	/**
	 * Method that manage the entire wallet management process base on user state.
	 * Wallet values are set with the corresponding method base on the user authentication provider.
	 * If no user is connected, all wallet values are set to null with a default provider and the method will return null.
	 *
	 * @param cb Call back function that return the formated user information to the caller.
	 * @returns
	 */
	public onConnectStateChanged(cb: (user: { address: string } | null) => void) {
		return authProvider.getOnAuthStateChanged(async user => {
			this._uid = user?.uid;

			if (!this.userInfo && user) {
				try {
					await this._initWallets(user);
				} catch (error: unknown) {
					await authProvider.signOut();
					await storageService.clear();
					const message =
						(error as Error)?.message || 'An error occured while connecting';
					console.error('[ERROR] onConnectStateChanged:', message);
					//throw error;
				}
			}
			// reset state if no user connected
			if (!user) {
				this._secret = undefined;
				this._wallet = undefined;
			}
			console.log('[INFO] onConnectStateChanged:', {
				user,
				userInfo: this.userInfo,
				provider: this.provider,
				_secret: this._secret
			});
			cb(user ? this.userInfo : null);
		});
	}

	public async switchNetwork(chainId: number) {
		if (!this._uid) {
			throw new Error('User not connected');
		}
		// prevent switching to the same chain
		if (this._wallet?.chainId === chainId) {
			return this.userInfo;
		}
		const chain = CHAIN_AVAILABLES.find(chain => chain.id === chainId);
		// check if an existing Wallet is available
		const wallet = this._wallets.find(
			wallet =>
				wallet.chainId === chainId ||
				CHAIN_AVAILABLES.find(chain => chain.id === wallet.chainId)?.type ===
					chain?.type
		);
		console.log(`[INFO] switchNetwork:`, { wallet, wallets: this._wallets });
		if (wallet) {
			// check if wallet have same chainId or switch
			if (wallet.chainId !== chainId) {
				await wallet.switchNetwork(chainId);
			}
			await this._setWallet(wallet);
			return this.userInfo;
		}
		// If not existing wallet, init new wallet with chainId
		await this._initWallet(
			{
				isAnonymous: Boolean(this._wallet?.publicKey),
				uid: this._uid
			},
			chainId
		);
		return this.userInfo;
	}

	/**
	 * Method that initialize the main EVM wallet and all other type, base on the user state.
	 */
	private async _initWallets(user: { uid: string; isAnonymous: boolean }) {
		if (!user) {
			throw new Error(
				'User not connected. Please sign in to connect with wallet'
			);
		}
		// and no chainId is provided that mean chainId is the same as the current wallet
		if (this.userInfo?.address) {
			return this.userInfo;
		}
		const defaultNetworkId = this._ops?.chainId || CHAIN_DEFAULT.id;
		// handle external wallet
		if (user.isAnonymous) {
			const wallet = await initWallet(user, this._secret, defaultNetworkId);
			this._wallets = [wallet];
			await this._setWallet(wallet);
			return this._wallets;
		}
		// handle local wallet
		try {
			const wallets = await Promise.all([
				initWallet(user, this._secret, defaultNetworkId),
				initWallet(user, this._secret, NETWORK.bitcoin),
				initWallet(user, this._secret, NETWORK.solana)
			]);
			this._wallets = wallets;
			await this._setWallet(
				wallets.find(wallet => wallet.chainId === defaultNetworkId)
			);
			console.log(`[INFO] _initWallets:`, wallets);
			return this._wallets;
		} catch (error: unknown) {
			console.error(`[ERROR] _initWallets:`, error);
			throw error;
		}
	}

	/**
	 * Method that add a new wallet to the wallet list and set the wallet as the main wallet.
	 */
	private async _initWallet(
		user: {
			uid: string;
			isAnonymous: boolean;
		},
		chainId: number
	) {
		console.log('[INFO] initWallet:', {
			user,
			userInfo: this.userInfo,
			_secret: this._secret
		});
		if (!user) {
			throw new Error(
				'User not connected. Please sign in to connect with wallet'
			);
		}
		// generate wallet base on user state and chainId
		const wallet = await initWallet(user, this._secret, chainId);
		if (!wallet) {
			throw new Error('Failed to generate wallet');
		}
		// set wallet values with the generated wallet
		this._wallets.push(wallet);
		await this._setWallet(wallet);
		return this.userInfo;
	}

	private async _setWallet(wallet?: Web3Wallet) {
		this._wallet = wallet;
	}
}
