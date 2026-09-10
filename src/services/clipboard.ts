export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard && window?.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    if (typeof document === "undefined") {
      return false;
    }

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    const copied = document.execCommand("copy");
    document.body.removeChild(textArea);
    return copied;
  } catch {
    return false;
  }
}
