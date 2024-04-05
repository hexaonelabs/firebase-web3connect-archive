
export const promptElement = (
  ref: HTMLElement, 
  message: string, 
  opts?: {
    inputType?: string;
    autocomplet?: string;
    placeholder?: string;
  },
): Promise<string> => {
  return new Promise((resolve) => {
    // build variable from existing options and default using extracting
    // the value from the opts object
    const { 
      inputType = 'text', 
      autocomplet = 'off',
      placeholder = '',
    } = opts || {};

    const container = document.createElement('div');
    container.classList.add('prompt-container');
    const html = `
    <style>
      .prompt-container {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--dialog-background-color);
        position: absolute;
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
        min-hieght: 50px;
        width: 100%;
        max-width: 300px;
        margin: 1rem auto 0;
        text-align: center;
        color: var(--text-color);
        background: var(--dialog-background-color);
        border: var(--dialog-border);
        border-radius: 24px;
        padding: 12px 16px;
        font-size: 1em;
        text-align: center;
      }
    </style>
      <div class="prompt__message">
        <p>${message}</p>
      </div>
      <input 
        class="prompt__input" 
        name="${inputType}"
        type="${inputType}" 
        autocomplet="${autocomplet}"
        placeholder="${placeholder}" />
      <button disabled class="prompt__button">OK</button>
    `;
    container.innerHTML = html;
    ref.appendChild(container);

    const input = container.querySelector('.prompt__input') as HTMLInputElement;
    const button = container.querySelector('.prompt__button') as HTMLButtonElement;

    button.addEventListener('click', () => {
      resolve(input.value);
      container.remove();
    });

    // manage validation of input to enable button
    input.addEventListener('input', () => {
      if (input.value.length > 0) {
        button.disabled = false;
      } else {
        button.disabled = true;
      }
    });

  });
};