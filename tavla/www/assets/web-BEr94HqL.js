import {
  A as e,
  B as t,
  C as n,
  D as r,
  E as i,
  F as a,
  G as o,
  H as s,
  I as c,
  K as l,
  L as u,
  M as d,
  N as f,
  O as p,
  P as m,
  R as h,
  S as g,
  T as _,
  U as v,
  V as y,
  W as b,
  _ as x,
  a as S,
  b as C,
  c as w,
  d as T,
  f as E,
  g as D,
  h as O,
  i as k,
  j as A,
  k as j,
  l as M,
  m as N,
  o as P,
  p as F,
  q as I,
  s as L,
  t as R,
  u as z,
  v as B,
  w as V,
  x as H,
  y as U,
  z as W,
} from "./index-BLMBGPAE.js";
import { n as G, t as K } from "./definitions-DEpMNQg8.js";
var q = class q extends R {
  constructor() {
    (super(), (this.lastConfirmationResult = new Map()));
    let e = H();
    (e.onAuthStateChanged((e) => this.handleAuthStateChange(e)),
      e.onIdTokenChanged((e) => void this.handleIdTokenChange(e)));
  }
  async applyActionCode(e) {
    return E(H(), e.oobCode);
  }
  async createUserWithEmailAndPassword(e) {
    let t = await x(H(), e.email, e.password);
    return this.createSignInResult(t, null);
  }
  async confirmPasswordReset(e) {
    return O(H(), e.oobCode, e.newPassword);
  }
  async confirmVerificationCode(e) {
    let { verificationCode: t, verificationId: n } = e,
      r = this.lastConfirmationResult.get(n);
    if (!r) throw Error(q.ERROR_CONFIRMATION_RESULT_MISSING);
    let i = await r.confirm(t);
    return this.createSignInResult(i, null);
  }
  async deleteUser() {
    let e = H().currentUser;
    if (!e) throw Error(q.ERROR_NO_USER_SIGNED_IN);
    return B(e);
  }
  async fetchSignInMethodsForEmail(e) {
    return { signInMethods: await U(H(), e.email) };
  }
  async getPendingAuthResult() {
    throw this.unimplemented(`Not implemented on web.`);
  }
  async getCurrentUser() {
    let e = H();
    return { user: this.createUserResult(e.currentUser) };
  }
  async getIdToken(e) {
    let t = H();
    if (!t.currentUser) throw Error(q.ERROR_NO_USER_SIGNED_IN);
    return { token: (await t.currentUser.getIdToken(e?.forceRefresh)) || `` };
  }
  async getIdTokenResult(e) {
    let t = H();
    if (!t.currentUser) throw Error(q.ERROR_NO_USER_SIGNED_IN);
    let n = await t.currentUser.getIdTokenResult(e?.forceRefresh);
    return Object.assign(Object.assign({}, n), {
      authTime: Date.parse(n.authTime),
      expirationTime: Date.parse(n.expirationTime),
      issuedAtTime: Date.parse(n.issuedAtTime),
    });
  }
  async getRedirectResult() {
    let e = await g(H()),
      t = e ? M.credentialFromResult(e) : null;
    return this.createSignInResult(e, t);
  }
  async getTenantId() {
    return { tenantId: H().tenantId };
  }
  async isSignInWithEmailLink(e) {
    return { isSignInWithEmailLink: _(H(), e.emailLink) };
  }
  async linkWithApple(e) {
    let t = new M(G.APPLE);
    this.applySignInOptions(e || {}, t);
    let n = await this.linkCurrentUserWithPopupOrRedirect(t, e?.mode),
      r = M.credentialFromResult(n);
    return this.createSignInResult(n, r);
  }
  async linkWithEmailAndPassword(e) {
    let t = k.credential(e.email, e.password),
      n = await this.linkCurrentUserWithCredential(t);
    return this.createSignInResult(n, t);
  }
  async linkWithEmailLink(e) {
    let t = k.credentialWithLink(e.email, e.emailLink),
      n = await this.linkCurrentUserWithCredential(t);
    return this.createSignInResult(n, t);
  }
  async linkWithFacebook(e) {
    let t = new S();
    this.applySignInOptions(e || {}, t);
    let n = await this.linkCurrentUserWithPopupOrRedirect(t, e?.mode),
      r = S.credentialFromResult(n);
    return this.createSignInResult(n, r);
  }
  async linkWithGameCenter() {
    throw this.unimplemented(`Not implemented on web.`);
  }
  async linkWithGithub(e) {
    let t = new P();
    this.applySignInOptions(e || {}, t);
    let n = await this.linkCurrentUserWithPopupOrRedirect(t, e?.mode),
      r = P.credentialFromResult(n);
    return this.createSignInResult(n, r);
  }
  async linkWithGoogle(e) {
    let t = new L();
    this.applySignInOptions(e || {}, t);
    let n = await this.linkCurrentUserWithPopupOrRedirect(t, e?.mode),
      r = L.credentialFromResult(n);
    return this.createSignInResult(n, r);
  }
  async linkWithMicrosoft(e) {
    let t = new M(G.MICROSOFT);
    this.applySignInOptions(e || {}, t);
    let n = await this.linkCurrentUserWithPopupOrRedirect(t, e?.mode),
      r = M.credentialFromResult(n);
    return this.createSignInResult(n, r);
  }
  async linkWithOpenIdConnect(e) {
    let t = new M(e.providerId);
    this.applySignInOptions(e, t);
    let n = await this.linkCurrentUserWithPopupOrRedirect(t, e.mode),
      r = M.credentialFromResult(n);
    return this.createSignInResult(n, r);
  }
  async linkWithPhoneNumber(e) {
    let t = H().currentUser;
    if (!t) throw Error(q.ERROR_NO_USER_SIGNED_IN);
    if (!e.phoneNumber) throw Error(q.ERROR_PHONE_NUMBER_MISSING);
    if (!e.recaptchaVerifier || !(e.recaptchaVerifier instanceof z))
      throw Error(q.ERROR_RECAPTCHA_VERIFIER_MISSING);
    try {
      let n = await r(t, e.phoneNumber, e.recaptchaVerifier),
        { verificationId: i } = n;
      this.lastConfirmationResult.set(i, n);
      let a = { verificationId: i };
      this.notifyListeners(q.PHONE_CODE_SENT_EVENT, a);
    } catch (e) {
      let t = { message: this.getErrorMessage(e) };
      this.notifyListeners(q.PHONE_VERIFICATION_FAILED_EVENT, t);
    }
  }
  async linkWithPlayGames() {
    throw this.unimplemented(`Not implemented on web.`);
  }
  async linkWithTwitter(e) {
    let t = new T();
    this.applySignInOptions(e || {}, t);
    let n = await this.linkCurrentUserWithPopupOrRedirect(t, e?.mode),
      r = T.credentialFromResult(n);
    return this.createSignInResult(n, r);
  }
  async linkWithYahoo(e) {
    let t = new M(G.YAHOO);
    this.applySignInOptions(e || {}, t);
    let n = await this.linkCurrentUserWithPopupOrRedirect(t, e?.mode),
      r = M.credentialFromResult(n);
    return this.createSignInResult(n, r);
  }
  async reload() {
    let t = H().currentUser;
    if (!t) throw Error(q.ERROR_NO_USER_SIGNED_IN);
    return e(t);
  }
  async revokeAccessToken(e) {
    return A(H(), e.token);
  }
  async sendEmailVerification(e) {
    let t = H().currentUser;
    if (!t) throw Error(q.ERROR_NO_USER_SIGNED_IN);
    return d(t, e?.actionCodeSettings);
  }
  async sendPasswordResetEmail(e) {
    return f(H(), e.email, e.actionCodeSettings);
  }
  async sendSignInLinkToEmail(e) {
    return m(H(), e.email, e.actionCodeSettings);
  }
  async setLanguageCode(e) {
    let t = H();
    t.languageCode = e.languageCode;
  }
  async setPersistence(e) {
    let t = H();
    switch (e.persistence) {
      case K.BrowserLocal:
        await a(t, F);
        break;
      case K.BrowserSession:
        await a(t, N);
        break;
      case K.IndexedDbLocal:
        await a(t, V);
        break;
      case K.InMemory:
        await a(t, n);
        break;
    }
  }
  async setTenantId(e) {
    let t = H();
    t.tenantId = e.tenantId;
  }
  async signInAnonymously() {
    let e = await c(H());
    return this.createSignInResult(e, null);
  }
  async signInWithApple(e) {
    let t = new M(G.APPLE);
    this.applySignInOptions(e || {}, t);
    let n = await this.signInWithPopupOrRedirect(t, e?.mode),
      r = M.credentialFromResult(n);
    return this.createSignInResult(n, r);
  }
  async signInWithCustomToken(e) {
    let t = await u(H(), e.token);
    return this.createSignInResult(t, null);
  }
  async signInWithEmailAndPassword(e) {
    let t = await h(H(), e.email, e.password);
    return this.createSignInResult(t, null);
  }
  async signInWithEmailLink(e) {
    let t = await W(H(), e.email, e.emailLink);
    return this.createSignInResult(t, null);
  }
  async signInWithFacebook(e) {
    let t = new S();
    this.applySignInOptions(e || {}, t);
    let n = await this.signInWithPopupOrRedirect(t, e?.mode),
      r = S.credentialFromResult(n);
    return this.createSignInResult(n, r);
  }
  async signInWithGithub(e) {
    let t = new P();
    this.applySignInOptions(e || {}, t);
    let n = await this.signInWithPopupOrRedirect(t, e?.mode),
      r = P.credentialFromResult(n);
    return this.createSignInResult(n, r);
  }
  async signInWithGoogle(e) {
    let t = new L();
    this.applySignInOptions(e || {}, t);
    let n = await this.signInWithPopupOrRedirect(t, e?.mode),
      r = L.credentialFromResult(n);
    return this.createSignInResult(n, r);
  }
  async signInWithMicrosoft(e) {
    let t = new M(G.MICROSOFT);
    this.applySignInOptions(e || {}, t);
    let n = await this.signInWithPopupOrRedirect(t, e?.mode),
      r = M.credentialFromResult(n);
    return this.createSignInResult(n, r);
  }
  async signInWithOpenIdConnect(e) {
    let t = new M(e.providerId);
    this.applySignInOptions(e, t);
    let n = await this.signInWithPopupOrRedirect(t, e.mode),
      r = M.credentialFromResult(n);
    return this.createSignInResult(n, r);
  }
  async signInWithPhoneNumber(e) {
    if (!e.phoneNumber) throw Error(q.ERROR_PHONE_NUMBER_MISSING);
    if (!e.recaptchaVerifier || !(e.recaptchaVerifier instanceof z))
      throw Error(q.ERROR_RECAPTCHA_VERIFIER_MISSING);
    let n = H();
    try {
      let r = await t(n, e.phoneNumber, e.recaptchaVerifier),
        { verificationId: i } = r;
      this.lastConfirmationResult.set(i, r);
      let a = { verificationId: i };
      this.notifyListeners(q.PHONE_CODE_SENT_EVENT, a);
    } catch (e) {
      let t = { message: this.getErrorMessage(e) };
      this.notifyListeners(q.PHONE_VERIFICATION_FAILED_EVENT, t);
    }
  }
  async signInWithPlayGames() {
    throw this.unimplemented(`Not implemented on web.`);
  }
  async signInWithGameCenter() {
    throw this.unimplemented(`Not implemented on web.`);
  }
  async signInWithTwitter(e) {
    let t = new T();
    this.applySignInOptions(e || {}, t);
    let n = await this.signInWithPopupOrRedirect(t, e?.mode),
      r = T.credentialFromResult(n);
    return this.createSignInResult(n, r);
  }
  async signInWithYahoo(e) {
    let t = new M(G.YAHOO);
    this.applySignInOptions(e || {}, t);
    let n = await this.signInWithPopupOrRedirect(t, e?.mode),
      r = M.credentialFromResult(n);
    return this.createSignInResult(n, r);
  }
  async signOut() {
    await H().signOut();
  }
  async unlink(e) {
    let t = H();
    if (!t.currentUser) throw Error(q.ERROR_NO_USER_SIGNED_IN);
    let n = await v(t.currentUser, e.providerId);
    return { user: this.createUserResult(n) };
  }
  async updateEmail(e) {
    let t = H().currentUser;
    if (!t) throw Error(q.ERROR_NO_USER_SIGNED_IN);
    return b(t, e.newEmail);
  }
  async updatePassword(e) {
    let t = H().currentUser;
    if (!t) throw Error(q.ERROR_NO_USER_SIGNED_IN);
    return o(t, e.newPassword);
  }
  async updateProfile(e) {
    let t = H().currentUser;
    if (!t) throw Error(q.ERROR_NO_USER_SIGNED_IN);
    return l(t, { displayName: e.displayName, photoURL: e.photoUrl });
  }
  async useAppLanguage() {
    H().useDeviceLanguage();
  }
  async useEmulator(e) {
    let t = H(),
      n = e.port || 9099,
      r = e.scheme || `http`;
    e.host.includes(`://`) ? D(t, `${e.host}:${n}`) : D(t, `${r}://${e.host}:${n}`);
  }
  async verifyBeforeUpdateEmail(e) {
    let t = H().currentUser;
    if (!t) throw Error(q.ERROR_NO_USER_SIGNED_IN);
    return I(t, e?.newEmail, e?.actionCodeSettings);
  }
  handleAuthStateChange(e) {
    let t = { user: this.createUserResult(e) };
    this.notifyListeners(q.AUTH_STATE_CHANGE_EVENT, t, !0);
  }
  async handleIdTokenChange(e) {
    if (!e) return;
    let t = { token: await e.getIdToken(!1) };
    this.notifyListeners(q.ID_TOKEN_CHANGE_EVENT, t, !0);
  }
  applySignInOptions(e, t) {
    if (e.customParameters) {
      let n = {};
      (e.customParameters.map((e) => {
        n[e.key] = e.value;
      }),
        t.setCustomParameters(n));
    }
    if (e.scopes) for (let n of e.scopes) t.addScope(n);
  }
  signInWithPopupOrRedirect(e, t) {
    let n = H();
    return t === `redirect` ? s(n, e) : y(n, e);
  }
  linkCurrentUserWithPopupOrRedirect(e, t) {
    let n = H();
    if (!n.currentUser) throw Error(q.ERROR_NO_USER_SIGNED_IN);
    return t === `redirect` ? j(n.currentUser, e) : p(n.currentUser, e);
  }
  linkCurrentUserWithCredential(e) {
    let t = H();
    if (!t.currentUser) throw Error(q.ERROR_NO_USER_SIGNED_IN);
    return i(t.currentUser, e);
  }
  requestAppTrackingTransparencyPermission() {
    throw this.unimplemented(`Not implemented on web.`);
  }
  checkAppTrackingTransparencyPermission() {
    throw this.unimplemented(`Not implemented on web.`);
  }
  createSignInResult(e, t) {
    return {
      user: this.createUserResult(e?.user || null),
      credential: this.createCredentialResult(t),
      additionalUserInfo: this.createAdditionalUserInfoResult(e),
    };
  }
  createCredentialResult(e) {
    if (!e) return null;
    let t = { providerId: e.providerId };
    return (
      e instanceof w && ((t.accessToken = e.accessToken), (t.idToken = e.idToken), (t.secret = e.secret)),
      t
    );
  }
  createUserResult(e) {
    return e
      ? {
          displayName: e.displayName,
          email: e.email,
          emailVerified: e.emailVerified,
          isAnonymous: e.isAnonymous,
          metadata: this.createUserMetadataResult(e.metadata),
          phoneNumber: e.phoneNumber,
          photoUrl: e.photoURL,
          providerData: this.createUserProviderDataResult(e.providerData),
          providerId: e.providerId,
          tenantId: e.tenantId,
          uid: e.uid,
        }
      : null;
  }
  createUserMetadataResult(e) {
    let t = {};
    return (
      e.creationTime && (t.creationTime = Date.parse(e.creationTime)),
      e.lastSignInTime && (t.lastSignInTime = Date.parse(e.lastSignInTime)),
      t
    );
  }
  createUserProviderDataResult(e) {
    return e.map((e) => ({
      displayName: e.displayName,
      email: e.email,
      phoneNumber: e.phoneNumber,
      photoUrl: e.photoURL,
      providerId: e.providerId,
      uid: e.uid,
    }));
  }
  createAdditionalUserInfoResult(e) {
    if (!e) return null;
    let t = C(e);
    if (!t) return null;
    let { isNewUser: n, profile: r, providerId: i, username: a } = t,
      o = { isNewUser: n };
    return (
      i !== null && (o.providerId = i),
      r !== null && (o.profile = r),
      a != null && (o.username = a),
      o
    );
  }
  getErrorMessage(e) {
    return e instanceof Object && `message` in e && typeof e.message == `string`
      ? e.message
      : JSON.stringify(e);
  }
};
((q.AUTH_STATE_CHANGE_EVENT = `authStateChange`),
  (q.ID_TOKEN_CHANGE_EVENT = `idTokenChange`),
  (q.PHONE_CODE_SENT_EVENT = `phoneCodeSent`),
  (q.PHONE_VERIFICATION_FAILED_EVENT = `phoneVerificationFailed`),
  (q.ERROR_NO_USER_SIGNED_IN = `No user is signed in.`),
  (q.ERROR_PHONE_NUMBER_MISSING = `phoneNumber must be provided.`),
  (q.ERROR_RECAPTCHA_VERIFIER_MISSING = `recaptchaVerifier must be provided and must be an instance of RecaptchaVerifier.`),
  (q.ERROR_CONFIRMATION_RESULT_MISSING = `No confirmation result with this verification id was found.`));
export { q as FirebaseAuthenticationWeb };
