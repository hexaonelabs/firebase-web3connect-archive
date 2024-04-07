import { CheckboxElement } from "../checkbox-element/checkbox-element";

export const promptToDownloadElement = async (
  ref: HTMLElement
): Promise<{
  withEncryption?: boolean;
  skip?: boolean;
}> => {
  const container = document.createElement('div');
  container.classList.add('prompt-container');
  ref.after(container);
  ref.style.display = 'none';

  return new Promise((resolve) => {
    container.innerHTML = `
      <p>
        <b>
          Backup your wallet PrivateKey
        </b>
      </p>
      <p>
        Please save your backup file and keep it properly as well as password. It ensures access to your funds.
      </p>

      ${CheckboxElement()}

      <button id="button__download">Download backup file</button>
      
      <p><a id="button__skip">skip</a></p>
    `;
  
    const toggleEncription = container.querySelector('#toggle__encription') as HTMLInputElement;
    const buttonSkip = container.querySelector('#button__skip') as HTMLButtonElement;
    buttonSkip.addEventListener('click', (e) => {
      e.preventDefault();
      resolve({
        skip: true,
      });
      container.remove(); 
      ref.style.display = 'block';
    });

    const buttonDownload = container.querySelector('#button__download') as HTMLButtonElement;
    buttonDownload.addEventListener('click', async () => {
      resolve({
        withEncryption: toggleEncription.checked,
      });
      container.remove(); 
      ref.style.display = 'block';
  
    });
  });
}
