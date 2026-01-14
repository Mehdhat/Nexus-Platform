import { DealDocument, DocumentStatus } from '../types';

const STORAGE_KEY = 'business_nexus_deal_documents';

const readJson = <T>(key: string, fallback: T): T => {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const generateId = (prefix: string) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

export const getDealDocuments = (): DealDocument[] => {
  const docs = readJson<DealDocument[]>(STORAGE_KEY, []);
  return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const upsertDealDocument = (doc: DealDocument): DealDocument => {
  const docs = readJson<DealDocument[]>(STORAGE_KEY, []);
  const idx = docs.findIndex(d => d.id === doc.id);

  if (idx >= 0) {
    docs[idx] = doc;
  } else {
    docs.push({ ...doc, id: doc.id || generateId('doc') });
  }

  writeJson(STORAGE_KEY, docs);
  return doc;
};

export const deleteDealDocument = (id: string): void => {
  const docs = readJson<DealDocument[]>(STORAGE_KEY, []);
  writeJson(STORAGE_KEY, docs.filter(d => d.id !== id));
};

export const updateDealDocumentStatus = (id: string, status: DocumentStatus): DealDocument | null => {
  const docs = readJson<DealDocument[]>(STORAGE_KEY, []);
  const idx = docs.findIndex(d => d.id === id);
  if (idx === -1) return null;

  const updated: DealDocument = {
    ...docs[idx],
    status,
    signedAt: status === 'signed' ? (docs[idx].signedAt || new Date().toISOString()) : docs[idx].signedAt,
  };

  docs[idx] = updated;
  writeJson(STORAGE_KEY, docs);
  return updated;
};

export const saveDocumentSignature = (id: string, signatureDataUrl: string): DealDocument | null => {
  const docs = readJson<DealDocument[]>(STORAGE_KEY, []);
  const idx = docs.findIndex(d => d.id === id);
  if (idx === -1) return null;

  const updated: DealDocument = {
    ...docs[idx],
    signatureDataUrl,
    status: 'signed',
    signedAt: new Date().toISOString(),
  };

  docs[idx] = updated;
  writeJson(STORAGE_KEY, docs);
  return updated;
};

export const createDealDocument = async (params: {
  file: File;
  ownerId: string;
}): Promise<DealDocument> => {
  const { file, ownerId } = params;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });

  const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
  const type = file.type === 'application/pdf' ? 'PDF' : (file.name.split('.').pop() || 'File').toUpperCase();

  const doc: DealDocument = {
    id: generateId('doc'),
    name: file.name,
    type,
    size: `${sizeMb} MB`,
    lastModified: new Date(file.lastModified).toISOString().slice(0, 10),
    shared: false,
    url: '',
    ownerId,
    status: 'draft',
    dataUrl,
    createdAt: new Date().toISOString(),
  };

  upsertDealDocument(doc);
  return doc;
};
