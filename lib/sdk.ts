import { providers, getDefaultProvider } from "ethers";
import evmWallet from "./networks/evm";
import authProvider from "./providers/auth/firebase";
import storageProvider from "./providers/storage/local";
import "./ui/dialog-element/dialogElement";
import { HexaSigninDialogElement } from "./ui/dialog-element/dialogElement";
import { FirebaseOptions } from "firebase/app";
import { DEFAULT_SIGNIN_METHODS, SigninMethod } from "./constant";
import Crypto from "./providers/crypto/crypto";
import { IStorageProvider } from "./interfaces/storage-provider.interface";
import { passwordValidationOrSignature } from "./providers/crypto/password";

export class HexaConnect {
  private readonly _apiKey!: FirebaseOptions;
  private _ops?: { 
    chainId?: number; 
    rpcUrl?: string; 
    enabledSigninMethods?:  SigninMethod[]; 
    storageService?: IStorageProvider;
  };
  private _secret!: string | null;
  private _provider!:
    | providers.JsonRpcProvider
    | providers.BaseProvider;
  private _privateKey!: string | null;
  private _publicKey!: string | null;
  private _did!: string | null;
  private _address!: string | null;
  private _dialogElement!: HexaSigninDialogElement | null;

  get provider() {
    return this._provider;
  }

  get userInfo() {
    return this._address && this._did
      ? { 
          address: this._address, 
          did: this._did,
          publicKey: this._publicKey,
        }
      : null;
  }

  constructor(
    apiKey: string, 
    ops?: { 
      chainId?: number; 
      rpcUrl?: string;
      enabledSigninMethods?:  SigninMethod[];
      storageService?: IStorageProvider;
    }
  ) {
    this._apiKey = this._parseApiKey(apiKey.slice(2));
    this._ops = {
      enabledSigninMethods: DEFAULT_SIGNIN_METHODS,
      ...ops
    };
    authProvider.initialize(this._apiKey);
    // set storage.uid
    (this._ops?.storageService || storageProvider).initialize();
    // check if window is available and HTMLDialogElement is supported
    if (!window || !window.HTMLDialogElement) {
      throw new Error("[ERROR] HexaConnect: HTMLDialogElement not supported");
    } 
    console.log(`[INFO] HexaConnect initialized and ready!`, {
      config: this._ops,
      mode: import.meta.env.MODE,
    });
  }

  static isConnectWithLink() {
    // check special paramettre in url `finishSignUp`
    const isSignInWithLink = window.location.search.includes("finishSignUp=true");
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
    const result = await new Promise(
      async (
        resolve: (value: HexaConnect["userInfo"]) => void,
        reject: (err: Error) => void
      ) => {
        try {
          // build UI
          const dialogElement = await this._buildUI(isLightMode);
          // open modal
          dialogElement.showModal();
          // wait for connect event
          const result = await this._addAndWaitUIEventsResult();
          // resolve result
          resolve(result);
        } catch (error: any) {
          reject(error);
        }
      }
    ).catch((err) => {
      return new Error(`Error while connecting with UI: ${err.message}`);
    });
    // wait 225ms to let the dialog close wth animation
    await new Promise((resolve) => setTimeout(resolve, 225));
    // remove dialog element
    this._dialogElement?.remove();
    if (result instanceof Error) {
      throw result;
    }
    return result;
  }

  public async signout() {
    await storageProvider.removeItem('hexa-secret');
    await authProvider.signOut();
  }

  public async signMessage(value: string) {
    throw new Error("Method not implemented yet!");
    
    // const currentUser = await authProvider.getCurrentUserAuth();
    // const result = await signMessage(
    //   value,
    //   decrypt(`${this._privateKey}`, `${currentUser?.uid}`, `${this._p}`)
    // );
    // return result;
  }

  public verifySignature(value: string, signature: string) {
    throw new Error("Method not implemented yet!");
    // // Verify the signature with address
    // const isValid = verifySignature(value, signature, `${this._address}`);
    // return isValid;
  }

  /**
   * Method that manage the entire wallet management process base on user state.
   * Wallet values are set with the corresponding method base on the user authentication provider.
   * If no user is connected, all wallet values are set to null with a default provider and the method will return null.
   * 
   * @param cb Call back function that return the formated user information to the caller.
   * @returns 
   */
  public onConnectStateChanged(
    cb: (user: { address: string; did: string } | null) => void
  ) {
    return authProvider.getOnAuthStateChanged(async (user) => {
      if (user) {
        try {
          // if user is anonymous, 
          // this mean the user want to connect with an external wallet
          // so we call methode to connect with external wallet
          // then we set the wallet values
          // otherwise we set the wallet values from the user credential
          if (user.isAnonymous) {
            const { did, address, provider }  = await evmWallet.connectWithExternalWallet();
            await this._setValues({ did, address, provider });
          } else {
            if (!this._secret) {
              // check if secret is stored in local storage
              const encryptedSecret = await storageProvider.getItem('hexa-secret');
              if (encryptedSecret) {
                this._secret = await Crypto.decrypt(user.uid, encryptedSecret);
              } else {
                await this.signout();
                throw new Error("Secret is required to decrypt the private key");
              }
            }
            // check if encrypted private key is available from storage
            const storedEncryptedPrivateKey = await storageProvider.getItem('hexa-private-key');
            // generate wallet from encrypted private key or generate new from random mnemonic
            const { 
              address, 
              did, 
              provider, 
              publicKey, 
              privateKey 
            } = storedEncryptedPrivateKey
            // decrypt private key before generating wallet
            ? await Crypto.decrypt(this._secret, storedEncryptedPrivateKey)
                .then(storedPrivateKey => evmWallet.generateWalletFromPrivateKey(
                  storedPrivateKey, 
                  this._ops?.chainId
                )
              )
            // generate new wallet from random mnemonic
            : await evmWallet.generateWalletFromMnemonic()
              .then(async (wallet) => {
                if (!this._secret) {
                  await this.signout();
                  throw new Error("Secret is required to encrypt the private key.");
                }
                // encrypt private key before storing it
                const encryptedPrivateKey = await Crypto.encrypt(this._secret, wallet.privateKey);
                await storageProvider.setItem('hexa-private-key', encryptedPrivateKey);
                return wallet;
              });
            await this._setValues({ did, address, provider, publicKey, privateKey })
          }
        } catch (error) {
          await this.signout();
          throw error;          
        }
      } else {
        this._secret = null;
        this._address = null;
        this._did = null;
        this._privateKey = null;
        this._publicKey = null;
        this._provider = getDefaultProvider();
      }
      cb(user ? this.userInfo : null);
      console.log('[INFO] onConnectStateChanged:', this.userInfo, user);
    });
  }

  private async _buildUI(isLightMode: boolean) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<hexa-signin-dialog 
        id="hexa-wallet-connectWithUI-dialog" 
        signin-methods="${this._ops?.enabledSigninMethods?.join(",")}"
        theme="${isLightMode ? 'light' : 'dark'}" />`
    );
    this._dialogElement = document.getElementById(
      "hexa-wallet-connectWithUI-dialog"
    ) as HexaSigninDialogElement;
    if (!this._dialogElement) {
      throw new Error("Error while building UI: Dialog element not found");
    }
    return this._dialogElement;
  }

  private async _addAndWaitUIEventsResult() {
    return new Promise(
      async (
        resolve: (value: HexaConnect["userInfo"]) => void,
        reject: (err: Error) => void
    ) => {
      if (!this._dialogElement) {
        throw new Error("Dialog element not found");
      }
      // listen to connect event
      this._dialogElement.addEventListener("connect", async (e) => {
        if (!this._dialogElement) {
          throw new Error("Dialog element not found");
        }
        const detail = (e as CustomEvent<string>).detail;
        console.log(`[INFO] connect event: `, detail);
        // handle type of connection request
        if (detail === "connect-google") {
          try {
            const value = await this._dialogElement.promptPassword();
            // If user already have a signature stored into Database,
            // we validate the password with validation signature method.
            // Otherwise we sign message with the password and store it in the Database
            await passwordValidationOrSignature(value).execute();
            // Now we can connect with Google
            // and store the secret into inmemory class instance for further use
            this._secret = value;
            const { uid } = await this._authWithGoogle();
            await this._dialogElement.toggleIconAsCheck(detail);
            const encryptedSecret = await Crypto.encrypt(uid, this._secret);
            await storageProvider.setItem('hexa-secret', encryptedSecret);
            this._dialogElement.hideModal();
            resolve(this.userInfo);
          } catch (error: any) {
            this._dialogElement.hideModal();
            reject(
              new Error(
                `Error while connecting with ${detail}: ${error?.message}`
              )
            );
          }
        }
        if (detail === 'connect-email') {
          try {
            const sub = this.onConnectStateChanged((user) => {
              if (!this._dialogElement) {
                throw new Error("Dialog element not found");
              }
              if (user) {
                sub();
                this._dialogElement.toggleIconAsCheck(detail);
                this._dialogElement.hideModal();
                resolve(this.userInfo);
              }
            });
            await this._authWithEmailLink();
          } catch (error: any) {
            this._dialogElement.hideModal();
            reject(
              new Error(
                `Error while connecting with ${detail}: ${error?.message}`
              )
            );
          }
        }
        if (detail === "connect-wallet") {
          try {
            await this._authWithExternalWallet();
            await this._dialogElement.toggleIconAsCheck(detail);
            this._dialogElement.hideModal();
            resolve(this.userInfo);
          } catch (error: any) {
            this._dialogElement.hideModal();
            reject(
              new Error(
                `Error while connecting with ${detail}: ${error?.message}`
              )
            );
          }             
        }
        // default case is cancel
        this._dialogElement.hideModal();
        resolve(this.userInfo);
      });
    });
  }
  
  /*
  private _authWithPassword(value: string) {
    const salt = "uniquesalt"; // Utilise un sel unique pour chaque clé privée
    const privateKey = generatePrivateKeyFromPassword(value, salt);
    const { address, did, provider, publicKey } =
      generateEvmAddress(privateKey);
    const { encryptedData, salt: p } = encrypt(privateKey, salt);
    this._p = p;
    this._did = did;
    this._address = address;
    this._privateKey = encryptedData;
    this._publicKey = publicKey;
    this._provider = provider;
  }
  */

  private _parseApiKey(hex: string) {
    // converte hex string to utf-8 string
    const json = Buffer.from(hex, "hex").toString("utf-8");
    try {
      const apiKey  = JSON.parse(json);
      return apiKey as FirebaseOptions;
    } catch (error) {
      throw new Error("Invalid API key");
    }
  }

  private async _authWithGoogle() {
    try {
      return await authProvider.signinWithGoogle();
    } catch (error) {
      throw error;
    }
  }

  private async _authWithEmailLink() {
    // ask for email address
    const email = window.prompt("Please provide your email for connection");
    if (!email) {
      throw new Error("Email is required to connect");
    }
    try {
      await authProvider.sendLinkToEmail(email);
    } catch (error) {
      throw error;
    }
  }

  private async _authWithExternalWallet() {    
    try {
      await authProvider.signInAsAnonymous();
    } catch (error) {
      throw error;
    }
  }

  private async _setValues(values: {
    did: string;
    address: string;
    provider: providers.JsonRpcProvider;
    privateKey?: string;
    publicKey?: string;
  }) {
    const { 
      did, 
      address, 
      provider, 
      privateKey = null, 
      publicKey = null
    }  = values;
    this._did = did;
    this._address = address;
    this._provider = provider;
    this._privateKey = privateKey;
    this._publicKey = publicKey;
  }
}
