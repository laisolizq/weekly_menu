export type PwaInstallState = {
  installed: boolean;
  installable: boolean;
};

export function getPwaInstallState(): PwaInstallState {
  const nav = globalThis.navigator;
  const win = globalThis.window;

  const userAgent = nav?.userAgent?.toLowerCase?.() ?? "";
  const isMobile = /android|iphone|ipad|ipod|mobile/.test(userAgent);
  const isStandalone =
    !!win?.matchMedia?.('(display-mode: standalone)')?.matches ||
    (nav as Navigator & { standalone?: boolean } | undefined)?.standalone === true;

  const installed = isStandalone;
  const installable = isMobile && !installed;

  return { installed, installable };
}
