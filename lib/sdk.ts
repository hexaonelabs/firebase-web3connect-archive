import { providers, getDefaultProvider } from "ethers";
import {
  decrypt,
  encrypt,
  generateEvmAddress,
  generatePrivateKeyFromPassword,
  signMessage,
  verifySignature,
} from "./evm";
import { signinWithGoogle, auth, sendLinkToEmail, signInWithLink, initialize as initFirebase } from "./firebase";
import "./dialogElement";
import { HexaSigninDialogElement } from "./dialogElement";
import { FirebaseOptions } from "firebase/app";

export class HexaConnect {
  private readonly _apiKey!: FirebaseOptions;
  private _ops?: { chainId?: number; rpcUrl?: string };
  private _p!: string | null;
  private _provider!:
    | providers.JsonRpcProvider
    | providers.BaseProvider;
  private _privateKey!: string | null;
  private _publicKey!: string | null;
  private _did!: string | null;
  private _address!: string | null;

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
    ops?: { chainId?: number; rpcUrl?: string}
  ) {
    this._apiKey = this._parseApiKey(apiKey.slice(2));
    this._ops = ops;
    initFirebase(this._apiKey);
    // check if window is available and HTMLDialogElement is supported
    if (!window || !window.HTMLDialogElement) {
      throw new Error("[ERROR] HexaConnect: HTMLDialogElement not supported");
    } 
    console.log(`[INFO] HexaConnect initialized and ready!`, {
      apiKey: this._apiKey,
      userFullInfo: {
        ...this.userInfo,
      }
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
    return signInWithLink();
  }

  public async connectWithUI(isLightMode: boolean = false) {
    const result = await new Promise(
      async (
        resolve: (value: HexaConnect["userInfo"]) => void,
        reject: (err: Error) => void
      ) => {
        // check if dialog exist
        let dialogElement: HexaSigninDialogElement = document.querySelector(
          "#hexa-wallet-connectWithUI-dialog"
        ) as HexaSigninDialogElement;
        // only add element with event if element not already exist
        if (!dialogElement) {
          document.body.insertAdjacentHTML(
            "beforeend",
            isLightMode
              ? `<hexa-signin-dialog id="hexa-wallet-connectWithUI-dialog" light-mode="${isLightMode}" />`
              : `<hexa-signin-dialog id="hexa-wallet-connectWithUI-dialog" />`
          );
          dialogElement = document.querySelector(
            "hexa-signin-dialog"
          ) as HexaSigninDialogElement;

          // listen to connect event
          dialogElement.addEventListener("connect", async (e) => {
            const detail = (e as CustomEvent<string>).detail;
            console.log(`[INFO] connect event: `, detail);
            // handle type of connection request
            if (detail === "connect-google") {
              try {
                await this._authWithGoogle();
                await dialogElement.toggleIconAsCheck();
                dialogElement.hideModal();
                resolve(this.userInfo);
              } catch (error: any) {
                dialogElement.hideModal();
                reject(
                  new Error(
                    `Error while connecting with google: ${error?.message}`
                  )
                );
              }
            }
            if (detail === 'connect-email') {
              try {
                const sub = this.onConnectStateChanged((user) => {
                  console.log("connect-email onConnectStateChanged: ", user)
                  if (user) {
                    sub();
                    dialogElement.toggleIconAsCheck();
                    dialogElement.hideModal();
                    resolve(this.userInfo);
                  }
                });
                await this._authWithEmailLink();
              } catch (error: any) {
                dialogElement.hideModal();
                reject(
                  new Error(
                    `Error while connecting with google: ${error?.message}`
                  )
                );
              }
            }
          });
        }
        // sleep for 125ms before opening dialog
        await new Promise((resolve) => {
          const t = setTimeout(() => {
            clearTimeout(t);
            resolve(true);
          }, 125);
        });
        // open modal
        dialogElement.showModal();
      }
    ).catch((err) => {
      return new Error(`Error while connecting with UI: ${err.message}`);
    });
    // remove dialog from dom
    const dialogElement = document.querySelector(
      "#hexa-wallet-connectWithUI-dialog"
    );
    // console.log("dialogElement: ", dialogElement);
    dialogElement?.remove();
    if (result instanceof Error) {
      throw result;
    }
    return result;
  }

  public async signout() {
    await auth.signOut();
    this._address = null;
    this._did = "";
    this._privateKey = "";
    this._provider = getDefaultProvider();
  }

  public async signMessage(value: string) {
    const result = await signMessage(
      value,
      decrypt(`${this._privateKey}`, `${auth.currentUser?.uid}`, `${this._p}`)
    );
    return result;
  }

  public verifySignature(value: string, signature: string) {
    // Verify the signature with address
    const isValid = verifySignature(value, signature, `${this._address}`);
    return isValid;
  }

  public onConnectStateChanged(
    cb: (user: { address: string; did: string } | null) => void
  ) {
    return auth.onAuthStateChanged(async (user) => {
      if (user) {
        await this._setValuesFromCredential();
      } else {
        this._address = null;
        this._did = null;
        this._privateKey = null;
        this._provider = getDefaultProvider();
      }
      cb(user ? this.userInfo : null);
      console.log('[INFO] onConnectStateChanged:', this.userInfo);
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
      await signinWithGoogle();
    } catch (error) {
      throw error;
    }
    await this._setValuesFromCredential();
  }

  private async _authWithEmailLink() {
    // ask for email address
    const email = window.prompt("Please provide your email for connection");
    if (!email) {
      throw new Error("Email is required to connect");
    }
    try {
      await sendLinkToEmail(email);
    } catch (error) {
      throw error;
    }
  }

  private async _setValuesFromCredential() {
    const credential = auth.currentUser;
    if (!credential) {
      return;
    }
    const { uid, providerId } = {
      uid: credential.uid,
      providerId: credential.providerData[0].uid,
    };
    const salt = providerId; // Utilise un sel unique pour chaque clé privée
    const derivativePrivateKey = generatePrivateKeyFromPassword(uid, salt);
    const { address, did, provider, publicKey, privateKey } =
      generateEvmAddress(derivativePrivateKey, this._ops?.chainId);
    const { encryptedData, salt: p } = encrypt(privateKey, uid);
    this._did = did;
    this._address = address;
    this._privateKey = encryptedData;
    this._p = p;
    this._publicKey = publicKey;
    this._provider = provider;
  }
}
