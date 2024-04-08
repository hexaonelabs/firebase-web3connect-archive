
export const CheckboxElement = (label?: string) => {
  return `
    <style>
    
      .checkbox__container {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 1rem auto 0;
        font-size: 0.8rem;
      }

      input[type='checkbox'] {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border: var(--dialog-border);
        display: grid;
        place-content: center;
        background-color: var(--dialog-background-color);
        border-radius: 4px;
        cursor: pointer;
        transition: all 125ms ease-in-out;
      }

      input[type='checkbox']::after {
        content: '';
        width: 20px;
        height: 20px;
        transform: scale(0);
        background-color: var(--dialog-background-color);
        clip-path: polygon(17% 54%, 28% 43%, 38% 54%, 70% 22%, 81% 33%, 38% 75%, 17% 54%);
      }

      input[type='checkbox']:checked {
        background-color: var(--dialog-background-color);
      }

      input[type='checkbox']::after {
        transform: scale(1);
      }

      input[type='checkbox']:checked::after {
        background-color: var(--text-color);
      }
    </style>
    <div class="checkbox__container">
      <input type="checkbox" id="toggle__encription" name="toggle__encription" checked="true">
      <label for="toggle__encription">${ label ? label : 'Encrypt backup file'}</label>
    </div>
  `;
}