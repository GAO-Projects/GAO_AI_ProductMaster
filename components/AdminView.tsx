import React, { useState, useMemo } from 'react';
import type { Product } from '../types';
import { SearchIcon, DownloadIcon } from './icons';

// Make XLSX available in the component scope
declare var XLSX: any;

interface AdminViewProps {
  products: Product[];
}

const AdminView: React.FC<AdminViewProps> = ({ products }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleExportXLSX = () => {
    if (products.length === 0) {
        setNotification({type: 'error', message: "No products to export."});
        setTimeout(() => setNotification(null), 5000);
        return;
    }

    const worksheetData = products.map(p => ({
        "Product Name": p.productName,
        "Product ID": p.productID,
        "Supplier's website link": p.supplierWebsiteLink,
        "Sourcing website name": p.sourcingWebsiteName,
        "Supplier's Country Name": p.supplierCountryName,
        "Supplier's product page link": p.supplierProductPageLink,
        "Category": p.category,
        "GAOTek Link": p.gaoTekLink
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    XLSX.writeFile(workbook, `GAO-Product-Database-Export-${timestamp}.xlsx`);

    setNotification({type: 'success', message: 'Product data exported successfully!'});
    setTimeout(() => setNotification(null), 5000);
  }
  
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lowercasedFilter = searchTerm.toLowerCase();
    return products.filter(p => 
        String(p.productName || '').toLowerCase().includes(lowercasedFilter) ||
        String(p.productID || '').toLowerCase().includes(lowercasedFilter)
    );
  }, [products, searchTerm]);
  
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
       {notification && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-md text-white shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-fade-in`}>
          {notification.message}
        </div>
      )}
      
      {/* Product Table */}
      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Current Product Database ({filteredProducts.length})</h2>
             <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0">
                    <input 
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full sm:w-64 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <SearchIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                </div>
                <button onClick={handleExportXLSX} className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 flex items-center font-semibold transition-colors duration-200 flex-shrink-0">
                  <DownloadIcon className="h-5 w-5 mr-2" />
                  Export
                </button>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Supplier Page Link</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">GAOTek Link</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.map((product) => (
                <tr key={product.supplierProductPageLink} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{product.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{product.productID}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 dark:text-indigo-400 hover:underline"><a href={product.supplierProductPageLink} target="_blank" rel="noopener noreferrer" className="break-all">{product.supplierProductPageLink}</a></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 dark:text-indigo-400 hover:underline"><a href={product.gaoTekLink} target="_blank" rel="noopener noreferrer" className="break-all">{product.gaoTekLink}</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
