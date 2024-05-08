import { providers } from 'ethers';

export abstract class Web3Wallet {
	public address!: string;
	public publicKey: string | undefined;
	public provider: providers.JsonRpcProvider | undefined;
	public privateKey: string | undefined;
	protected _mnemonic?: string;

	constructor(mnemonic: string, provider: providers.JsonRpcProvider) {
		this._mnemonic = mnemonic;
		this.provider = provider;
	}

	get mnemonic() {
		return this._mnemonic;
	}

	abstract sendTransaction(tx: unknown): Promise<providers.TransactionResponse>;
	abstract signTransaction(tx: unknown): Promise<string>;
	abstract signMessage(message: string): Promise<string>;
	abstract verifySignature(message: string, signature: string): boolean;
}
