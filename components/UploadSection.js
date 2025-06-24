import { useRef, useState } from 'react';
import Papa from 'papaparse';

export default function UploadSection({
  uploadedImages,
  setUploadedImages,
  inventory,
  setInventory,
  isProcessing
}) {
  const [batchInfo, setBatchInfo] = useState({ show: false, count: 0, size: '' });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const handleImageFiles = (files) => {
    const imageFiles = Array.from(files).filter(file =>
      file.type.startsWith('image/')
    );

    setUploadedImages(imageFiles);
    updateBatchInfo(imageFiles);
    console.log(`Selected ${imageFiles.length} images`);
  };

  const handleCSVFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const filteredData = results.data.filter(row => 
          row.some(cell => cell && cell.trim())
        );
        setInventory(filteredData);
        console.log(`Loaded ${filteredData.length} items from inventory`);
      },
      error: (error) => {
        console.error(`CSV parse error: ${error.message}`);
      }
    });
  };

  const updateBatchInfo = (images) => {
    if (images.length > 0) {
      const totalSize = images.reduce((sum, file) => sum + file.size, 0);
      const sizeText = totalSize < 1024 * 1024 ?
        `${(totalSize / 1024).toFixed(1)} KB` :
        `${(totalSize / 1024 / 1024).toFixed(1)} MB`;

      setBatchInfo({
        show: true,
        count: images.length,
        size: sizeText
      });
    } else {
      setBatchInfo({ show: false, count: 0, size: '' });
    }
  };

  const clearBatchImages = () => {
    setUploadedImages([]);
    setBatchInfo({ show: false, count: 0, size: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    console.log('Cleared all images from batch');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleImageFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8 animate-slide-up">
      <h2 className="text-2xl font-semibold mb-6 flex items-center">
        <span className="mr-3">📁</span>
        Upload Files
      </h2>

      {/* CSV Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Inventory CSV (optional)
        </label>
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv"
          onChange={handleCSVFile}
          disabled={isProcessing}
          className="w-full text-base p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                   bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary focus:border-transparent
                   file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold
                   file:bg-primary file:text-white hover:file:bg-purple-600 disabled:opacity-50"
        />
        <p className="text-sm text-gray-500 mt-1">
          Upload your existing inventory CSV file for enhanced matching
        </p>
        {inventory.length > 0 && (
          <div className="mt-2 text-sm text-green-600 dark:text-green-400">
            ✅ Loaded {inventory.length} inventory items
          </div>
        )}
      </div>

      {/* Image Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Card Images</label>
        <div
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer
                     ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600'}
                     ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
                     group`}
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
            {isProcessing ? '⏳' : '📸'}
          </div>
          <p className="text-lg mb-2 font-medium">
            {isProcessing ? 'Processing...' : 'Drop card images here or click to browse'}
          </p>
          <p className="text-sm text-gray-500">
            Supports JPG, PNG, WebP - Multiple files supported
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleImageFiles(e.target.files)}
            disabled={isProcessing}
            className="hidden"
          />
        </div>

        {/* Batch Info */}
        {batchInfo.show && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-blue-800 dark:text-blue-200">
                  {batchInfo.count} images selected
                </span>
                <span className="text-sm text-blue-600 dark:text-blue-300 ml-2">
                  ({batchInfo.size})
                </span>
              </div>
              <button
                onClick={clearBatchImages}
                disabled={isProcessing}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm
                         px-3 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800/30 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}