import { providers } from "ethers";

export interface IWalletProvider {
  connectWithExternalWallet: () => Promise<{
    privateKey: null;
    publicKey: null;
    address: string;
    did: string;
    provider: providers.Web3Provider;
  }>,
  generateWalletFromPrivateKey: (privateKey: string, chainId?: number) => Promise<{
    privateKey: string;
    publicKey: string;
    address: string;
    did: string;
    provider: providers.JsonRpcProvider;
  }>,
  generateWalletFromMnemonic: (mnemonic?: string, chainId?: number) => Promise<{
    privateKey: string;
    publicKey: string;
    address: string;
    did: string;
    provider: providers.JsonRpcProvider;
  }>,
  generateDID: (address: string) => string;
}
