import { Web3Wallet } from '../networks/web3-wallet';

export interface IWalletProvider<T> {
	connectWithExternalWallet: () => Promise<Web3Wallet>;
	generateWalletFromMnemonic: (ops: T) => Promise<Web3Wallet>;
	generateDID: (address: string) => string;
}
