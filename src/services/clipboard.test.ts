import { beforeEach, describe, expect, it, vi } from "vitest";
import { copyTextToClipboard } from "./clipboard";

describe("copyTextToClipboard", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as { navigator?: Navigator }).navigator;
    delete (globalThis as { document?: Document }).document;
    delete (globalThis as { window?: Window }).window;
  });

  it("uses navigator.clipboard when it is available in a secure context", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(globalThis, "navigator", {
      value: {
        clipboard: { writeText },
      },
      configurable: true,
    });

    Object.defineProperty(globalThis, "window", {
      value: { isSecureContext: true },
      configurable: true,
    });

    await expect(copyTextToClipboard("hola")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("hola");
  });

  it("falls back to document.execCommand when clipboard is unavailable", async () => {
    const execCommand = vi.fn().mockReturnValue(true);

    Object.defineProperty(globalThis, "navigator", {
      value: { clipboard: undefined },
      configurable: true,
    });

    Object.defineProperty(globalThis, "document", {
      value: {
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn(),
        },
        createElement: vi.fn(() => ({
          value: "",
          style: {},
          setAttribute: vi.fn(),
          focus: vi.fn(),
          select: vi.fn(),
          setSelectionRange: vi.fn(),
        })),
        execCommand,
      },
      configurable: true,
    });

    Object.defineProperty(globalThis, "window", {
      value: { isSecureContext: false },
      configurable: true,
    });

    await expect(copyTextToClipboard("lista")).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
  });
});
