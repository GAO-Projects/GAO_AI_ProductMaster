import React, { useState, useMemo, ChangeEvent, FormEvent, useRef } from 'react';
import type { Product } from '../types';
import { SearchIcon, DownloadIcon, UploadIcon, PencilIcon, TrashIcon, XIcon } from './icons';

// Make Papa and XLSX available in the component scope
declare var Papa: any;
declare var XLSX: any;

interface AdminViewProps {
  products: Product[];
  onAddProduct: (product: Product) => Promise<void>;
  onUpdateProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (supplierProductPageLink: string) => Promise<void>;
  onBatchUpload: (products: Product[]) => Promise<void>;
}

const ProductModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Product) => Promise<void>;
  product: Product | null;
}> = ({ isOpen, onClose, onSubmit, product }) => {
  const [formData, setFormData] = useState<Product>(
    product || {
      productName: '', productID: '', supplierWebsiteLink: '', sourcingWebsiteName: '',
      supplierCountryName: '', supplierProductPageLink: '', category: '', gaoTekLink: ''
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    setFormData(product || {
      productName: '', productID: '', supplierWebsiteLink: '', sourcingWebsiteName: '',
      supplierCountryName: '', supplierProductPageLink: '', category: '', gaoTekLink: ''
    });
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        await onSubmit(formData);
        onClose();
    } catch (error) {
        // Error is handled by App.tsx notification, but we stop the loading spinner
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const fields: Array<{key: keyof Product, label: string}> = [
      { key: 'productName', label: 'Product Name' },
      { key: 'productID', label: 'Product ID' },
      { key: 'supplierProductPageLink', label: "Supplier's Product Page Link" },
      { key: 'gaoTekLink', label: 'GAOTek Link' },
      { key: 'category', label: 'Category' },
      { key: 'supplierWebsiteLink', label: "Supplier's Website Link" },
      { key: 'sourcingWebsiteName', label: 'Sourcing Website Name' },
      { key: 'supplierCountryName', label: "Supplier's Country Name" }
  ];

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 animate-fade-in" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full m-4 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <XIcon className="h-6 w-6" /> <span className="sr-only">Close</span>
        </button>
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{product ? 'Edit Product' : 'Add New Product'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(field => (
                <div key={field.key}>
                    <label htmlFor={field.key} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                    <input
                        type="text"
                        id={field.key}
                        name={field.key}
                        value={formData[field.key]}
                        onChange={handleChange}
                        required={field.key === 'supplierProductPageLink' || field.key === 'productName'}
                        disabled={isSubmitting || (field.key === 'supplierProductPageLink' && !!product)}
                        className={`mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed ${field.key === 'supplierProductPageLink' && !!product ? 'bg-gray-100 dark:bg-gray-600' : ''}`}
                    />
                </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-wait">{isSubmitting ? 'Saving...' : (product ? 'Save Changes' : 'Add Product')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};


const AdminView: React.FC<AdminViewProps> = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct, onBatchUpload }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoadingUpload, setIsLoadingUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };
  
  const handleDelete = (link: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
        onDeleteProduct(link);
    }
  };

  const handleModalSubmit = async (product: Product) => {
    if (editingProduct) {
        await onUpdateProduct(product);
    } else {
        await onAddProduct(product);
    }
  };

  const handleExportXLSX = () => {
    if (products.length === 0) {
        alert("No products to export.");
        return;
    }
    const worksheetData = products.map(p => ({
        "Product Name": p.productName, "Product ID": p.productID, "Supplier's website link": p.supplierWebsiteLink,
        "Sourcing website name": p.sourcingWebsiteName, "Supplier's Country Name": p.supplierCountryName,
        "Supplier's product page link": p.supplierProductPageLink, "Category": p.category, "GAOTek Link": p.gaoTekLink
    }));
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    XLSX.writeFile(workbook, `GAO-Product-Database-Export-${timestamp}.xlsx`);
  }

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoadingUpload(true);
    const reader = new FileReader();
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    const processData = (data: any[]) => {
      const keyMapping: {[key:string]: keyof Product} = {
          'product name': 'productName',
          'product id': 'productID',
          "supplier's website link": 'supplierWebsiteLink',
          'sourcing website name': 'sourcingWebsiteName',
          "supplier's country name": 'supplierCountryName',
          "supplier's product page link": 'supplierProductPageLink',
          'category': 'category',
          'gaotek link': 'gaoTekLink'
      };

      const productsToUpload: Product[] = data.map(row => {
          const product: Partial<Product> = {};
          for(const key in row) {
              const normalizedKey = String(key).toLowerCase().trim();
              if (keyMapping[normalizedKey]) {
                  product[keyMapping[normalizedKey]] = row[key];
              }
          }
          // Basic validation: ensure the primary key exists and is a string
          if (typeof product.supplierProductPageLink !== 'string' || !product.supplierProductPageLink.trim()) {
            return null;
          }
          return product as Product;
      }).filter((p): p is Product => p !== null);

      if (productsToUpload.length > 0) {
        onBatchUpload(productsToUpload);
      } else {
        alert("No valid products found in the uploaded file. Ensure columns match the required format and that 'Supplier's product page link' is present for all rows.");
      }

      setIsLoadingUpload(false);
      // Reset file input
      if(fileInputRef.current) fileInputRef.current.value = "";
    };

    if (fileExtension === 'csv') {
      reader.onload = (e) => {
        const text = e.target?.result;
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results: any) => processData(results.data)
        });
      };
      reader.readAsText(file);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      reader.onload = (e) => {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        processData(json);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert('Unsupported file type. Please upload a .csv or .xlsx file.');
      setIsLoadingUpload(false);
    }
  };
  
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
      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleModalSubmit} product={editingProduct} />
      
      {/* Upload/Add Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Manage Database</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Add a single product or batch upload from a file.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 font-semibold transition-colors duration-200">
              Add Manually
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={isLoadingUpload} className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500 flex items-center font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
              <UploadIcon className="h-5 w-5 mr-2" />
              {isLoadingUpload ? 'Processing...' : 'Upload File'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Product Table */}
      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Current Product Database ({filteredProducts.length})</h2>
             <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-grow sm:flex-grow-0">
                    <input type="text" placeholder="Search by name or ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full sm:w-64 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <SearchIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                </div>
                <button onClick={handleExportXLSX} className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 flex items-center font-semibold transition-colors duration-200 flex-shrink-0">
                  <DownloadIcon className="h-5 w-5 mr-2" /> Export
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.map((product) => (
                <tr key={product.supplierProductPageLink} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{product.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{product.productID}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 dark:text-indigo-400 hover:underline"><a href={product.supplierProductPageLink} target="_blank" rel="noopener noreferrer" className="break-all">{product.supplierProductPageLink}</a></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 dark:text-indigo-400 hover:underline"><a href={product.gaoTekLink} target="_blank" rel="noopener noreferrer" className="break-all">{product.gaoTekLink}</a></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200" aria-label="Edit Product"><PencilIcon className="h-5 w-5"/></button>
                    <button onClick={() => handleDelete(product.supplierProductPageLink)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200" aria-label="Delete Product"><TrashIcon className="h-5 w-5"/></button>
                  </td>
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
