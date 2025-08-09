import React, { useState, useMemo, useEffect } from 'react';
import type { Product } from '../types';
import { UploadIcon, PencilIcon, SearchIcon, TrashIcon, DownloadIcon } from './icons';

// Make PapaParse & XLSX available in the component scope
declare var Papa: any;
declare var XLSX: any;

interface AdminViewProps {
  products: Product[];
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (supplierProductPageLink: string) => Promise<void>;
  addProductsBatch: (products: Product[]) => Promise<{success: number, skipped: number}>;
}

const initialFormState: Product = {
  productName: '',
  productID: '',
  supplierWebsiteLink: '',
  sourcingWebsiteName: '',
  supplierCountryName: '',
  supplierProductPageLink: '',
  category: '',
  gaoTekLink: '',
};

const AdminView: React.FC<AdminViewProps> = ({ products, addProduct, updateProduct, deleteProduct, addProductsBatch }) => {
  const [formData, setFormData] = useState<Product>(initialFormState);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCancelEdit = () => {
    setEditingKey(null);
    setFormData(initialFormState);
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(formData).some(val => val.trim() === '')) {
      setNotification({type: 'error', message: 'All fields are required.'});
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    try {
        if (editingKey) {
            await updateProduct(formData);
            setNotification({type: 'success', message: 'Product updated successfully!'});
        } else {
            await addProduct(formData);
            setNotification({type: 'success', message: 'Product added successfully!'});
        }
        handleCancelEdit();
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save product.';
        setNotification({type: 'error', message });
    }
    setTimeout(() => setNotification(null), 5000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFile(e.target.files[0]);
    }
  };
  
  const handleEditClick = (product: Product) => {
    setFormData(product);
    setEditingKey(product.supplierProductPageLink);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.productName}"? This action cannot be undone.`)) {
        try {
            await deleteProduct(product.supplierProductPageLink);
            setNotification({type: 'success', message: 'Product deleted successfully.'});
            if(editingKey === product.supplierProductPageLink) {
               handleCancelEdit(); // Clear form if we deleted the product being edited
            }
        } catch(error) {
            const message = error instanceof Error ? error.message : 'Failed to delete product.';
            setNotification({type: 'error', message });
        }
        setTimeout(() => setNotification(null), 5000);
    }
  }

  const processParsedData = async (data: any[]) => {
      const parsedProducts: Product[] = data.map((row: any) => ({
        productName: String(row["Product Name"] || ''),
        productID: String(row["Product ID"] || ''),
        supplierWebsiteLink: String(row["Supplier's website link"] || ''),
        sourcingWebsiteName: String(row["Sourcing website name"] || ''),
        supplierCountryName: String(row["Supplier's Country Name"] || ''),
        supplierProductPageLink: String(row["Supplier's product page link"] || ''),
        category: String(row["Category"] || ''),
        gaoTekLink: String(row["GAOTek Link"] || ''),
      })).filter((p: Product) => p.productName && p.supplierProductPageLink); // Basic validation

      if(parsedProducts.length > 0) {
         try {
            const result = await addProductsBatch(parsedProducts);
            setNotification({type: 'success', message: `Upload complete. Added ${result.success} new products, skipped ${result.skipped} duplicates.`});
         } catch(error) {
            const message = error instanceof Error ? error.message : 'Failed to upload products.';
            setNotification({type: 'error', message });
         }
      } else {
         setNotification({type: 'error', message: 'Could not parse any valid products from the file. Check file content and headers.'});
      }
      setUploadFile(null);
      const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
      if(fileInput) fileInput.value = '';
      setTimeout(() => setNotification(null), 8000);
  }

  const handleFileUpload = () => {
    if (!uploadFile) {
      setNotification({type: 'error', message: 'Please select a file to upload.'});
      setTimeout(() => setNotification(null), 5000);
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    const reader = new FileReader();

    reader.onprogress = (event) => {
        if (event.lengthComputable) {
            const percentLoaded = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentLoaded);
        }
    };

    reader.onload = (e) => {
        setUploadProgress(100);
        
        const data = e.target?.result;
        const fileName = uploadFile.name.toLowerCase();

        if (fileName.endsWith('.csv') && typeof data === 'string') {
            Papa.parse(data, {
                worker: true,
                header: true,
                skipEmptyLines: true,
                complete: (results: any) => {
                    processParsedData(results.data).finally(() => setIsUploading(false));
                },
                error: (error: any) => {
                    setIsUploading(false);
                    setNotification({type: 'error', message: `CSV parsing error: ${error.message}`});
                    setTimeout(() => setNotification(null), 5000);
                }
            });
        } else if ((fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) && data instanceof ArrayBuffer) {
            const workerScript = `
              self.importScripts('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
              self.onmessage = function(e) {
                const fileData = e.data;
                if (!fileData) {
                  self.postMessage({ status: 'error', error: 'No data received by worker.' });
                  return;
                }
                try {
                  const workbook = self.XLSX.read(fileData, { type: 'array' });
                  const sheetName = workbook.SheetNames[0];
                  const worksheet = workbook.Sheets[sheetName];
                  const jsonData = self.XLSX.utils.sheet_to_json(worksheet);
                  self.postMessage({ status: 'success', data: jsonData });
                } catch (error) {
                  self.postMessage({ status: 'error', error: error.message });
                }
              };
            `;
            const blob = new Blob([workerScript], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            const worker = new Worker(workerUrl);

            worker.onmessage = (event) => {
                const { status, data: parsedData, error } = event.data;
                if (status === 'success') {
                    processParsedData(parsedData).finally(() => setIsUploading(false));
                } else {
                    setNotification({type: 'error', message: `File processing error: ${error}`});
                    setTimeout(() => setNotification(null), 5000);
                    setIsUploading(false);
                }
                worker.terminate();
                URL.revokeObjectURL(workerUrl);
            };

            worker.onerror = (error) => {
                setNotification({type: 'error', message: `Worker error: ${error.message}`});
                setTimeout(() => setNotification(null), 5000);
                setIsUploading(false);
                worker.terminate();
                URL.revokeObjectURL(workerUrl);
            };
            
            worker.postMessage(data);

        } else {
            setIsUploading(false);
            setNotification({type: 'error', message: 'Unsupported file type or file content mismatch.'});
            setTimeout(() => setNotification(null), 5000);
        }
    };

    reader.onerror = () => {
         setNotification({type: 'error', message: 'Error reading file.'});
         setTimeout(() => setNotification(null), 5000);
         setIsUploading(false);
    };

    const fileName = uploadFile.name.toLowerCase();
    if (fileName.endsWith('.csv')) {
        reader.readAsText(uploadFile);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        reader.readAsArrayBuffer(uploadFile);
    } else {
        setNotification({type: 'error', message: 'Unsupported file type. Please upload a CSV or Excel (.xls, .xlsx) file.'});
        setIsUploading(false);
        setTimeout(() => setNotification(null), 5000);
    }
  };

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  const startItem = filteredProducts.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, filteredProducts.length);

  const inputClass = "w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 dark:text-gray-100";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
       {notification && (
        <div className={`fixed top-5 right-5 z-50 p-4 rounded-md text-white shadow-lg ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-fade-in`}>
          {notification.message}
        </div>
      )}

      {/* Forms Section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Manual Entry Form */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{editingKey ? 'Edit Product' : 'Add Product Manually'}</h2>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Product Name</label><input type="text" name="productName" value={formData.productName} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Product ID</label><input type="text" name="productID" value={formData.productID} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Supplier's Website</label><input type="text" name="supplierWebsiteLink" value={formData.supplierWebsiteLink} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Sourcing Website</label><input type="text" name="sourcingWebsiteName" value={formData.sourcingWebsiteName} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Supplier's Country</label><input type="text" name="supplierCountryName" value={formData.supplierCountryName} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>Category</label><input type="text" name="category" value={formData.category} onChange={handleInputChange} className={inputClass} /></div>
            </div>
            <div><label className={labelClass}>Supplier's Product Page Link</label><input type="text" name="supplierProductPageLink" value={formData.supplierProductPageLink} onChange={handleInputChange} className={`${inputClass} ${editingKey ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' : ''}`} disabled={!!editingKey} /></div>
            <div><label className={labelClass}>GAOTek Link</label><input type="text" name="gaoTekLink" value={formData.gaoTekLink} onChange={handleInputChange} className={inputClass} /></div>
            <div className="flex items-center space-x-2 pt-2">
                <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 font-semibold transition-colors duration-200">{editingKey ? 'Update Product' : 'Add Product'}</button>
                {editingKey && <button type="button" onClick={handleCancelEdit} className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 font-semibold transition-colors duration-200">Cancel</button>}
            </div>
          </form>
        </div>

        {/* CSV/Excel Upload */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex flex-col justify-center">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Upload Products via File</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Upload a CSV or Excel (.xlsx, .xls) file. Headers must match the manual entry fields. Duplicates will be skipped.</p>
            {isUploading ? (
                <div className="space-y-3 pt-2">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {uploadProgress < 100 ? 'Reading file...' : 'Processing data... This may take a moment.'}
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                        <div 
                            className="bg-indigo-600 h-4 rounded-full transition-all duration-300 ease-linear" 
                            style={{ width: `${uploadProgress}%` }}
                            role="progressbar"
                            aria-valuenow={uploadProgress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        ></div>
                    </div>
                    <p className="text-right text-sm font-semibold text-indigo-600 dark:text-indigo-400">{uploadProgress}%</p>
                </div>
            ) : (
                <div className="flex items-center space-x-4">
                    <label htmlFor="file-upload-input" className="flex-grow cursor-pointer bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium py-2 px-4 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 truncate">
                        <span className="truncate">{uploadFile ? uploadFile.name : 'Choose a file...'}</span>
                        <input id="file-upload-input" type="file" accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileChange} className="hidden" />
                    </label>
                    <button onClick={handleFileUpload} disabled={!uploadFile} className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center font-semibold transition-colors duration-200 flex-shrink-0 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        <UploadIcon className="h-5 w-5 mr-2" />
                        Upload
                    </button>
                </div>
            )}
        </div>
      </div>
      
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">GAOTek Link</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedProducts.map((product) => (
                <tr key={product.supplierProductPageLink} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{product.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{product.productID}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 dark:text-indigo-400 hover:underline"><a href={product.gaoTekLink} target="_blank" rel="noopener noreferrer" className="break-all">{product.gaoTekLink}</a></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-4">
                          <button onClick={() => handleEditClick(product)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 flex items-center">
                              <PencilIcon className="w-4 h-4 mr-1"/>
                              Edit
                          </button>
                          <button onClick={() => handleDeleteClick(product)} className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 flex items-center">
                              <TrashIcon className="w-4 h-4 mr-1"/>
                              Delete
                          </button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center mt-4 px-1">
          <span className="text-sm text-gray-700 dark:text-gray-400">
            Showing <span className="font-semibold text-gray-900 dark:text-white">{startItem}</span> to <span className="font-semibold text-gray-900 dark:text-white">{endItem}</span> of <span className="font-semibold text-gray-900 dark:text-white">{filteredProducts.length}</span> results
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
             <span className="text-sm text-gray-700 dark:text-gray-400">
              Page {currentPage} of {totalPages > 0 ? totalPages : 1}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || filteredProducts.length === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminView;