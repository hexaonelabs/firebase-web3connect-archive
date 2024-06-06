import { FirebaseWeb3ConnectDialogElement } from '../../interfaces/dialog-element.interface';
import { DialogUIOptions } from '../../interfaces/sdk.interface';
import { HexaSigninDialogElement } from './dialogElement';
import { KEYS, SigninMethod } from '../../constant';
import {
	authByImportPrivateKey,
	authWithGoogle,
	authWithEmailPwd,
	authByImportSeed
} from '../../services/auth.servcie';
import { promptImportPrivatekeyElement } from '../prompt-import-privatekey-element/prompt-import-privatekey-element';
import { storageService } from '../../services/storage.service';
import { promptImportSeedElement } from '../prompt-import-seed-element/prompt-import-seed-element';
import { Logger } from '../../utils';

const setupSigninDialogElement = async (
	ref: HTMLElement = document.body,
	ops: DialogUIOptions
) => {
	// check if element already defined
	if (!customElements.get('firebase-web3connect-dialog')) {
		customElements.define(
			'firebase-web3connect-dialog',
			HexaSigninDialogElement
		);
	}
	// create dialog element with options as props
	const dialogElement = document.createElement(
		'firebase-web3connect-dialog'
	) as FirebaseWeb3ConnectDialogElement;
	// add `ops` as property
	dialogElement.ops = ops;
	ref.appendChild(dialogElement);
	// remove "Create new Wallet" button if no auth method is enabled
	const authMethod = await storageService.getItem(KEYS.STORAGE_AUTH_METHOD_KEY);
	if (!authMethod) {
		dialogElement.shadowRoot?.querySelector('#create-new-wallet')?.remove();
	}
	return dialogElement;
};

const addAndWaitUIEventsResult = (
	dialogElement: FirebaseWeb3ConnectDialogElement
): Promise<
	| {
			uid?: string;
			isAnonymous?: boolean;
			password?: string;
			authMethod: SigninMethod;
	  }
	| undefined
> => {
	return new Promise(
		(
			resolve: (
				value:
					| {
							uid?: string;
							password?: string;
							isAnonymous?: boolean;
							authMethod: SigninMethod;
					  }
					| undefined
			) => void,
			reject: (err: Error) => void
		) => {
			// listen to connect event
			dialogElement.addEventListener('connect', async e => {
				const detail = (e as CustomEvent<string>).detail;
				Logger.log(`[INFO] connect event: `, detail);
				// exclude cancel event {
				if (detail === 'cancel') {
					dialogElement.hideModal();
					await new Promise(resolve => setTimeout(resolve, 225));
					dialogElement.remove();
					resolve(undefined);
					return;
				}
				// handle type of connection request
				if (detail === 'connect-google') {
					try {
						const password = await dialogElement.promptPassword();
						// prompt to download private key if not already stored
						const privateKey = await storageService.getItem(
							KEYS.STORAGE_PRIVATEKEY_KEY
						);
						const { withEncryption, skip } = !privateKey
							? await dialogElement.promptBackup()
							: {
									withEncryption: undefined,
									skip: undefined
								};
						// use service to request connection with google
						const { uid } = await authWithGoogle({
							password,
							skip,
							withEncryption
						});
						// await dialogElement.toggleSpinnerAsCheck();
						resolve({
							uid,
							password,
							authMethod: detail as SigninMethod
						});
					} catch (error: unknown) {
						const message =
							(error as Error)?.message ||
							'An error occured. Please try again.';
						reject(new Error(`${message}`));
						return;
					}
				}
				if (detail === 'connect-email') {
					try {
						const { password, email } =
							await dialogElement.promptEmailPassword();
						// prompt to download private key if not already stored
						const privateKey = await storageService.getItem(
							KEYS.STORAGE_PRIVATEKEY_KEY
						);
						const { withEncryption, skip } = !privateKey
							? await dialogElement.promptBackup()
							: { withEncryption: false, skip: true };
						// use service to request connection with google
						const { uid } = await authWithEmailPwd({
							email,
							password,
							skip,
							withEncryption
						});
						// await dialogElement.toggleSpinnerAsCheck();
						resolve({
							uid,
							password,
							authMethod: detail as SigninMethod
						});
					} catch (error: unknown) {
						const message =
							(error as Error)?.message ||
							'An error occured. Please try again.';
						reject(new Error(`${message}`));
						return;
					}
				}
				// if (detail === 'connect-email-link') {
				//   try {
				//     const sub = this.onConnectStateChanged(async (user) => {
				//       if (user) {
				//         sub();
				//         await dialogElement.toggleSpinnerAsCheck();
				//         dialogElement.hideModal();
				//         resolve(this.userInfo);
				//       }
				//     });
				//     await this._authWithEmailLink();
				//   } catch (error: any) {
				//     dialogElement.hideModal();
				//     reject(
				//       new Error(
				//         `Error while connecting with ${detail}: ${error?.message}`
				//       )
				//     );
				//   }
				//   return;
				// }
				if (detail === 'connect-wallet') {
					try {
						const walletType = await dialogElement.promptWalletType();
						Logger.log(`[INFO] Wallet type: `, walletType);
						switch (walletType) {
							case 'browser-extension': {
								// const { uid } = await authWithExternalWallet();
								// await dialogElement.toggleSpinnerAsCheck();
								resolve({
									uid: undefined,
									isAnonymous: true,
									authMethod: detail as SigninMethod
								});
								break;
							}
							case 'import-seed': {
								// import seed
								const { seed, secret } = await promptImportSeedElement(
									dialogElement?.shadowRoot?.querySelector(
										'#spinner'
									) as HTMLElement
								);
								Logger.log(`[INFO] Import seed: `, {
									seed,
									secret
								});
								if (!seed) {
									throw new Error('Seed is required to connect');
								}
								const { uid } = await authByImportSeed({
									password: secret,
									seed
								});
								resolve({
									uid,
									password: secret,
									authMethod: detail as SigninMethod
								});
								break;
							}
							case 'import-privatekey': {
								// import private key and request password
								const { privateKey, secret } =
									await promptImportPrivatekeyElement(
										dialogElement?.shadowRoot?.querySelector(
											'#spinner'
										) as HTMLElement
									);
								Logger.log(`[INFO] Import private key: `, {
									privateKey,
									secret
								});
								if (!privateKey) {
									throw new Error('Private key is required to connect');
								}
								const { uid } = await authByImportPrivateKey({
									password: secret,
									privateKey
								});
								resolve({
									uid,
									password: secret,
									authMethod: detail as SigninMethod
								});
								break;
							}
							default:
								throw new Error('Invalid wallet type');
						}
					} catch (error: unknown) {
						const message =
							(error as Error)?.message ||
							'An error occured. Please try again.';
						reject(new Error(`Error while connecting: ${message}`));
					}
				}
			});
			dialogElement.addEventListener('reset', async () => {
				await storageService.clear();
				dialogElement.reset();
			});
		}
	);
};

export {
	HexaSigninDialogElement,
	setupSigninDialogElement,
	addAndWaitUIEventsResult
};
