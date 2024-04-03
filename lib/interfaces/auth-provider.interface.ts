
type Unsubscribe = () => void;

export interface IAuthProvider<T> {
  signinWithGoogle: () => Promise<any>;
  sendLinkToEmail: (email: string) => Promise<void>;
  signInWithLink: () => Promise<any>;
  signInAsAnonymous: () => Promise<any>;
  signOut: () => Promise<void>;
  getOnAuthStateChanged: (
    cb: (user: {uid: string; isAnonymous: boolean} | null) => void
  ) => Unsubscribe;
  getCurrentUserAuth: () => Promise<any>;
  initialize: (config: T) => void;
}