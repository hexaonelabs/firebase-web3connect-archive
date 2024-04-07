import storageProvider from "../../providers/storage/local";

export const promptPasswordElement = async (
  ref: HTMLElement, 
): Promise<string> => {

  const minPasswordLength = 4;
  const maxPasswordLength = 32;

  const isCreating = !await storageProvider.isExistingPrivateKeyStored()

  const isValideInputs = (inputPassword: HTMLInputElement, inputConfirme?: HTMLInputElement) => {
    if (!inputConfirme) {
      return inputPassword.value.length > 0;
    }
    return (inputPassword.value.length > 0 && inputConfirme.value.length > 0 && inputPassword.value === inputConfirme.value);
  }

  return new Promise((resolve) => {

    const container = document.createElement('div');
    container.classList.add('prompt-container');
    const html = `
    <style>
      .prompt-container {
        background: var(--dialog-background-color);
        height: 100%;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0rem;
        box-sizing: border-box;
      }

      .prompt__input {
        display: block;
        min-height: 50px;
        width: 100%;
        max-width: 300px;
        margin: 0rem auto 0.5rem;
        text-align: center;
        color: var(--text-color);
        background: var(--button-background);
        border: var(--dialog-border);
        border-radius: 12px;
        padding: 12px 16px;
        font-size: 1em;
        text-align: center;
      }
      .prompt__message { 
        margin-bottom: 1.5rem;
      }
      .prompt__button {
        margin-top: 1rem;
      }

    </style>
      <div class="prompt__message">
        <p><b>${
          isCreating 
            ? 'Protect your wallet with a password'
            : 'Welcome back!'
        
        }</b></p>
        <p>
          ${isCreating
            ? `The password you enter encrypts your private key and gives access to your funds. Please store your password in a safe place. We don’t keep your information and can’t restore it.`
            : `Unlock your wallet with your password.`
          }
        </p>
      </div>
      <input 
        class="prompt__input password" 
        name="password"
        type="password" 
        minLength="${minPasswordLength}"
        maxLength="${maxPasswordLength}"
        autocomplet="${ isCreating ? 'new-password' : 'current-password'}"
        placeholder="password" />
      ${isCreating 
          ? `
            <input 
              class="prompt__input confirme" 
              name="confirme"
              type="password" 
              minLength="${minPasswordLength}"
              maxLength="${maxPasswordLength}"
              autocomplet="new-password"
              placeholder="confirme password" />
              `
              : ``}
      <button disabled class="prompt__button">OK</button>
    `;
    container.innerHTML = html;
    ref.after(container);
    ref.style.display = 'none';

    const inputPassword = container.querySelector('.prompt__input.password') as HTMLInputElement;
    const inputConfirme = container.querySelector('.prompt__input.confirme') as HTMLInputElement;
    const button = container.querySelector('.prompt__button') as HTMLButtonElement;
    button.addEventListener('click', () => {
      resolve(inputPassword.value);
      container.remove();
      // prevent flash ui. ref will be hiden to display backup step
      // if is creating wallet. This is why we dont switch to display block
      if (!isCreating) {
        ref.style.display = 'block';
      }
    });
    
    // manage validation of input to enable button
    inputPassword.addEventListener('input', () => {
      const isValid = isValideInputs(inputPassword, inputConfirme);
      button.disabled = !isValid;
    });

    if (isCreating) {
      inputConfirme.addEventListener('input', () => {
        const isValid = isValideInputs(inputPassword, inputConfirme);
        button.disabled = !isValid;
      });
    }

  });
};

