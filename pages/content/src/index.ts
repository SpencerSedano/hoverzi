function isChinese(char: string): boolean {
  return /[\u4e00-\u9fff]/.test(char);
}

function selectWord(node: Text, start: number, end: number) {
  const range = document.createRange();
  const selection = window.getSelection();
  if (!selection) return;

  const clampedEnd = Math.min(end, node.length);

  selection.removeAllRanges();
  range.setStart(node, start);
  range.setEnd(node, clampedEnd);
  selection.addRange(range);
}

function showPopupAtSelection(event: MouseEvent, definition: string) {
  const existingPopup = document.querySelector(".custom-popup");
  if (existingPopup) existingPopup.remove();

  const popup = document.createElement("div");
  popup.className = "custom-popup";
  popup.textContent = definition;
  popup.style.position = "absolute";
  popup.style.backgroundColor = "#f0f0f0";
  popup.style.border = "1px solid #ccc";
  popup.style.padding = "6px 10px";
  popup.style.borderRadius = "6px";
  popup.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.2)";
  popup.style.zIndex = "10000";

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const rects = selection.getRangeAt(0).getClientRects();
    if (rects.length > 0) {
      const rect = rects[0];
      popup.style.left = `${window.scrollX + rect.left}px`;
      popup.style.top = `${window.scrollY + rect.top - 60}px`;
    }
  }

  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 4000);
}

function sendMessageAsync<T = unknown>(message: object): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

let rawDataCache: { traditional: string; english: string }[] | null = null;
let lastTarget: Node | null = null;
let lastIndex: number | null = null;

document.addEventListener("mousemove", async (event: MouseEvent) => {
  const handleMouseMove = async () => {
    let range: Range | null = null;

    if (document.caretPositionFromPoint) {
      const position = document.caretPositionFromPoint(event.clientX, event.clientY);
      if (position) {
        range = document.createRange();
        range.setStart(position.offsetNode, position.offset);
        range.setEnd(position.offsetNode, position.offset);
      }
    }

    if (!range || range.startContainer.nodeType !== Node.TEXT_NODE) return;

    const textNode = range.startContainer as Text;
    const offset = range.startOffset;
    const text = textNode.textContent || "";

    if (offset >= text.length || !isChinese(text[offset])) return;

    if (lastTarget === textNode && lastIndex === offset) return;

    lastTarget = textNode;
    lastIndex = offset;

    try {
      if (!rawDataCache) {
        rawDataCache = await sendMessageAsync<{ traditional: string; english: string }[]>({ type: "RAWDATA" });
      }

      const maxLength = 10;
      let matchedWord = "";
      let matchedDef = "";
      let matchedLength = 0;

      for (let len = maxLength; len > 0; len--) {
        const end = offset + len;
        if (end > text.length) continue;

        const candidate = text.slice(offset, end);
        const entry = rawDataCache.find(e => e.traditional === candidate);
        if (entry) {
          matchedWord = candidate;
          matchedDef = entry.english;
          matchedLength = len;
          break;
        }
      }

      if (matchedWord && matchedLength > 0) {
        selectWord(textNode, offset, offset + matchedLength);
        showPopupAtSelection(event, matchedDef);
      } else {
        selectWord(textNode, offset, offset + 1);
        const charEntry = rawDataCache.find(e => e.traditional === text[offset]);
        if (charEntry) {
          showPopupAtSelection(event, charEntry.english);
        }
      }
    } catch (error) {
      console.error("Error loading or processing dictionary:", error);
    }
  };

  handleMouseMove();
});
