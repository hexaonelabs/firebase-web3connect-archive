import { firebaseWeb3Connect } from './firebase-web3connect.service';

export function setupAccountTab(
	element: HTMLDivElement,
	{ wallet, userInfo, signout }: typeof firebaseWeb3Connect
) {
	// let signature!: string;
	element.innerHTML = `
    <h1>Connected</h1>
    <p id="address">${userInfo?.address}</p>
    <button id="signout">signout</button><br/>

		<h2>Sign and Verify</h2>
		<input type="text" id="content" placeholder="Enter content to sign" />
		<button id="sign">Sign message</button><br/>
		<input type="text" id="signature" placeholder="Enter signature" />
		<button id="verify">Verify signature</button>
		<pre></pre>
  `;

	element.querySelector('#sign')?.addEventListener('click', async () => {
		const contentElement = element.querySelector(
			'#content'
		) as HTMLInputElement;
		// use etherjs to sign the message
		const signature = await wallet?.signMessage(contentElement?.value);
		(element.querySelector('#signature') as HTMLInputElement).value =
			`${signature}`;
	});

	element.querySelector('#verify')?.addEventListener('click', async () => {
		const contentElement = element.querySelector(
			'#content'
		) as HTMLInputElement;
		// Verify the signature with address
		const isValid = wallet?.verifySignature(
			`${contentElement.value}`,
			(element.querySelector('#signature') as HTMLInputElement).value
		);
		console.log('Signature is valid:', isValid);
		(element.querySelector('pre') as HTMLPreElement).innerHTML =
			`Signature isValid: ${isValid}`;
	});

	element.querySelector('#signout')?.addEventListener('click', async () => {
		await signout();
	});
}
