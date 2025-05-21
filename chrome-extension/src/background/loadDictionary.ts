type Entry = {
  traditional: string;
  simplified: string;
  pinyin: string;
  english: string[];
};

// let dictionaryMap: Record<string, Entry> = {};
let dictionaryData: Entry[];

export async function loadDictionary() {
  const res = await fetch(chrome.runtime.getURL("data.json"));
  console.log("Fetch status:", res.status); // should be 200
  dictionaryData = await res.json();

  // console.log("Raw dictionary entries loaded:", dictionaryData[4232].traditional);
  // dictionaryMap = {};

  // for (const entry of dictionaryData) {
  //   dictionaryMap[entry.traditional] = entry;
  //   dictionaryMap[entry.simplified] = entry;
  // }
}

export { dictionaryData };
