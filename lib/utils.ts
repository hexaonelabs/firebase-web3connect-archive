import { FirebaseOptions } from 'firebase/app';

export const parseApiKey = (hex: string) => {
	// converte hex string to utf-8 string
	if (!hex || hex.length <= 0) {
		throw new Error('Unexisting API key');
	}
	const json = Buffer.from(hex, 'hex').toString('utf-8');
	const apiKey = JSON.parse(json);
	return apiKey as FirebaseOptions;
};
