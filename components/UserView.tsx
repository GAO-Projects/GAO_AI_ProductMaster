
import React, { useState } from 'react';
import type { Product } from '../types';
import { SearchIcon, LinkIcon, ChipIcon, TagIcon, GlobeAltIcon, ExternalLinkIcon } from './icons';

interface UserViewProps {
  products: Product[];
}

const UserView: React.FC<UserViewProps> = ({ products }) => {
  const [searchUrl, setSearchUrl] = useState('');
  const [foundProduct, setFoundProduct] = useState<Product | undefined>(undefined);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUrl.trim()) {
      // If search is empty, reset to initial state
      setFoundProduct(undefined);
      setSearchError(null);
      return;
    }

    const trimmedSearchUrl = searchUrl.trim();
    const result = products.find(p => 
      (p.supplierProductPageLink || '').trim() === trimmedSearchUrl || 
      (p.gaoTekLink || '').trim() === trimmedSearchUrl
    );
    
    if (result) {
      setFoundProduct(result);
      setSearchError(null); // Clear any previous error
    } else {
      // Product not found, show an error message
      setFoundProduct(undefined);
      setSearchError('Product Not Found');
    }
  };

  const handleReset = () => {
    setSearchUrl('');
    setFoundProduct(undefined);
    setSearchError(null);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col items-center">
      <div className="w-full bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">GAO Product's Similarity Check</h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Paste a "Supplier's Product Page Link" or "GAOTek Link" to find a match in our database.
        </p>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-grow w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LinkIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="url"
              value={searchUrl}
              onChange={(e) => setSearchUrl(e.target.value)}
              placeholder="Enter Supplier's Page Link or GAOTek Link..."
              className="w-full pl-10 pr-4 py-3 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100 transition"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="submit"
              className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors duration-200 shadow-md"
            >
              <SearchIcon className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Search</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex-1 sm:flex-none flex items-center justify-center px-6 py-3 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-gray-400 transition-colors duration-200 shadow-md"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="w-full mt-8">
        {searchError && (
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-fade-in border-l-4 border-red-500">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400">
              {searchError}
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              The link you provided does not match any product in our database. Please verify the link or click Reset to try again.
            </p>
          </div>
        )}

        {foundProduct && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden animate-fade-in">
            <div className="p-6 bg-green-500 dark:bg-green-600 text-white">
                <h3 className="text-2xl font-bold">Product Match Found!</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Product Name</h4>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{foundProduct.productName}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400"><ChipIcon className="h-4 w-4 mr-1"/>Product ID</h4>
                    <p className="text-lg text-gray-700 dark:text-gray-300 font-mono bg-gray-100 dark:bg-gray-700/50 inline-block px-2 py-1 rounded">{foundProduct.productID}</p>
                  </div>
                   <div>
                    <h4 className="flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400"><TagIcon className="h-4 w-4 mr-1"/>Category</h4>
                    <p className="text-lg text-gray-700 dark:text-gray-300">{foundProduct.category}</p>
                  </div>
              </div>
              <div>
                <h4 className="flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400"><GlobeAltIcon className="h-4 w-4 mr-1"/>Supplier's Product Page</h4>
                 <a href={foundProduct.supplierProductPageLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-indigo-600 dark:text-indigo-400 hover:underline break-all">
                  {foundProduct.supplierProductPageLink}
                  <ExternalLinkIcon className="h-4 w-4 ml-1 flex-shrink-0"/>
                </a>
              </div>
               <div>
                <h4 className="flex items-center text-sm font-semibold text-gray-500 dark:text-gray-400"><LinkIcon className="h-4 w-4 mr-1"/>GAOTek Link</h4>
                <a href={foundProduct.gaoTekLink} target="_blank" rel="noopener noreferrer" className="flex items-center text-indigo-600 dark:text-indigo-400 hover:underline break-all">
                  {foundProduct.gaoTekLink}
                  <ExternalLinkIcon className="h-4 w-4 ml-1 flex-shrink-0"/>
                </a>
              </div>
            </div>
          </div>
        )}

        {!foundProduct && !searchError && (
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
              Enter a link above to start your search.
            </h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserView;
