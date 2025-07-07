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

let userIsSelecting = false;
let hoverActive = false;

function clearHoverOnlySelection() {
  if (!hoverActive) return;

  const selection = window.getSelection();
  if (selection && !userIsSelecting) {
    selection.removeAllRanges();
  }

  const popup = document.querySelector(".custom-popup");
  if (popup) popup.remove();

  hoverActive = false;
}

// function clearSelectionAndPopup() {
//   const selection = window.getSelection();
//   if (selection) selection.removeAllRanges();

//   const popup = document.querySelector(".custom-popup");
//   if (popup) popup.remove();
// }

/* SELECT WORD FUNCTION */
function selectWord(node: Text, start: number, end: number) {
  if (userIsSelecting) return; // Don't interfere with user selection

  const range = document.createRange();
  const selection = window.getSelection();
  if (!selection) return;

  const clampedEnd = Math.min(end, node.length);
  selection.removeAllRanges();
  range.setStart(node, start);
  range.setEnd(node, clampedEnd);
  selection.addRange(range);

  hoverActive = true;
}

/* SHOW POPUP FUNCTION */
function showPopupAtSelection(
  event: MouseEvent,
  traditional: string,
  pinyin: string,
  definition: string,
  star: string,
) {
  const existingPopup = document.querySelector(".custom-popup");
  if (existingPopup) existingPopup.remove(); // Don't let having duplicates, but still have 1 popup

  // TODO - Style it as Figma
  const popupParent = document.createElement("div");
  const popup = document.createElement("div");

  const startWhiteSvg = `<svg width="30" height="31" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.  org/2000/svg">
<path d="M9.87 2.96239C10.1875 1.5358 11.8775 0.920678 13.0378 1.80941L17.3941 5.14671C18.1962 5.76123 19.2017 6.04885 20.2076 5.95277L25.6704 5.43187C27.1253 5.29296 28.2327 6.71011 27.7461 8.08819L25.9184 13.2627C25.5818 14.2154 25.6183 15.2604 26.0205 16.1873L28.205 21.2213C28.7868 22.5622 27.7803 24.0545 26.3191 24.0174L20.833 23.8775C19.8231 23.8519 18.8408 24.2094 18.0836 24.8782L13.9709 28.5117C12.8755 29.4794 11.1451 28.9832 10.7289 27.5821L9.1666 22.3216C8.87887 21.3531 8.23515 20.5291 7.36493 20.0156L2.63869 17.2265C1.38011 16.4837 1.31751 14.6862 2.52131 13.8575L7.0409 10.7451C7.8732 10.1721 8.45861 9.30542 8.67806 8.31908L9.87 2.96239Z" fill="white" stroke="#FFD369" stroke-width="2"/>
</svg>
`;

  const starYellowSvg = `<svg width="30" height="31" viewBox="0 0 30 31" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.87 2.96239C10.1875 1.5358 11.8775 0.920678 13.0378 1.80941L17.3941 5.14671C18.1962 5.76123 19.2017 6.04885 20.2076 5.95277L25.6704 5.43187C27.1253 5.29296 28.2327 6.71011 27.7461 8.08819L25.9184 13.2627C25.5818 14.2154 25.6183 15.2604 26.0205 16.1873L28.205 21.2213C28.7868 22.5622 27.7803 24.0545 26.3191 24.0174L20.833 23.8775C19.8231 23.8519 18.8408 24.2094 18.0836 24.8782L13.9709 28.5117C12.8755 29.4794 11.1451 28.9832 10.7289 27.5821L9.1666 22.3216C8.87887 21.3531 8.23515 20.5291 7.36493 20.0156L2.63869 17.2265C1.38011 16.4837 1.31751 14.6862 2.52131 13.8575L7.0409 10.7451C7.8732 10.1721 8.45861 9.30542 8.67806 8.31908L9.87 2.96239Z" fill="#FFD369" stroke="#FFD369" stroke-width="2"/>
</svg>
`;

  /* Popup Child */

  // popup.className = "custom-popup";

  popup.innerHTML = `<span style="font-size: 24px; color: black">${traditional}</span> ${pinyin} <span>${startWhiteSvg}</span> <br> <span style="color: black">${definition}<span>`;
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
    // console.log("Popup parent rects: ", rects);

    if (rects.length > 0) {
      const rect = rects[0];
      popupParent.style.left = `${window.scrollX + rect.left}px`;
      popupParent.style.top = `${window.scrollY + (rect.top + (rect.height + 10))}px`;
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

  const toleranceX = rect.width * 0.6;
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
// let isHoverSelection = false;

/* MOUSEMOVE STARTS HERE */

document.addEventListener("mousemove", async (event: MouseEvent) => {
  if (userIsSelecting) return; // Skip while user is selecting

  const charInfo = getActualCharacterAtPoint(event.clientX, event.clientY);

  if (!charInfo) {
    clearHoverOnlySelection();
    lastTarget = null;
    lastIndex = null;
    return;
  }

  const { node: textNode, offset, char } = charInfo;

  if (!isChinese(char)) {
    clearHoverOnlySelection();
    lastTarget = null;
    lastIndex = null;
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
      selectWord(textNode, offset, offset + matchedLength);
      showPopupAtSelection(event, matchedTraditional, matchedPinyin, matchedEnglish);
    } else {
      selectWord(textNode, offset, offset + 1);
      const charEntry = rawDataCache.find(e => e.traditional === text[offset]);
      if (charEntry) {
        showPopupAtSelection(event, text[offset], "", charEntry.english[0]);
      }
    }
  } catch (error) {
    console.error("Error loading or processing dictionary:", error);
  }
});

/* MOUSEMOVE LEAVE HERE */

// Track when user starts selecting
document.addEventListener("mousedown", () => {
  userIsSelecting = true;
  clearHoverOnlySelection();
});

// Track when user finishes selecting
document.addEventListener("mouseup", () => {
  setTimeout(() => {
    userIsSelecting = false;
  }, 100); // Small delay to let selection complete
});

// Clear popup when clicking elsewhere (but not during selection)
document.addEventListener("click", event => {
  if (!userIsSelecting && !(event.target as Element).closest(".custom-popup")) {
    const popup = document.querySelector(".custom-popup");
    if (popup) popup.remove();
  }
});
