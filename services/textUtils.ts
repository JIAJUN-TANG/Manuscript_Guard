import { THRESHOLDS, COLORS } from '../constants';
import { VersionType } from '../types';
import mammoth from 'mammoth';

// Simple FNV-1a hash implementation for strings
export const calculateHash = (str: string): string => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
};

// Dice Coefficient for similarity (good for text)
export const calculateSimilarity = (text1: string, text2: string): number => {
  if (text1 === text2) return 100;

  const clean1 = text1.replace(/\s+/g, '').toLowerCase();
  const clean2 = text2.replace(/\s+/g, '').toLowerCase();

  if (clean1.length === 0 && clean2.length === 0) return 100;
  if (clean1.length === 0 || clean2.length === 0) return 0;

  // Use bigrams
  const getBigrams = (str: string) => {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const bigram = str.substring(i, i + 2);
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(clean1);
  const bigrams2 = getBigrams(clean2);

  let intersection = 0;
  for (const [key, count] of bigrams1) {
    if (bigrams2.has(key)) {
      intersection += Math.min(count, bigrams2.get(key)!);
    }
  }

  const total = clean1.length - 1 + clean2.length - 1;
  const dice = (2 * intersection) / total;

  return Math.min(100, Math.max(0, dice * 100));
};

export const determineVersionType = (similarity: number, isFirst: boolean): VersionType => {
  if (isFirst) return 'Initial';
  if (similarity < THRESHOLDS.MAJOR) return 'Major Update';
  if (similarity < THRESHOLDS.MINOR) return 'Minor Update';
  return 'Tweak';
};

export const getVersionColor = (type: VersionType): string => {
  switch (type) {
    case 'Major Update': return COLORS.MAJOR;
    case 'Minor Update': return COLORS.MINOR;
    case 'Tweak': return COLORS.TWEAK;
    default: return COLORS.INITIAL;
  }
};

export const readFileContent = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'docx') {
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        mammoth.extractRawText({ arrayBuffer })
          .then((result) => resolve(result.value))
          .catch((err) => reject(err));
      };
      reader.readAsArrayBuffer(file);
    } else {
      // .txt, .md
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsText(file);
    }
    reader.onerror = reject;
  });
};