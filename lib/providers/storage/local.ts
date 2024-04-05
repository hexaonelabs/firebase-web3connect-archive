
import { IStorageProvider } from "../../interfaces/storage-provider.interface";
import Crypto from "../crypto/crypto";

const Environment = Object.freeze({
  applyEncryption: () => true,
  encryptedKeyIndexKey: () => "hexa-key-index",
});

const isStringified = Object.freeze((input: string = "") => {
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
});

class LocalStorage implements IStorageProvider {
  
  private _uid!: string;
  private _encryptedKeyIndex = new Map<string, string>();
  public setUid(value: string) {
    this._uid = value;
  }

  /**
   *
   * @param key
   * @returns
   */
  public  async getItem(key: string, passkey?: string): Promise<string | null> {
    if (Environment.applyEncryption() && passkey) {
      if (!this._encryptedKeyIndex.get(key)) {
        const encryptedKeyIndex = await this._getAndDecryptEncryptedKeyIndex();
        if (encryptedKeyIndex) {
          this._encryptedKeyIndex = encryptedKeyIndex;
        }
      }
      const encryptedKey = this._encryptedKeyIndex.get(key) as string;
      const encryptedItem = window.localStorage.getItem(encryptedKey) || undefined;
      return isStringified(
        encryptedItem
          ? await Crypto.decrypt(passkey, encryptedItem)
          : encryptedItem
      );
    } else {
      return isStringified( window.localStorage.getItem(key) || undefined);
    }
  }

  /**
   *
   * @param key
   * @param value
   */
  public async setItem(key: string, value: string, passkey?: string): Promise<void> {
    if (Environment.applyEncryption() && passkey && value && this._uid) {
      const encodedKey = await Crypto.encrypt(this._uid, key);
      this._encryptedKeyIndex.set(key, encodedKey);
      // save encryptedKeyIndex to local storage
      const mapIndex = JSON.stringify(Array.from(this._encryptedKeyIndex.entries()));
      const encryptedItem = await Crypto.encrypt(passkey, value);
      const encryptedMapIndex = await Crypto.encrypt(this._uid, mapIndex);
      window.localStorage.setItem(Environment.encryptedKeyIndexKey(), encryptedMapIndex);
      window.localStorage.setItem(encodedKey, encryptedItem);
    } else {
      window.localStorage.setItem(key, value);
    }
  }

  /**
   *
   * @param key
   */
  public async removeItem(key: string) {
    if (Environment.applyEncryption() && this._uid) {
      const encryptedKey = this._encryptedKeyIndex.get(key);
      if (!encryptedKey) return;
      window.localStorage.removeItem(encryptedKey);
      this._encryptedKeyIndex.delete(key);
      const mapIndex = JSON.stringify(Array.from(this._encryptedKeyIndex.entries()));
      const encryptedMapIndex = await Crypto.encrypt(this._uid, mapIndex);
      window.localStorage.setItem(Environment.encryptedKeyIndexKey(), encryptedMapIndex);
    } else {
      window.localStorage.removeItem(key);
    }
  }

  /**
   *
   * @param keys
   */
  public async removeItems(keys: string[]) {
    for (const key of keys) await this.removeItem(key);
  }

  /**
   *
   */
  public async clear() {
    window.localStorage.clear();
  }

  private async _getAndDecryptEncryptedKeyIndex() {
    const encryptedMapIndexString = window.localStorage.getItem(Environment.encryptedKeyIndexKey());
    if (!encryptedMapIndexString) {
      return;
    }
    const mapIndexString = await Crypto.decrypt(this._uid, encryptedMapIndexString);
    const mapIndex = isStringified(mapIndexString);
    return new Map(mapIndex) as Map<string, string>;
  }
}

const storage: IStorageProvider = new LocalStorage();

export default storage;