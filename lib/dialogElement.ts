// export web component with shadowdom
class HexaSigninDialogElement extends HTMLElement {
  constructor() {
    super();
    const isLightMode = Boolean(this.getAttribute("light-mode"));
    const integrator = this.getAttribute("integrator")
      ? 'Sign in to' + this.getAttribute("integrator")
      : 'Sign in using Hexa Connect';
    console.log("isLightMode", isLightMode)
    const shadow = this.attachShadow({ mode: "open" });
    if (!shadow) {
      throw new Error("ShadowDOM not supported");
    }
    let color!: string;
    if (isLightMode) {
      color = "#180d68";
    } else {
      color = "#ffffff";
    }

    const template = document.createElement("template");
    // set background color from prefers-color-scheme
    template.innerHTML = `
      <style>

        @keyframes slide-in-up {
          0% {
              transform: translateY(100%)
          }
        }
        @keyframes scale-down {
          to {
              transform: scale(.75)
          }
        }

        :host .app-icon {
          fill: ${color};
        }

        :host {
          --animation-scale-down: scale-down .125s var(--ease);
          --animation-slide-in-up: slide-in-up .125s var(--ease);
          --ease: cubic-bezier(.25, 0, .3, 1);
          --ease-elastic-in-out: cubic-bezier(.5, -.5, .1, 1.5);
          --ease-squish: var(--ease-elastic-in-out);

          font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
          line-height: 1.5;
          font-weight: 400;
          color-scheme: light dark;
        }
      
        :host dialog {
          z-index: 9999;
          overflow: hidden;
          transition: all .125s;
          box-shadow: 0 0 2rem 0 rgba(0, 0, 0, ${isLightMode ? "0.1" : "0.3"});
          display: block;
          inset: 0;
          background-color: ${isLightMode ? "#ffffff" : "#242424"};
          color: ${isLightMode ? "#242424" : "#ffffff"};
          position: fixed;
          border: ${isLightMode ? "solid 1px #ccc" : "solid 1px #3a3a3a"};
          border-radius: 32px;
          padding: 16px;
          text-align: center;
          width: 80vw;
          max-width: 400px;
          box-sizing: border-box;
          font-synthesis: none;
          text-rendering: optimizeLegibility;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          animation: var(--animation-scale-down) forwards;
          animation-timing-function: var(--ease-squish);
        }

        :host dialog:not([open]) {
          display: none;
          pointer-events: none;
          opacity: 0;
        }
        :host dialog[open] {
          animation: slide-in-up .225s var(--ease) forwards;
        }

        :host dialog::backdrop {
          background-color: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(1px);
        }
        :host dialog svg#logo {
          margin: 2em auto 3rem;
          display: block;
          transform: scale(1.5);
        }

        a {
          color: #646cff;
          text-decoration: inherit;
        }

        :host a:hover {
          color: ${isLightMode ? "#747bff" : "#535bf2"};
        }

        :host dialog p {
          font-weight: 400;
          margin: 12px 0rem 0rem;
        }  
        :host dialog p.title {
          font-size: 0.6rem;
          margin: 1rem;
        }
        :host dialog p.policy {
          font-size: 0.6rem;
          margin: 1rem;
        }
        :host dialog p.powered-by {
          font-size: 0.5rem;
          margin: 1rem;
          opacity: 0.8;
        }

        :host dialog button {
          max-width: 300px;
          margin-left: auto;
          margin-right: auto; 
        }

        :host dialog button:not(#cancel) {
          text-align: center;
          background-color: ${isLightMode ? "#ffffff" : "#1a1a1a"};
          color: ${isLightMode ? "#242424" : "#ffffff"};
          border: ${isLightMode ? "solid 1px #ccc" : "solid 1px #3a3a3a"};
          border-radius: 24px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          margin-top: 16px;
          padding: 12px 16px;
          display: flex;
          justify-content: center;
          width: 100%;
          min-width: 280px;
          min-height: 54px;
          align-items: center;
          font-family: "Roboto", sans-serif;
          font-weight: 400;
        }

        :host dialog button:not(#cancel):not([disabled]):hover {
          background-color: ${isLightMode ? "#f5f5f5" : "#333333"};
        }

        :host dialog button[disabled] {
          opacity: 0.6;
          cursor: not-allowed!important;
        }

        :host dialog button#connect-google svg {
          margin-right: 8px;
        }

        :host #cancel {
          background-color: transparent;
          border: none;
          color: ${isLightMode ? "#242424" : "#ffffff"};
          cursor: pointer;
          position: absolute;
          right: 16px;
          top: 16px;
        }

        @media (max-width: 600px) {
          :host dialog {
            width: 100vw;
            height: 100vh;
            max-width: 100vw;
            max-height: 100vh;
            border-radius: 0;
            border: none;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

      </style>
      <dialog class="dialog">
        <form method="dialog">
          <button id="cancel">
            <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <path
                fill="${color}"
                d="M12 10.586L15.879 6.707a1 1 0 011.414 1.414L13.414 12l3.879 3.879a1 1 0 01-1.414 1.414L12 13.414l-3.879 3.879a1 1 0 01-1.414-1.414L10.586 12 6.707 8.121a1 1 0 111.414-1.414L12 10.586z"
                class="app-icon"></path>
            </svg>
          </button>
          <p class="title">${integrator}</p>
          <svg id="logo" width="49" height="51" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="${color}"
              d="M3.9468 10.0288L20.5548.995c2.4433-1.3267 5.45-1.3267 7.8936 0l16.6078 9.0338C47.4966 11.3585 49 13.8102 49 16.4666V34.534c0 2.6537-1.5034 5.1082-3.9438 6.438l-16.6078 9.0307c-2.4435 1.3297-5.4503 1.3297-7.8937 0L3.9467 40.972C1.5035 39.642 0 37.1876 0 34.534V16.4667c0-2.6564 1.5034-5.108 3.9468-6.4378z"
              class="app-icon"></path>
          </svg>

          <div class="buttonsList">
            <button type="reset" id="connect-google">
              <svg width="28px" height="28px" viewBox="-3 0 262 262" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid">
                <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4"/><path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853"/><path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05"/><path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335"/>
              </svg>
              Connect with Google
            </button>

            <p>or</p>

            <button type="reset" id="connect-email">
              Email
            </button>

            <button type="reset" id="connect-wallet">
              Connect wallet
            </button>
            <p class="policy">
              <a href="#">Privacy Policy</a> - <a href="#">Terms</a>
            </p>
            <p class="powered-by">
              Powered by <a href="https://hexaonelabs.com" target="_blank" rel="noopener">Hexa One Labs</a>
            </p>
          </div>
        </form>
      </dialog>
    `;
    shadow.appendChild(template.content.cloneNode(true));
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
      ?.querySelector(".buttonsList")
      ?.addEventListener("click", async (event) => {
        const target = event.target as HTMLElement;
        const button = target.closest("button");
        if (!button) return;
        // styling button as loading
        button.disabled = true;
        button.innerHTML = `Connecting...`;
        // emiting custome event
        switch (button.id) {
          case "connect-google":
            this.dispatchEvent(
              new CustomEvent("connect", {
                detail: "connect-google",
              })
            );
          break;
          case "connect-email":
            this.dispatchEvent(
              new CustomEvent("connect", {
                detail: "connect-email",
              })
            );
          break;
        }
      });
  }

  public async toggleIconAsCheck(): Promise<boolean> {
    // toggle with transition animation
    const button = this.shadowRoot?.querySelector("#connect-google");
    if (button) {
      button.innerHTML = `
      <svg 
      xmlns="http://www.w3.org/2000/svg"
      fill="#00c853"
      width="18" height="18" viewBox="0 0 24 24">
        <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/>
      </svg>
        <span style="color:#00c853;">Connected</span>
      `;
      return new Promise((resolve) => {
        const t = setTimeout(() => {
          clearTimeout(t);
          resolve(true);
        }, 1500);
      });
    } else {
      throw new Error("Button not found");
    }
  }
}

customElements.define("hexa-signin-dialog", HexaSigninDialogElement);
export { HexaSigninDialogElement };
