const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "assets/web-BEr94HqL.js",
      "assets/index-BLMBGPAE.js",
      "assets/index-nqMpL4T3.css",
      "assets/definitions-DEpMNQg8.js",
    ]),
) => i.map((i) => d[i]);
import { n as e, r as t } from "./index-BLMBGPAE.js";
import "./definitions-DEpMNQg8.js";
var n = e(`FirebaseAuthentication`, {
  web: () =>
    t(
      () => import(`./web-BEr94HqL.js`).then((e) => new e.FirebaseAuthenticationWeb()),
      __vite__mapDeps([0, 1, 2, 3]),
    ),
});
export { n as FirebaseAuthentication };
