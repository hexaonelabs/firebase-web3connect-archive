import { CheckboxElement } from '../checkbox-element/checkbox-element';
import css from './prompt-download-element.css?raw';

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

	return new Promise(resolve => {
		container.innerHTML = `
      <style>${css}</style>
      <p>
        <b>
          Backup your wallet PrivateKey
        </b>
      </p>
      <p>
        Download your backup file. We don't keep any copies of your private key, so make sure to keep it safe! 
        It's the only way to recover your wallet if you lose your device.
      </p>

      ${CheckboxElement()}

      <button id="button__download">Download backup file</button>
      
      <p><a class="button__skip">skip</a></p>
    `;

		const toggleEncription = container.querySelector(
			'#toggle__encription'
		) as HTMLInputElement;
		const buttonSkip = container.querySelector(
			'.button__skip'
		) as HTMLButtonElement;
		buttonSkip.addEventListener('click', e => {
			e.preventDefault();
			resolve({
				skip: true
			});
			container.remove();
			ref.style.display = 'block';
		});

		const buttonDownload = container.querySelector(
			'#button__download'
		) as HTMLButtonElement;
		buttonDownload.addEventListener('click', async () => {
			resolve({
				withEncryption: toggleEncription.checked
			});
			container.remove();
			ref.style.display = 'block';
		});
	});
};
