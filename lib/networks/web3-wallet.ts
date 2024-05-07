import { providers } from 'ethers';

export abstract class Web3Wallet {
	address!: string;
	privateKey: string | undefined;
	publicKey: string | undefined;
	provider: providers.JsonRpcProvider | undefined;

	constructor(privateKey: string, provider: providers.JsonRpcProvider) {
		this.privateKey = privateKey;
		this.provider = provider;
	}

	abstract sendTransaction(tx: unknown): Promise<providers.TransactionResponse>;
	abstract signTransaction(tx: unknown): Promise<string>;
	abstract signMessage(message: string): Promise<string>;
	abstract verifySignature(message: string, signature: string): boolean;
}
