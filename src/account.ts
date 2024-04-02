import  { hexaConnect } from "./hexa-connect.service";

export function setupAccountTab(element: HTMLDivElement, wallet: typeof hexaConnect) {
  let signature!: string;
  element.innerHTML = `
    <h1>Connected</h1>
    <p id="address">${wallet?.userInfo?.address}</p>
    <p id="did">${wallet?.userInfo?.did}</p>

    <input id="content" type="text" /><br/>
    <button id="sign">sign</button>
    <button id="verify">verify</button>
  `;

  element.querySelector("#sign")?.addEventListener("click", async () => {
    const contentElement = element.querySelector("#content") as HTMLInputElement;
    signature = await wallet.signMessage(`${contentElement?.value}`);
    console.log({ signature });
  });

  element.querySelector("#verify")?.addEventListener("click", async () => {
    const contentElement = element.querySelector("#content") as HTMLInputElement;
    // Verify the signature with address
    const isValid = wallet.verifySignature(
      `${contentElement?.value}`,
      signature
    );
    console.log("Signature is valid:", isValid);
  });
}
