export default function Header() {
  return (
    <div className="text-center mb-8 animate-fade-in">
      <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
        Yu-Gi-Oh Card Recognition
      </h1>
      <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
        Upload card images to automatically recognize and match them against your inventory using advanced OCR technology
      </p>
      <div className="mt-4 flex justify-center space-x-4 text-sm text-gray-500">
        <span className="flex items-center">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          OCR Processing
        </span>
        <span className="flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          Database Matching
        </span>
        <span className="flex items-center">
          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
          Price Fetching
        </span>
      </div>
    </div>
  );
}