import html from './dialogElement.html?raw';
import css from './dialogElement.css?raw';
import { DEFAULT_SIGNIN_METHODS, KEYS, SigninMethod } from '../../constant';
import { promptPasswordElement } from '../prompt-password-element/prompt-password-element';
import { promptEmailPasswordElement } from '../prompt-email-password-element/prompt-email-password-element';
import { promptToDownloadElement } from '../prompt-download-element/prompt-download-element';
import { SpinnerElement } from '../spinner-element/spinner-element';
import { promptWalletTypeElement } from '../prompt-wallet-type-element/prompt-wallet-type-element';

import { DialogUIOptions } from '../../interfaces/sdk.interface';
import { FirebaseWeb3ConnectDialogElement } from '../../interfaces/dialog-element.interface';
import { storageService } from '../../services/storage.service';
import { promptSignoutElement } from '../prompt-signout-element/prompt-signout-element';
import { Logger } from '../../utils';

// export webcomponent with shadowdom
export class HexaSigninDialogElement
	extends HTMLElement
	implements FirebaseWeb3ConnectDialogElement
{
	private _ops?: DialogUIOptions;

	get ops() {
		return this._ops;
	}

	set ops(_ops: DialogUIOptions | undefined) {
		const enabledSigninMethods =
			_ops?.enabledSigninMethods?.filter(
				(method): method is (typeof DEFAULT_SIGNIN_METHODS)[number] =>
					method !== undefined
			) || DEFAULT_SIGNIN_METHODS;
		const integrator = _ops?.integrator
			? _ops.integrator
			: 'FirebaseWeb3Connect';
		const logoUrl =
			(this.ops?.logoUrl?.length || 0) > 0 ? this.ops?.logoUrl : undefined;
		const isLightMode =
			_ops?.isLightMode === undefined
				? window.matchMedia('(prefers-color-scheme: light)').matches
				: _ops.isLightMode;
		// object validation
		// TODO: validate object
		this._ops = {
			..._ops,
			logoUrl,
			integrator,
			enabledSigninMethods,
			isLightMode
		};
		Logger.log(`[INFO] ops: `, this.ops);

		// check if shadow dom is initialized and empty
		if (this.shadowRoot?.innerHTML === '') {
			this._render();
		} else {
			throw new Error('ShadowDOM already initialized');
		}
	}

	constructor() {
		super();
		// build shadow dom
		const shadow = this.attachShadow({ mode: 'open' });
		if (!shadow) {
			throw new Error('ShadowDOM not supported');
		}
	}

	private _render() {
		// create template element
		const template = document.createElement('template');
		template.innerHTML = `
        <style>${css}</style>
        ${html}
    `;
		// add spinner element to template content
		(template.content.querySelector('#spinner') as HTMLElement).innerHTML =
			SpinnerElement();

		// disable buttons that are not enabled
		const buttons = template.content.querySelectorAll(
			'.buttonsList button'
		) as NodeListOf<HTMLButtonElement>;
		buttons.forEach(button => {
			if (
				!this.ops?.enabledSigninMethods?.includes(
					button.id as unknown as SigninMethod
				) &&
				button.id.startsWith('connect')
			) {
				button.remove();
			}
		});
		// remove `or` tage if google is not enabled
		if (
			!this.ops?.enabledSigninMethods?.includes(SigninMethod.Google) ||
			(this.ops.enabledSigninMethods.includes(SigninMethod.Google) &&
				this.ops.enabledSigninMethods.length === 1)
		) {
			template.content.querySelector('.or')?.remove();
		}
		if (this.ops?.logoUrl) {
			Logger.log(`[INFO] Logo URL: `, this.ops.logoUrl);
			(template.content.querySelector('#logo') as HTMLElement).innerHTML = `
				<img src="${this.ops.logoUrl}" alt="logo" />	
			`;
		}
		if (!this.shadowRoot) {
			throw new Error('ShadowRoot not found. Webcomponent not initialized.');
		}
		// add attribut to manage dark/light mode
		this.setAttribute('theme', this.ops?.isLightMode ? 'light' : 'dark');
		// finaly add template to shadow dom
		this.shadowRoot.appendChild(template.content.cloneNode(true));
		// replace tags from html with variables
		const variables = [{ tag: 'integrator', value: `${this.ops?.integrator}` }];
		variables.forEach(variable => {
			if (!this.shadowRoot) {
				throw new Error('ShadowRoot not found while replacing variables');
			}
			this.shadowRoot.innerHTML = this.shadowRoot.innerHTML.replace(
				new RegExp(`{{${variable.tag}}}`, 'g'),
				variable.value
			);
		});
	}

	public showModal(): void {
		this.shadowRoot?.querySelector('dialog')?.showModal();
	}

	public hideModal(): void {
		this.shadowRoot?.querySelector('dialog')?.close();
	}

	// manage events from shadow dom
	public connectedCallback() {
		this.shadowRoot
			?.querySelector('dialog')
			?.addEventListener('click', async event => {
				// filter event name `connect
				const button = (event.target as HTMLElement).closest('button');
				if (!button) return;
				// handle cancel
				if (button.id === 'cancel') {
					this.dispatchEvent(
						new CustomEvent('connect', {
							detail: button.id
						})
					);
					// stop further execution of code
					// as we don't want to show loading on cancel
					// and we don't want to show connected on cancel.
					// This will trigger the event and close the dialog
					return;
				}
				// handle reset button
				if (button.id === 'create-new-wallet') {
					this.dispatchEvent(new CustomEvent('reset'));
					return;
				}
				// only button from connection type request
				if (!button.id.includes('connect')) {
					return;
				}
				// hide all btns and display loader with animation
				const btnsElement = this.shadowRoot?.querySelector(
					'dialog .buttonsList'
				) as HTMLElement;
				const spinnerElement = this.shadowRoot?.querySelector(
					'dialog #spinner'
				) as HTMLElement;
				btnsElement.style.display = 'none';
				spinnerElement.style.display = 'block';

				// emiting custome event to SDK
				switch (button.id) {
					case 'connect-google':
						this.dispatchEvent(
							new CustomEvent('connect', {
								detail: button.id
							})
						);
						break;
					case 'connect-email':
						this.dispatchEvent(
							new CustomEvent('connect', {
								detail: button.id
							})
						);
						break;
					case 'connect-email-link':
						this.dispatchEvent(
							new CustomEvent('connect', {
								detail: button.id
							})
						);
						break;
					case 'connect-wallet':
						this.dispatchEvent(
							new CustomEvent('connect', {
								detail: button.id
							})
						);
						break;
				}
			});
	}

	public async toggleSpinnerAsCheck(message?: string): Promise<boolean> {
		await new Promise(resolve => {
			const t = setTimeout(() => {
				clearTimeout(t);
				resolve(true);
			}, 1500);
		});
		const element = this.shadowRoot?.querySelector(
			'dialog #spinner'
		) as HTMLElement;
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
		${message ? `<p>${message}</p>` : ''}
    `;
		return new Promise(resolve => {
			const t = setTimeout(() => {
				clearTimeout(t);
				resolve(true);
			}, 1800);
		});
	}

	public async toggleSpinnerAsCross(
		message: string = 'An error occured. Please try again.'
	): Promise<boolean> {
		await new Promise(resolve => {
			const t = setTimeout(() => {
				clearTimeout(t);
				resolve(true);
			}, 1500);
		});
		const element = this.shadowRoot?.querySelector(
			'dialog #spinner'
		) as HTMLElement;
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
		return new Promise(resolve => {
			const t = setTimeout(() => {
				clearTimeout(t);
				resolve(true);
			}, 1800);
		});
	}

	public async promptPassword() {
		const value = await promptPasswordElement(
			this.shadowRoot?.querySelector('dialog #spinner') as HTMLElement
		);
		return value;
	}

	public async promptEmailPassword(ops?: {
		hideEmail?: boolean;
		hidePassword?: boolean;
	}) {
		const value = await promptEmailPasswordElement(
			this.shadowRoot?.querySelector('dialog #spinner') as HTMLElement,
			ops
		);
		return value;
	}

	public async promptBackup() {
		const value = await promptToDownloadElement(
			this.shadowRoot?.querySelector('dialog #spinner') as HTMLElement
		);
		return value;
	}

	public async promptSignoutWithBackup() {
		const value = await promptSignoutElement(
			this.shadowRoot?.querySelector('dialog #spinner') as HTMLElement
		);
		return value;
	}

	public async promptWalletType() {
		const value = await promptWalletTypeElement(
			this.shadowRoot?.querySelector('dialog #spinner') as HTMLElement
		);
		return value;
	}

	public async promptAuthMethods() {
		(
			this.shadowRoot?.querySelector('dialog #spinner') as HTMLElement
		).style.display = 'none';
		(
			this.shadowRoot?.querySelector('dialog .buttonsList') as HTMLElement
		).style.display = 'block';
	}

	public async reset() {
		const confirm = window.confirm(
			`You are about to clear all data to create new Wallet. This will remove all your existing data and we will not be able to recover it if you don't have backup. You are confirming that you want to clear all data and create new Wallet?`
		);
		if (!confirm) {
			return;
		}
		// reset html
		if (this.shadowRoot?.innerHTML) this.shadowRoot.innerHTML = '';
		this._ops = {
			...this._ops,
			enabledSigninMethods: DEFAULT_SIGNIN_METHODS
		};
		this._render();
		// add event listener
		this.connectedCallback();
		// remove "Create new Wallet" button if no auth method is enabled
		const authMethod = await storageService.getItem(
			KEYS.STORAGE_AUTH_METHOD_KEY
		);
		if (!authMethod) {
			this.shadowRoot?.querySelector('#create-new-wallet')?.remove();
		}
		this.showModal();
	}
}
