import type { Product } from './types';

const DB_NAME = 'GAOAIProductDB';
const DB_VERSION = 1;
const STORE_NAME = 'products';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Database error:', (event.target as IDBRequest).error);
      reject('Error opening database');
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        // Use supplier's link as the key since it must be unique for searching
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'supplierProductPageLink' });
        // Create an index on productID for potential future lookups
        store.createIndex('productID_idx', 'productID', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
  });
}

export async function getAllProducts(): Promise<Product[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => {
        console.error('Error fetching products:', request.error);
        reject('Error fetching products');
    }
    request.onsuccess = () => {
      const result: Product[] = request.result || [];
      // Defensively sort to prevent errors from items with no productName
      resolve(result.sort((a,b) => String(a.productName || '').localeCompare(String(b.productName || ''))));
    }
  });
}

export async function addProduct(product: Product): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(product);

    request.onerror = () => {
        console.error('Error adding product:', request.error);
        reject('Error adding product. The "Supplier\\\'s product page link" might already exist.');
    }
    request.onsuccess = () => resolve();
  });
}

export async function updateProduct(product: Product): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(product); // put() will update if key exists
    
    request.onerror = () => {
        console.error('Error updating product:', request.error);
        reject('Error updating product.');
    }
    request.onsuccess = () => resolve();
  });
}

export async function deleteProduct(supplierProductPageLink: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(supplierProductPageLink);

    request.onerror = () => {
        console.error('Error deleting product:', request.error);
        reject('Error deleting product.');
    }
    request.onsuccess = () => resolve();
  });
}

export async function addProductsBatch(products: Product[]): Promise<{success: number, skipped: number}> {
  const db = await openDB();
  
  // Step 1: Read all existing keys into a Set for quick lookups.
  const readTx = db.transaction(STORE_NAME, 'readonly');
  const readStore = readTx.objectStore(STORE_NAME);
  const existingKeysReq = readStore.getAllKeys();

  const existingKeys: IDBValidKey[] = await new Promise((resolve, reject) => {
    existingKeysReq.onsuccess = () => resolve(existingKeysReq.result);
    existingKeysReq.onerror = (e) => reject((e.target as IDBRequest).error);
  });
  const existingKeysSet = new Set(existingKeys as string[]);

  // Step 2: De-duplicate the incoming batch and filter out keys that already exist in the DB.
  // Using a Map ensures that if the input array has duplicates, we only consider the last one.
  const uniqueNewProducts = new Map<string, Product>();
  for (const product of products) {
    if (product.supplierProductPageLink) {
        uniqueNewProducts.set(product.supplierProductPageLink, product);
    }
  }

  const productsToAdd: Product[] = [];
  uniqueNewProducts.forEach((product, key) => {
    if (!existingKeysSet.has(key)) {
      productsToAdd.push(product);
    }
  });

  const skipped = products.length - productsToAdd.length;

  if (productsToAdd.length === 0) {
    return Promise.resolve({ success: 0, skipped });
  }

  // Step 3: Write the new, unique products to the DB in a single transaction.
  const writeTx = db.transaction(STORE_NAME, 'readwrite');
  const writeStore = writeTx.objectStore(STORE_NAME);
  
  productsToAdd.forEach(p => writeStore.add(p));

  return new Promise((resolve, reject) => {
      writeTx.oncomplete = () => {
          resolve({success: productsToAdd.length, skipped});
      };
      writeTx.onerror = (event) => {
          console.error('Batch add transaction error:', (event.target as IDBTransaction).error);
          reject('Error saving products to the database.');
      };
  });
}