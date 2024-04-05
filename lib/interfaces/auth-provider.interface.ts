
type Unsubscribe = () => void;

export interface IAuthProvider<T> {
  signinWithGoogle: () => Promise<{uid: string}>;
  sendLinkToEmail: (email: string) => Promise<void>;
  signInWithLink: () => Promise<any>;
  signInAsAnonymous: () => Promise<any>;
  signOut: () => Promise<void>;
  getOnAuthStateChanged: (
    cb: (user: {uid: string; isAnonymous: boolean} | null) => void
  ) => Unsubscribe;
  getCurrentUserAuth: () => Promise<{uid: string; isAnonymous: boolean} | null>;
  initialize: (config: T) => void;
}