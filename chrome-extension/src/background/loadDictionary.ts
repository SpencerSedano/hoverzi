type Entry = {
  traditional: string;
  simplified: string;
  pinyin: string;
  english: string[];
};

// let dictionaryMap: Record<string, Entry> = {};
let rawData: Entry[];

export async function loadDictionary() {
  const res = await fetch(chrome.runtime.getURL("data.json"));
  console.log("Fetch status:", res.status); // should be 200
  rawData = await res.json();

  // console.log("Raw dictionary entries loaded:", rawData[4232].traditional);
  // dictionaryMap = {};

  // for (const entry of rawData) {
  //   dictionaryMap[entry.traditional] = entry;
  //   dictionaryMap[entry.simplified] = entry;
  // }
}

export { rawData };
