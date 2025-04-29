// import { sampleFunction } from "@src/sampleFunction";

// console.log("content script loaded");

// Shows how to call a function defined in another module
// sampleFunction();

//Start my app

// interface CEDICTEntry {
//   simplified: string;
//   traditional: string;
//   pinyin: string;
//   definitions: string[];
// }

// let cedictData: CEDICTEntry[] | null = null;

// async function loadCEDICT() {
//   // If data is already cached, return it directly
//   if (cedictData) {
//     console.log("Using cached CEDICT entries");
//     return cedictData;
//   }

//   try {
//     const res = await fetch(chrome.runtime.getURL("public/cedict_ts.json"));
//     console.log(`this is res ${res}`);
//     if (!res.ok) {
//       throw new Error(`Failed to fetch CEDICT: ${res.statusText}`);
//     }

//     const data = await res.json();
//     cedictData = data; // Cache the data for later use
//     console.log("CEDICT entries:", data.slice(0, 5)); // Print first 5 entries
//     return cedictData;
//   } catch (error) {
//     console.error("Error loading CEDICT:", error);
//     return []; // Return an empty array in case of error
//   }
// }

function isChinese(char: string): boolean {
  const regex = /[\u4e00-\u9fff]/;
  return regex.test(char);
}

function selectCharacter(node: Text, charIndex: number) {
  const range = document.createRange();
  const selection = window.getSelection();
  if (!selection) return;

  selection.removeAllRanges(); // Remove any previous selection
  console.log("Node: ", node);
  console.log(node.length);
  range.setStart(node, charIndex);
  range.setEnd(node, charIndex + 1);
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
    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    if (rects.length > 0) {
      const rect = rects[0];
      popup.style.left = `${window.scrollX + rect.left}px`;
      popup.style.top = `${window.scrollY + rect.top - 40}px`;
    }
  }

  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 4000);
}

// Debounce logic
let lastTarget: Node | null = null;
let lastIndex: number | null = null;

document.addEventListener("mousemove", async (event: MouseEvent) => {
  // Create an async function inside the event handler
  const handleMouseMove = async () => {
    let range: Range | null = null;

    /* Mouse Position */
    if (document.caretPositionFromPoint) {
      const position = document.caretPositionFromPoint(event.clientX, event.clientY);
      // console.log(`This is pos: ${pos?.offsetNode}`);
      if (position) {
        range = document.createRange();
        // console.log(`Offset : ${position.offset}`);
        range.setStart(position.offsetNode, position.offset);
        range.setEnd(position.offsetNode, position.offset); // select 1 character
      }
    }

    if (!range || !range.startContainer || range.startContainer.nodeType !== Node.TEXT_NODE) return;

    const textNode = range.startContainer as Text;
    const offset = range.startOffset;
    const char = textNode.textContent?.[offset];

    /* Check if character is a Chinese Character */
    if (char && isChinese(char)) {
      // Prevent repeated highlighting on the same char
      console.log(char);
      if (lastTarget === textNode && lastIndex === offset) return;

      lastTarget = textNode;
      lastIndex = offset;

      selectCharacter(textNode, offset);

      // const entry = rawData.find(e => e.traditional === message.word);
      // console.log(`This is the entry ${entry}`);

      chrome.runtime.sendMessage({ type: "RAWDATA" }, response => {
        console.log("Received RAWDATA", response);
        const entry = response.find((e: { traditional: string }) => e.traditional === char);
        showPopupAtSelection(event, entry.english);
        console.log(entry.english);
      });

      // showPopupAtSelection(event, response.definition);

      // const cedict = await loadCEDICT();
      // const entry = cedict?.find(e => e.simplified === char || e.traditional === char);
      // if (entry) {
      //   showPopupAtSelection(event, `${char} - ${entry.pinyin}: ${entry.definitions.join(", ")}`);
      // }
      // console.log("Chinese character:", char);

      // try {
      // chrome.runtime.sendMessage({ type: "LOOKUP_WORD", char }, response => {
      //   if (chrome.runtime.lastError) {
      //     console.warn("Runtime error:", chrome.runtime.lastError.message);
      //     return;
      //   }
      // if (response?.definition) {
      //   console.log(`Definition: ${response.definition}`);
      //   showPopupAtSelection(event, response.definition);
      // }
      // });
      // } catch (error) {
      //   console.warn("Failed to send message:", error);
      // }
    }
    // const word = (event.target as HTMLElement)?.innerText?.trim();
    // if (word && /^[a-zA-Z]+$/.test(word)) {
    //   chrome.runtime.sendMessage({ type: "LOOKUP_WORD", word }, response => {
    //     if (response?.definition) {
    //       console.log(`Definition: ${response.definition}`);
    //       // You can display it in a floating tooltip or modal here
    //     }
    //   });
    // }
    // console.log(word);
  };

  // Call the async function inside the event handler
  handleMouseMove();
});
