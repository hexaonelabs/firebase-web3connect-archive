import { hexaConnect } from "./hexa-connect.service";

export function setupConnectTab(element: HTMLDivElement) {

  element.innerHTML = `
    <button id="connectUI">Connect with UI</button>
  `;
  element.querySelector("#connectUI")?.addEventListener("click", async () => {
    await hexaConnect
    .connectWithUI(true)
    .catch((err) => {
      console.error('error from component app; ',err);
    });
  });
}
