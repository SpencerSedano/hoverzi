import "webextension-polyfill";
import { exampleThemeStorage } from "@extension/storage";

exampleThemeStorage.get().then(theme => {
  console.log("theme", theme);
});

console.log("Background loaded");
console.log("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

type Entry = {
  traditional: string;
  simplified: string;
  pinyin: string;
  english: string[];
};

let dictionaryMap: Record<string, Entry> = {};
let rawData: Entry[];

async function loadDictionary() {
  const res = await fetch(chrome.runtime.getURL("data.json"));
  console.log(`This is the dictioanry ${res}`);
  console.log("Fetch status:", res.status); // should be 200
  rawData = await res.json();

  console.log("Raw dictionary entries loaded:", rawData[4232].traditional);
  dictionaryMap = {};

  for (const entry of rawData) {
    dictionaryMap[entry.traditional] = entry;
    dictionaryMap[entry.simplified] = entry;
  }
  // isDictionaryLoaded = true;
  // console.log("Dictionary loaded successfully");

  console.log("Dictionary map created with keys:", Object.keys(dictionaryMap).slice(0, 10));

  console.log(Object.values(dictionaryMap).slice(50, 100));
}

chrome.runtime.onInstalled.addListener(loadDictionary);
chrome.runtime.onStartup.addListener(loadDictionary);

/*PASS VALUE OF RAWDATA TO CONTENT*/

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "RAWDATA") {
    sendResponse(rawData);
  }
  return true; //Must return true
});

/*PASS VALUE OF RAWDATA TO CONTENT*/

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.type === "LOOKUP_WORD") {
//     const word = request.word;

//     if (!dictionaryMap || Object.keys(dictionaryMap).length === 0) {
//       console.warn("Dictionary not loaded yet");
//       sendResponse({ definition: "Dictionary not ready" });
//       return true;
//     }

//     const entry = dictionaryMap[word];
//     console.log(`This is the entry ${entry}`);
//     if (entry) {
//       sendResponse({ definition: entry.english.join(", "), pinyin: entry.pinyin });
//     } else {
//       sendResponse({ definition: "Not found" });
//     }
//   }
//   return true;
// });

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.type === "LOOKUP_WORD") {
//     // console.log(`This is the message ${message.type}`);

//     // if (!isDictionaryLoaded) {
//     //   console.warn("Dictionary not loaded yet");
//     //   sendResponse({ definition: "Dictionary not ready" });
//     //   return true;
//     // }

//     // const word = message.word;
//     // const word = "你";

//     // if (!rawData || Object.keys(rawData).length === 0) {
//     //   console.warn("Dictionary not loaded yet");
//     //   sendResponse({ definition: "Dictionary not ready" });
//     //   return true;
//     // }
//     console.log("Raw Data:", JSON.stringify(rawData, null, 2)); // Pretty-print with indentation

//     const entry = rawData.find(e => e.traditional === message.word);
//     console.log(`This is the entry ${entry}`);

//     if (entry) {
//       sendResponse({ definition: entry.english.join(", "), pinyin: entry.pinyin });
//     } else {
//       sendResponse({ definition: "Not found" });
//     }
//   }
//   return true;
// });
