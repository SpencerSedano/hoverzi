import "webextension-polyfill";
import { exampleThemeStorage } from "@extension/storage";

// Importing Functions
import { loadDictionary, dictionaryData } from "./loadDictionary";

exampleThemeStorage.get().then(theme => {
  console.log("theme", theme);
});

console.log("Background loaded");

let dictionaryLoaded = false;

chrome.runtime.onInstalled.addListener(async () => {
  await loadDictionary();
  dictionaryLoaded = true;
  console.log(" loaded in background");
});

//TODO - Add Chinese to Spanish

//FIXME - Warning
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "RAWDATA") {
    if (!dictionaryLoaded) {
      loadDictionary().then(() => {
        dictionaryLoaded = true;
        sendResponse(dictionaryData);
      });
    } else {
      sendResponse(dictionaryData);
    }
    return true;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.hoverziStatus !== undefined) {
    console.log(message.hoverziStatus);
    sendResponse(message.hoverziStatus);
  }
  return true;
});

// type Entry = {
//   traditional: string;
//   simplified: string;
//   pinyin: string;
//   english: string[];
// };

// let dictionaryMap: Record<string, Entry> = {};
// let rawData: Entry[];

// async function loadDictionary() {
//   const res = await fetch(chrome.runtime.getURL("data.json"));
//   console.log("Fetch status:", res.status); // should be 200
//   rawData = await res.json();

//   console.log("Raw dictionary entries loaded:", rawData[4232].traditional);
//   dictionaryMap = {};

//   for (const entry of rawData) {
//     dictionaryMap[entry.traditional] = entry;
//     dictionaryMap[entry.simplified] = entry;
//   }
//   // isDictionaryLoaded = true;
//   // console.log("Dictionary loaded successfully");

//   console.log("Dictionary map created with keys:", Object.keys(dictionaryMap).slice(0, 10));

//   console.log(Object.values(dictionaryMap).slice(50, 100));
// }

// chrome.runtime.onInstalled.addListener(loadDictionary);
// console.log(loadDictionary);
// console.log(dictionaryData);
// chrome.runtime.onStartup.addListener(loadDictionary);

/*PASS VALUE OF RAWDATA TO CONTENT*/

// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.type === "RAWDATA") {
//     sendResponse(dictionaryData);
//   }
//   return true; //Must return true
// });

/*PASS VALUE OF RAWDATA TO CONTENT*/
