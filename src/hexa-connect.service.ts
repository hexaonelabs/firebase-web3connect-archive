import { HexaConnect, SigninMethod } from "../lib";

// create local instance of HexaConnect
const APIKEY = import.meta.env.VITE_AUTH_APIKEY||''; // get APIKEY from .env file
export const hexaConnect = new HexaConnect(
  APIKEY,
  // {
  //   enabledSigninMethods: [
  //     SigninMethod.Google,
  //   ]
  // }
);

export const isConnectWithLink = async () => {
  return HexaConnect.isConnectWithLink();
}
export const connectWithLink = async () => {
  return HexaConnect.connectWithLink();
}
