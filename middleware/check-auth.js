import { getUserFromCookie, getUserFromLocalStorage } from "~/utils";

export default function({ store, req }) {
  if (process.server && !req) return;

  const userData = process.server
    ? getUserFromCookie(req)
    : getUserFromLocalStorage();

  if (!userData) {
    return;
  } else if (!userData.jwt || Date.now() > userData.expiresIn) {
    store.commit("clearToken");
    store.commit("clearUser");
    return;
  } else {
    const timeToClearToken = userData.expiresIn - Date.now();
    store.commit("setToken", userData.jwt);
    store.commit("setUser", { email: userData.user, avatar: userData.avatar });
    store.dispatch("setLogoutTimer", timeToClearToken);
  }
}
