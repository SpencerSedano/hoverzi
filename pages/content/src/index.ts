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

      // Match u: or v, g means global (replace all occurrences)
      const normalized = word.replace(/u:|v/g, "ü");

      const cleanWord = normalized.replace(/[1-5]/, "");

      // Determine the vowel that should get the tone
      const priority = ["a", "o", "e"];
      let target = priority.find(v => cleanWord.includes(v));

      if (!target && cleanWord.includes("iu")) {
        target = "u";
      } else if (!target && cleanWord.includes("ui")) {
        target = "i";
      } else if (!target) {
        target = cleanWord.split("").find(l => "aeiouü".includes(l));
      }

      //TODO - Change the color according to the tone

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

/* SELECT WORD FUNCTION */

function selectWord(node: Text, start: number, end: number) {
  const range = document.createRange();
  const selection = window.getSelection();
  if (!selection) return;

  const clampedEnd = Math.min(end, node.length);

  //FIXME - removeAllRanges should be with mouseout, not mouseover

  selection.removeAllRanges();
  range.setStart(node, start);
  range.setEnd(node, clampedEnd);
  selection.addRange(range);
}

/* SELECT WORD FUNCTION */

function showPopupAtSelection(event: MouseEvent, traditional: string, pinyin: string, definition: string) {
  const existingPopup = document.querySelector(".custom-popup");
  if (existingPopup) existingPopup.remove();

  // TODO - Style it as Figma
  const popupParent = document.createElement("div");
  const popup = document.createElement("div");

  /* Popup Child */

  // popup.className = "custom-popup";

  popup.innerHTML = `<span style="font-size: 24px">${traditional}</span> ${pinyin} <br>${definition}`;
  popup.style.backgroundColor = "#ffffff";
  popup.style.padding = "10px";
  popup.style.borderRadius = "15px";
  popup.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.2)";

  /* Popup Child */

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
    if (rects.length > 0) {
      const rect = rects[0];
      popupParent.style.left = `${window.scrollX + rect.left}px`;
      popupParent.style.top = `${window.scrollY + rect.top + 40}px`;
    }
  }
  if (!selection) {
    popupParent.style.display = "none";
  }

  document.body.appendChild(popupParent);
  // setTimeout(() => popupParent.remove(), 4000);
}

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

let rawDataCache: { traditional: string; pinyin: string; english: string }[] | null = null;
let lastTarget: Node | null = null;
let lastIndex: number | null = null;

/* MOUSEMOVE STARTS HERE */

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

    // if (offset >= text.length || !isChinese(text[offset])) return;

    // if (lastTarget === textNode && lastIndex === offset) return;

    lastTarget = textNode;
    lastIndex = offset;

    try {
      if (!rawDataCache) {
        rawDataCache = await sendMessageAsync<{ traditional: string; pinyin: string; english: string }[]>({
          type: "RAWDATA",
        });
      }

      const maxLength = 10;
      let matchedWord = "";
      let matchedTraditional = "";
      let matchedPinyin = "";
      let matchedDef = "";
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
          matchedDef = entry.english;
          matchedLength = len;
          break;
        }
      }

      if (matchedWord && matchedLength > 0) {
        selectWord(textNode, offset, offset + matchedLength);
        showPopupAtSelection(event, matchedTraditional, matchedPinyin, matchedDef);
      } else {
        selectWord(textNode, offset, offset + 1);
        const charEntry = rawDataCache.find(e => e.traditional === text[offset]);
        if (charEntry) {
          showPopupAtSelection(event, matchedTraditional, matchedPinyin, charEntry.english);
        }
      }
    } catch (error) {
      console.error("Error loading or processing dictionary:", error);
    }
  };

  handleMouseMove();
});

/* MOUSEMOVE STARTS HERE */
