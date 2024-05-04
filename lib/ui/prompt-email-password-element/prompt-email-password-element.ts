const isValideInputs = (
	inputPassword: HTMLInputElement,
	inputEmail?: HTMLInputElement
) => {
	if (!inputEmail || !inputPassword) {
		return false;
	}
	return inputPassword.value.length > 0 && inputEmail.value.length > 0;
};

export const promptEmailPasswordElement = async (
	ref: HTMLElement
): Promise<{
	password: string;
	email: string;
}> => {
	const minPasswordLength = 4;
	const maxPasswordLength = 32;

	return new Promise(resolve => {
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
      <p><b>
        Protect your wallet with a password
      </b></p>
      <p>
        The password you enter encrypts your private key and gives access to your funds. 
        Please store your password in a safe place. 
        We don’t keep your information and can’t restore it.
      </p>
    </div>
    <input 
      class="prompt__input email" 
      name="email"
      type="email" 
      minLength="${minPasswordLength}"
      placeholder="email" />
    <input 
      class="prompt__input password" 
      name="password"
      type="password" 
      minLength="${minPasswordLength}"
      maxLength="${maxPasswordLength}"
      autocomplet="current-password"
      placeholder="password" />
    <button disabled class="prompt__button">Connect</button>
    `;
		container.innerHTML = html;
		ref.after(container);
		ref.style.display = 'none';

		const inputPassword = container.querySelector(
			'.prompt__input.password'
		) as HTMLInputElement;
		const inputEmail = container.querySelector(
			'.prompt__input.email'
		) as HTMLInputElement;
		const button = container.querySelector(
			'.prompt__button'
		) as HTMLButtonElement;

		// manage validation of input to enable button
		inputPassword.addEventListener('input', () => {
			const isValid = isValideInputs(inputPassword, inputEmail);
			button.disabled = !isValid;
		});

		button.addEventListener('click', () => {
			resolve({
				password: inputPassword.value,
				email: inputEmail.value
			});
			container.remove();
			// prevent flash ui. ref will be hiden to display backup step
			// if is creating wallet. This is why we dont switch to display block
			// if (!isCreating) {
			ref.style.display = 'block';
			// }
		});
	});
};
