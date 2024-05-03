import { firebaseWeb3Connect } from './firebase-web3connect.service';

export function setupAccountTab(
	element: HTMLDivElement,
	wallet: typeof firebaseWeb3Connect
) {
	// let signature!: string;
	element.innerHTML = `
    <h1>Connected</h1>
    <p id="address">${wallet?.userInfo?.address}</p>

    <input id="content" type="text" /><br/>
    <button id="signout">signout</button>
  `;

	// element.querySelector("#sign")?.addEventListener("click", async () => {
	//   const contentElement = element.querySelector("#content") as HTMLInputElement;
	//   signature = await wallet.signMessage(`${contentElement?.value}`);
	//   console.log({ signature });
	// });

	// element.querySelector("#verify")?.addEventListener("click", async () => {
	//   const contentElement = element.querySelector("#content") as HTMLInputElement;
	//   // Verify the signature with address
	//   const isValid = wallet.verifySignature(
	//     `${contentElement?.value}`,
	//     signature
	//   );
	//   console.log("Signature is valid:", isValid);
	// });

	element.querySelector('#signout')?.addEventListener('click', async () => {
		await wallet.signout();
	});
}
