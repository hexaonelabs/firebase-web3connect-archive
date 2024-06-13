import { CheckboxElement } from '../checkbox-element/checkbox-element';
import css from './prompt-signout-element.css?raw';

export const promptSignoutElement = async (
	ref: HTMLElement,
	ops?: {
		html?: string;
	}
): Promise<{
	withEncryption?: boolean;
	skip?: boolean;
	clearStorage?: boolean;
	cancel?: boolean;
}> => {
	const { html } = ops || {};
	const container = document.createElement('div');
	container.classList.add('prompt-container');
	ref.after(container);
	ref.style.display = 'none';

	return new Promise(resolve => {
		container.innerHTML = `
      <style>${css}</style>
			${
				html ||
				`
        <h3>
        Signout
      </h3>
      <p class="information">
        You are about to signout from your Wallet and your Private Key still remains encrypted on this device unless you remove it.
      </p>
      ${CheckboxElement({
				label: 'Download encrypted backup file',
				id: 'toggle__download',
				checked: true
			})}
      ${CheckboxElement({
				label: 'Remove data from device',
				id: 'toggle__clear_data'
			})}

      <button id="button__signout">Signout</button>
      
      <p><a class="button__cancel">cancel</a></p>
			`
			}

    `;

		const toggleDownload = container.querySelector(
			'#toggle__download'
		) as HTMLInputElement;
		const toggleClear = container.querySelector(
			'#toggle__clear_data'
		) as HTMLInputElement;
		const buttonCancel = container.querySelector(
			'.button__cancel'
		) as HTMLButtonElement;
		buttonCancel.addEventListener('click', e => {
			e.preventDefault();
			resolve({ cancel: true });
			container.remove();
			ref.style.display = 'block';
		});

		const buttonDownload = container.querySelector(
			'#button__signout'
		) as HTMLButtonElement;
		buttonDownload.addEventListener('click', async () => {
			resolve({
				withEncryption: toggleDownload.checked,
				skip: !toggleDownload.checked ? true : false,
				clearStorage: toggleClear.checked
			});
			container.remove();
			ref.style.display = 'block';
		});

		// manage dialog close btn
		const mainCloseBtn = ref.closest('dialog')?.querySelector('#cancel');
		if (mainCloseBtn) {
			mainCloseBtn.addEventListener('click', e => {
				e.preventDefault();
				resolve({ cancel: true });
				container.remove();
				ref.style.display = 'block';
			});
		}
	});
};
