type Entry = {
  traditional: string;
  simplified: string;
  pinyin: string;
  english: string[];
};

// let dictionaryMap: Record<string, Entry> = {};
let dictionaryData: Entry[];

export async function loadDictionary(): Promise<void> {
  const stored = await chrome.storage.local.get("dictionaryData");

  if (stored.dictionaryData && Array.isArray(stored.dictionaryData)) {
    dictionaryData = stored.dictionaryData;
    console.log("Loaded dictionary from storage:", dictionaryData.length);
    return;
  }

  const res = await fetch(chrome.runtime.getURL("data.json"));
  if (!res.ok) {
    throw new Error("Failed to load dictionary");
  }

  dictionaryData = await res.json();

  await chrome.storage.local.set({ dictionaryData });

  console.log("Fetched and stored dictionary entries:", dictionaryData.length);
}

export { dictionaryData };
