import html from "./dialogElement.html?raw";
import css from "./dialogElement.css?raw";
import { DEFAULT_SIGNIN_METHODS, SigninMethod } from "../../constant";
import { promptPasswordElement } from "../prompt-password-element/prompt-password-element";
import { promptToDownloadElement } from "../prompt-download-element/prompt-download-element";
import { SpinnerElement } from "../spinner-element/spinner-element";
import { promptWalletTypeElement } from "../prompt-wallet-type-element/prompt-wallet-type-element";
import { promptImportPrivatekeyElement } from "../prompt-import-privatekey-element/prompt-import-privatekey-element";
import storageProvider from "../../providers/storage/local";
import { authByImportPrivateKey, authWithExternalWallet, authWithGoogle } from "../../services/auth.servcie";

// export web component with shadowdom
class HexaSigninDialogElement extends HTMLElement {
  constructor() {
    super();
    const integrator = this.getAttribute("integrator")
      ? "Sign in to" + this.getAttribute("integrator")
      : "Sign in using HexaConnect";
    // get enabled signin methods. If not provided, all methods are enabled by default
    const enabledMethods = this.getAttribute("signin-methods")
      ? this.getAttribute("signin-methods")
          ?.split(",")
          ?.filter(
            (method): method is typeof DEFAULT_SIGNIN_METHODS[number] =>
              method !== undefined
          ) || DEFAULT_SIGNIN_METHODS
      : DEFAULT_SIGNIN_METHODS;
    // build shadow dom
    const shadow = this.attachShadow({ mode: "open" });
    if (!shadow) {
      throw new Error("ShadowDOM not supported");
    }
    // create template element
    const template = document.createElement("template");
    template.innerHTML = `
        <style>${css}</style>
        ${html}
    `;
    // add spinner element to template content
    (template.content.querySelector("#spinner") as HTMLElement).innerHTML = SpinnerElement();

    // disable buttons that are not enabled
    const buttons = template.content.querySelectorAll(".buttonsList button") as NodeListOf<HTMLButtonElement>;
    buttons.forEach((button) => {
      if (!enabledMethods.includes(button.id as typeof enabledMethods[number])) {
        button.remove();
      }
    });
    // remove `or` tage if google is not enabled
    if (!enabledMethods.includes(SigninMethod.Google) || enabledMethods.includes(SigninMethod.Google) && enabledMethods.length === 1) {
      template.content.querySelector(".or")?.remove();
    }
    // finaly add template to shadow dom
    shadow.appendChild(template.content.cloneNode(true));
    // replace tags from html with variables
    const variables = [{ tag: "integrator", value: integrator }];
    variables.forEach((variable) => {
      shadow.innerHTML = shadow.innerHTML.replace(
        new RegExp(`{{${variable.tag}}}`, "g"),
        variable.value
      );
    });
  }

  public showModal(): void {
    this.shadowRoot?.querySelector("dialog")?.showModal();
  }

  public hideModal(): void {
    this.shadowRoot?.querySelector("dialog")?.close();
  }

  // manage events from shadow dom
  public connectedCallback() {
    this.shadowRoot
      ?.querySelector("dialog")
      ?.addEventListener("click", async (event) => {
        // filter event name `connect
        const button = (event.target as HTMLElement).closest("button");
        if (!button) return;
        // handle cancel
        if (button.id === "cancel") {
          this.dispatchEvent(
            new CustomEvent("connect", {
              detail: button.id,
            })
          );
          // stop further execution of code
          // as we don't want to show loading on cancel
          // and we don't want to show connected on cancel.
          // This will trigger the event and close the dialog
          return;
        }
        // only button from connection type request
        if (!button.id.includes("connect")) {
          return;
        }
        // hide all btns and display loader with animation
        const btnsElement = this.shadowRoot?.querySelector("dialog .buttonsList") as HTMLElement;
        const spinnerElement = this.shadowRoot?.querySelector("dialog #spinner") as HTMLElement;
        btnsElement.style.display = "none";
        spinnerElement.style.display = "block";

        // emiting custome event to SDK
        switch (button.id) {
          case "connect-google":
            this.dispatchEvent(
              new CustomEvent("connect", {
                detail: button.id,
              })
            );
            break;
          case "connect-email":
            this.dispatchEvent(
              new CustomEvent("connect", {
                detail: button.id,
              })
            );
            break;
          case "connect-wallet":
            this.dispatchEvent(
              new CustomEvent("connect", {
                detail: button.id,
              })
            );
            break;
        }
      });
  }

  public async toggleSpinnerAsCheck(): Promise<boolean> {
    await new Promise((resolve) => {
      const t = setTimeout(() => {
        clearTimeout(t);
        resolve(true);
      }, 1500);
    });
    const element = this.shadowRoot?.querySelector("dialog #spinner") as HTMLElement;
    element.innerHTML = `
    <style>
    #check-group {
      animation: 0.32s ease-in-out 1.03s check-group;
      transform-origin: center;
    }
    
    #check-group #check {
        animation: 0.34s cubic-bezier(0.65, 0, 1, 1) 0.8s forwards check;
        stroke-dasharray: 0, 75px;
        stroke-linecap: round;
        stroke-linejoin: round;
    }
    
    #check-group #outline {
        animation: 0.38s ease-in outline;
        transform: rotate(0deg);
        transform-origin: center;
    }
    
    #check-group #white-circle {
        animation: 0.35s ease-in 0.35s forwards circle;
        transform: none;
        transform-origin: center;
    }
    
    @keyframes outline {
      from {
        stroke-dasharray: 0, 345.576px;
      }
      to {
        stroke-dasharray: 345.576px, 345.576px;
      }
    }
    @keyframes circle {
      from {
        transform: scale(1);
      }
      to {
        transform: scale(0);
      }
    }
    @keyframes check {
      from {
        stroke-dasharray: 0, 75px;
      }
      to {
        stroke-dasharray: 75px, 75px;
      }
    }
    @keyframes check-group {
      from {
        transform: scale(1);
      }
      50% {
        transform: scale(1.09);
      }
      to {
        transform: scale(1);
      }
    }
    </style>
  
    <svg
      width="115px"
      height="115px"
      viewBox="0 0 133 133"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
    >
      <g
          id="check-group"
          stroke="none"
          stroke-width="4"
          fill="none"
          fill-rule="evenodd"
      >
              <circle
              id="filled-circle"
              fill="#07b481"
              cx="66.5"
              cy="66.5"
              r="54.5"
          />
          <circle
              id="white-circle"
              fill="var(--dialog-background-color)"
              cx="66.5"
              cy="66.5"
              r="55.5"
          />
          <circle
              id="outline"
              stroke="#07b481"
              stroke-width="4"
              cx="66.5"
              cy="66.5"
              r="54.5"
          />
          <polyline
              id="check"
              stroke="var(--dialog-background-color)"
              stroke-width="6.5"
              points="41 70 56 85 92 49"
          />
      </g>
    </svg>
    `;
    return new Promise((resolve) => {
      const t = setTimeout(() => {
        clearTimeout(t);
        resolve(true);
      }, 1800);
    });
  }

  public async toggleSpinnerAsCross(
    message: string = 'An error occured. Please try again.'
  ): Promise<boolean> {
    await new Promise((resolve) => {
      const t = setTimeout(() => {
        clearTimeout(t);
        resolve(true);
      }, 1500);
    });
    const element = this.shadowRoot?.querySelector("dialog #spinner") as HTMLElement;
    element.innerHTML = `
    <style>
    @keyframes stroke {
      100% {
        stroke-dashoffset: 0;
      }
    }
    .cross__svg {
        border-radius: 50%;
        display: block;
        height: 111px;
        margin: 1rem auto;
        stroke-width: 4;
        width: 111px;
    }

    .cross__circle {
        animation: 0.6s ease 0s normal forwards 1 running stroke;
        fill: none;
        margin: 0 auto;
        stroke: #e55454;
        stroke-dasharray: 166;
        stroke-dashoffset: 166;
        stroke-width: 3;
    }

    .cross__path {
        stroke: #e55454;
        stroke-dasharray: 48;
        stroke-dashoffset: 48;
        transform-origin: 50% 50% 0;
    }
    .cross__path.cross__path--right {
      animation: 0.3s ease 0.8s normal forwards 1 running stroke;
    }
    .cross__path.cross__path--left {
      animation: 1s ease 0.8s normal forwards 1 running stroke;
    }
    p.cross__message {
      color: #e55454;
      font-size: 0.8rem;
      text-align: center;
    }


    </style>
  
    <svg class="cross__svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
      <circle class="cross__circle" cx="26" cy="26" r="25" fill="none"/>
      <path class="cross__path cross__path--right" fill="none" d="M16,16 l20,20" />
      <path class="cross__path cross__path--right" fill="none" d="M16,36 l20,-20" />
    </svg>
    <p class="cross__message">${message}</p>
    `;
    return new Promise((resolve) => {
      const t = setTimeout(() => {
        clearTimeout(t);
        resolve(true);
      }, 1800);
    });
  }

  public async promptPassword() {
    const value = await promptPasswordElement(
      this.shadowRoot?.querySelector("dialog #spinner") as HTMLElement
    );
    return value;
  }

  public async promptBackup() {
    const value = await promptToDownloadElement(
      this.shadowRoot?.querySelector("dialog #spinner") as HTMLElement
    );
    return value;
  }

  public async promptWalletType() {
    const value = await promptWalletTypeElement(
      this.shadowRoot?.querySelector("dialog #spinner") as HTMLElement
    );
    return value;
  }

  public async promptAuthMethods() {
    (this.shadowRoot?.querySelector("dialog #spinner") as HTMLElement).style.display = "none";
    (this.shadowRoot?.querySelector("dialog .buttonsList") as HTMLElement).style.display = "block";

  }
  
}


const setupSigninDialogElement = (
  ref: HTMLElement = document.body, 
  ops: {
    enabledSigninMethods: SigninMethod[] | undefined;
    isLightMode: boolean;
  }
  ) => {
    // check if element already defined
    if (!customElements.get("hexa-signin-dialog")) {
      customElements.define("hexa-signin-dialog", HexaSigninDialogElement);
    }
    // extract options
    const {
      isLightMode = true,
      enabledSigninMethods = DEFAULT_SIGNIN_METHODS,
    } = ops||{};
    // insert webcomponent element to DOM
    ref.insertAdjacentHTML(
      "beforeend",
      `<hexa-signin-dialog 
        id="hexa-wallet-connectWithUI-dialog" 
        signin-methods="${enabledSigninMethods?.join(",")}"
        theme="${isLightMode ? 'light' : 'dark'}" />`
    );
    // check if element is inserted properly
    const dialogElement = document.getElementById(
      "hexa-wallet-connectWithUI-dialog"
    ) as HexaSigninDialogElement;
    if (!dialogElement) {
      throw new Error("Error while building UI: Dialog element not found");
    }
    // return dialog element
    return dialogElement;
}

const addAndWaitUIEventsResult = (dialogElement: HexaSigninDialogElement): Promise<{
  uid: string;
  isAnonymous?: boolean;
  password?: string;
}|undefined> => {
  return new Promise(
    async (
      resolve: (value: {uid: string; password: string}|undefined) => void,
      reject: (err: Error) => void
  ) => {
    // listen to connect event
    dialogElement.addEventListener("connect", async (e) => {
      const detail = (e as CustomEvent<string>).detail;
      console.log(`[INFO] connect event: `, detail);
      // exclude cancel event {
      if (detail === "cancel") {
        dialogElement.hideModal();
        await new Promise((resolve) => setTimeout(resolve, 225));
        dialogElement.remove();
        resolve(undefined); 
        return;
      }
      // handle type of connection request
      if (detail === "connect-google") {
        try {
          const password = await dialogElement.promptPassword();
          // prompt to download private key if not already stored
          const privateKey = await storageProvider.getItem('hexa-private-key');
          const {withEncryption, skip} = !privateKey
            ? await dialogElement.promptBackup()
            : {withEncryption: false, skip: true};
          // use service to request connection with google
          const {uid } = await authWithGoogle({
            password,
            skip,
            withEncryption
          });
          resolve({uid, password});
        } catch (error: any) {
          await dialogElement.toggleSpinnerAsCross(error?.message);
          reject(
            new Error(
              `Error while connecting with ${detail}: ${error?.message}`
            )
          );
          return;
        }
      }
      // if (detail === 'connect-email') {
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
      if (detail === "connect-wallet") {
        try {
          const walletType = await dialogElement.promptWalletType();
          console.log(`[INFO] Wallet type: `, walletType);
          switch (walletType) {
            case "browser-extension":
              await authWithExternalWallet();
              await dialogElement.toggleSpinnerAsCheck();
              break;
            case "import-seed":
              // import seed
              throw new Error("Method not implemented yet!");
              break;
            case "import-privatekey":
              // import private key and request password
              const {privateKey, secret} = await promptImportPrivatekeyElement(
                dialogElement?.shadowRoot?.querySelector("#spinner") as HTMLElement
              );
              console.log(`[INFO] Import private key: `, {privateKey, secret});
              if (!privateKey) {
                throw new Error("Private key is required to connect");
              }
              const { uid } = await authByImportPrivateKey({
                password: secret,
                privateKey,
              });
              resolve({uid, password: secret});
              break;
            default:
              throw new Error("Invalid wallet type");
          }
        } catch (error: any) {
          await dialogElement.toggleSpinnerAsCross(error?.message);
          reject(
            new Error(
              `Error while connecting with ${detail}: ${error?.message}`
            )
          );
        }            
      }
    });
  });
}

export { HexaSigninDialogElement, setupSigninDialogElement, addAndWaitUIEventsResult };

