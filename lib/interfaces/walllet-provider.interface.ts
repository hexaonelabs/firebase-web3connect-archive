import { Web3Wallet } from '../networks/web3-wallet';

export interface IWalletProvider {
	connectWithExternalWallet: () => Promise<Web3Wallet>;
	generateWalletFromPrivateKey: (
		privateKey: string,
		chainId?: number
	) => Promise<Web3Wallet>;
	generateWalletFromMnemonic: (
		mnemonic?: string,
		chainId?: number
	) => Promise<Web3Wallet>;
	generateDID: (address: string) => string;
}
