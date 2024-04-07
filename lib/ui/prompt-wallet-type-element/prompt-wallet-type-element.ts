import extensionIcon from '../../assets/svg/extension-puzzle-outline.svg?raw';
import downloadIcon from '../../assets/svg/download-outline.svg?raw';
import css from './prompt-wallet-type-element.css?raw';

export const promptWalletTypeElement = async (  ref: HTMLElement
  ): Promise<'browser-extension'|'import-privatekey'|'import-seed'> => {
    const container = document.createElement('div');
    container.classList.add('prompt-container');
    ref.after(container);
    ref.style.display = 'none';
    container.innerHTML = `
      <style>
        ${css}
      </style>
      <div class="prompt__wallet_type">
        <button id="button__external_wallet">
          ${extensionIcon}
          <span>Browser extension</span>
        </button>
        <button id="button__import_wallet">
          ${downloadIcon}
          <span>import wallet</span>
        </button>
      </div>
    `;

    const buttonExternalWallet = container.querySelector('#button__external_wallet') as HTMLButtonElement;
    const buttonImportWallet = container.querySelector('#button__import_wallet') as HTMLButtonElement;
  
    return new Promise((resolve) => {
      buttonExternalWallet.addEventListener('click', () => {
        resolve('browser-extension');
        container.remove();
        ref.style.display = 'block';
      });

      buttonImportWallet.addEventListener('click', () => {
        // request `import-seed` or `import-privatekey`
        // based on user selection
        // this will be handled in the next step
        resolve('import-seed');
        container.remove();
        ref.style.display = 'block';
      });
    });
}