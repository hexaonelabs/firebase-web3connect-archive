
export interface IStorageProvider {
  setUid(uid: string): void;
  getItem(key: string, passkey?: string): Promise<string | null>;
  setItem(key: string, value: string, passkey?: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
  
}