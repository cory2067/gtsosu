import { User } from "./models/user";
import { get } from "./utilities";

export function showAuthPopup(
  authEndpoint: string,
  setUser: (user: User | undefined) => void
): Promise<User> {
  const width = 600;
  const height = 600;
  const left = window.innerWidth / 2 - width / 2;
  const top = window.innerHeight / 2 - height / 2;

  const popup = window.open(
    authEndpoint,
    "",
    `toolbar=no, location=no, directories=no, status=no, menubar=no,
      scrollbars=no, resizable=no, copyhistory=no, width=${width},
      height=${height}, top=${top}, left=${left}`
  );

  return new Promise<User>((resolve, reject) => {
    const loop = setInterval(async () => {
      if (popup.closed) {
        clearInterval(loop);
        const userData = await get("/api/whoami");
        setUser(userData as User);

        if (userData._id) {
          resolve(userData);
        } else {
          reject("User didn't complete login flow");
        }
      }
    }, 50);
  });
}

export async function logout(setUser: (user: User | undefined) => void) {
  await fetch("/auth/logout");
  setUser(undefined);
}

export function login(setUser: (user: User | undefined) => void) {
  return showAuthPopup("/auth/login", setUser);
}
