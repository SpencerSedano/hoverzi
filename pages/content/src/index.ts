function isChinese(char: string): boolean {
  return /[\u4e00-\u9fff]/.test(char);
}

function convertPinyinTones(input: string) {
  const toneMarks: { [key: string]: string[] } = {
    a: ["ā", "á", "ǎ", "à"],
    o: ["ō", "ó", "ǒ", "ò"],
    e: ["ē", "é", "ě", "è"],
    i: ["ī", "í", "ǐ", "ì"],
    u: ["ū", "ú", "ǔ", "ù"],
    ü: ["ǖ", "ǘ", "ǚ", "ǜ"],
  };

  const toneColors = ["#D65A31", "#E3B34E", "#3A506B", "#6A994E"];

  return input
    .split(" ")
    .map(word => {
      const toneMatch = word.match(/[1-5]/);
      if (!toneMatch) return word; // No tone number, return as is

      const toneNumber = parseInt(toneMatch[0], 10);
      const toneIndex = toneNumber - 1; // 1 → 0th index, etc.

      // Match u:, /g means global (replace all occurrences)
      const normalized = word.replace(/u:/g, "ü");

      // No numbers within the word, check data.json for more understanding
      const cleanWord = normalized.replace(/[1-5]/, "");

      // Determine the vowel that should get the tone
      // There is actually a rule to determine which one will have the tone
      const priority = ["a", "o", "e"];
      let target = priority.find(v => cleanWord.includes(v));

      if (!target && cleanWord.includes("iu")) {
        target = "u";
      } else if (!target && cleanWord.includes("ui")) {
        target = "i";
      } else if (!target) {
        target = cleanWord.split("").find(l => "aeiouü".includes(l));
      }

      // Tone 1, 2, 3, 4: red, yellow, blue, green

      // Replace the target vowel with the tone-marked version
      const result = cleanWord
        .split("")
        .map(char => {
          if (char === target && toneIndex < 4) {
            return toneMarks[char]?.[toneIndex] || char;
          }
          return char;
        })
        .join("");

      const color = toneColors[toneIndex] || "black";
      return `<span style="color: ${color}; font-weight: bold; font-size: 24px">${result}</span>`;
    })
    .join("");
}

function clearSelectionAndPopup() {
  const selection = window.getSelection();
  if (selection) selection.removeAllRanges();

  const popup = document.querySelector(".custom-popup");
  if (popup) popup.remove();
}

/* SELECT WORD FUNCTION */
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

/* SHOW POPUP FUNCTION */
function showPopupAtSelection(event: MouseEvent, traditional: string, pinyin: string, definition: string) {
  const existingPopup = document.querySelector(".custom-popup");
  if (existingPopup) existingPopup.remove(); // Don't let having duplicates, but still have 1 popup

  // TODO - Style it as Figma
  const popupParent = document.createElement("div");
  const popup = document.createElement("div");

  /* Popup Child */

  // popup.className = "custom-popup";

  popup.innerHTML = `<span style="font-size: 24px; color: black">${traditional}</span> ${pinyin} <br> <span style="color: black">${definition}<span>`;
  popup.style.backgroundColor = "#ffffff";
  popup.style.padding = "10px";
  popup.style.borderRadius = "15px";
  popup.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.2)";

  /* Popup Parent */

  popupParent.className = "custom-popup";
  popupParent.style.position = "absolute";
  popupParent.style.backgroundColor = "#393E46";
  popupParent.style.padding = "5px 8px 12px 8px";
  popupParent.style.borderRadius = "15px";

  popupParent.style.zIndex = "10000";

  popupParent.appendChild(popup);

  /* Popup Parent */

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const rects = selection.getRangeAt(0).getClientRects();
    console.log("Popup parent rects: ", rects);

    if (rects.length > 0) {
      const rect = rects[0];
      popupParent.style.left = `${window.scrollX + rect.left}px`;
      popupParent.style.top = `${window.scrollY + (rect.top + rect.height)}px`;
    }
  }

  document.body.appendChild(popupParent);
  // setTimeout(() => popupParent.remove(), 4000);
}

/* SEND MESSAGE TO BACKGROUND.ts */

function sendMessageAsync<T = unknown>(message: object): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!chrome?.runtime?.sendMessage) {
      reject(new Error("chrome.runtime.sendMessage is not available"));
      return;
    }

    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

function isPointOverText(x: number, y: number): boolean {
  const element = document.elementFromPoint(x, y);
  if (!element) return false;

  const computedStyle = window.getComputedStyle(element);
  const fontSize = parseFloat(computedStyle.fontSize);

  if (fontSize === 0) return false;

  return (
    element.tagName !== "IMG" &&
    element.tagName !== "VIDEO" &&
    !element.hasAttribute("contenteditable") &&
    computedStyle.display !== "none" &&
    computedStyle.visibility !== "hidden"
  );
}

function getActualCharacterAtPoint(x: number, y: number): { node: Text; offset: number; char: string } | null {
  if (!document.caretPositionFromPoint) return null;

  const position = document.caretPositionFromPoint(x, y);
  if (!position || position.offsetNode.nodeType !== Node.TEXT_NODE) return null;

  const textNode = position.offsetNode as Text;
  const text = textNode.textContent || "";
  const offset = Math.min(position.offset, text.length - 1);

  if (offset < 0 || offset >= text.length) return null;

  const char = text[offset];
  if (!char || char.trim() === "") return null;

  const range = document.createRange();
  range.setStart(textNode, offset);
  range.setEnd(textNode, offset + 1);
  const rect = range.getBoundingClientRect();
  // console.log("testing now", rect);

  const toleranceX = rect.width * 0.8;
  const toleranceY = rect.height * 0.4;
  const isWithinBounds =
    x >= rect.left - toleranceX &&
    x <= rect.right + toleranceX &&
    y >= rect.top - toleranceY &&
    y <= rect.bottom + toleranceY;

  return isWithinBounds ? { node: textNode, offset, char } : null;
}

let rawDataCache: { traditional: string; pinyin: string; english: string[] }[] | null = null;
let lastTarget: Node | null = null;
let lastIndex: number | null = null;
let isHoverSelection = false;

/* MOUSEMOVE STARTS HERE */

document.addEventListener("mousemove", async (event: MouseEvent) => {
  //FIXME - Let users select without remove their selection
  const handleMouseMove = async () => {
    // if (!isPointOverText(event.clientX, event.clientY)) {
    //   if (isHoverSelection) {
    //     clearSelectionAndPopup();
    //     lastTarget = null;
    //     lastIndex = null;
    //     isHoverSelection = false;
    //   }
    //   return;
    // }

    const charInfo = getActualCharacterAtPoint(event.clientX, event.clientY);
    if (!charInfo) {
      if (isHoverSelection) {
        clearSelectionAndPopup();
        lastTarget = null;
        lastIndex = null;
        isHoverSelection = false;
      }
      return;
    }

    const { node: textNode, offset, char } = charInfo;

    if (!isChinese(char)) {
      if (isHoverSelection) {
        clearSelectionAndPopup();
        lastTarget = null;
        lastIndex = null;
        isHoverSelection = false;
      }
      return;
    }

    if (lastTarget === textNode && lastIndex === offset) return;

    lastTarget = textNode;
    lastIndex = offset;

    try {
      if (!rawDataCache) {
        rawDataCache = await sendMessageAsync<{ traditional: string; pinyin: string; english: string[] }[]>({
          type: "RAWDATA",
        });
      }

      const maxLength = 10;
      const text = textNode.textContent || "";

      let matchedWord = "";
      let matchedTraditional = "";
      let matchedPinyin = "";
      let matchedDef: string[];
      let matchedEnglish = "";
      let matchedLength = 0;

      for (let len = maxLength; len > 0; len--) {
        const end = offset + len;

        if (end > text.length) continue;

        const candidate = text.slice(offset, end);

        // find is o(n)
        // Map is o(1)
        // const entryMap = new Map(rawDataCache.map(e => [e.traditional, e]));
        // const entry = entryMap.get(candidate);

        const entry = rawDataCache.find(e => e.traditional === candidate);

        if (entry) {
          matchedWord = candidate;
          matchedTraditional = entry.traditional;
          matchedPinyin = convertPinyinTones(entry.pinyin);
          matchedDef = entry.english.slice(0, 2);
          matchedEnglish = matchedDef.join(", ");
          matchedLength = len;
          break;
        }
      }

      if (matchedWord && matchedLength > 0) {
        isHoverSelection = true;
        selectWord(textNode, offset, offset + matchedLength);
        showPopupAtSelection(event, matchedTraditional, matchedPinyin, matchedEnglish);
        // const selection = window.getSelection();
        // const getRange = selection?.getRangeAt(0);
        // const getRect = getRange?.getBoundingClientRect();
        // // console.log(getRect);
      } else {
        isHoverSelection = true;

        selectWord(textNode, offset, offset + 1);
        // const selection = window.getSelection();
        // const getRange = selection?.getRangeAt(0);
        // const getRect = getRange?.getBoundingClientRect();
        // console.log(getRect);
        const charEntry = rawDataCache.find(e => e.traditional === text[offset]);
        if (charEntry) {
          showPopupAtSelection(event, matchedTraditional, matchedPinyin, charEntry.english[0]);
        } else {
          return;
        }
      }
    } catch (error) {
      console.error("Error loading or processing dictionary:", error);
    }
  };

  handleMouseMove();
});

/* MOUSEMOVE LEAVE HERE */
document.addEventListener("mouseleave", () => {
  clearSelectionAndPopup();
});
