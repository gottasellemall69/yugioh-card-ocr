// components/OCRModal.js
export default function OCRModal( { card, onClose } ) {
    if ( !card || !card.preprocessedImages ) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-full overflow-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">OCR Analysis: { card.cardName }</h3>
                        <button
                            onClick={ onClose }
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Original Image */ }
                        <div className="space-y-2">
                            <h4 className="font-medium text-gray-700 dark:text-gray-300">Original Image</h4>
                            <img src={ card.imageUrl } alt="Original" className="w-full border rounded" />
                        </div>

                        {/* Preprocessed Card Name */ }
                        <div className="space-y-2">
                            <h4 className="font-medium text-gray-700 dark:text-gray-300">Card Name Region (Processed)</h4>
                            <img
                                src={ card.preprocessedImages.cardName }
                                alt="Card Name Processing"
                                className="w-full border rounded"
                            />
                            <div className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                <strong>OCR Result:</strong><br />
                                &quot;{ card.cardName }&quot;
                            </div>
                        </div>

                        {/* Preprocessed Effect Text */ }
                        <div className="space-y-2">
                            <h4 className="font-medium text-gray-700 dark:text-gray-300">Effect Text Region (Processed)</h4>
                            <img
                                src={ card.preprocessedImages.effectText }
                                alt="Effect Text Processing"
                                className="w-full border rounded"
                            />
                            <div className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded max-h-32 overflow-y-auto">
                                <strong>OCR Result:</strong><br />
                                &quot;{ card.description }&quot;
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                        <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                            Preprocessing Steps Applied:
                        </h5>
                        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                            <div>
                                <strong>Card Name Region:</strong> Contrast Enhancement → Unsharp Mask → Grayscale → Adaptive Threshold → Morphological Closing
                            </div>
                            <div>
                                <strong>Effect Text Region:</strong> Grayscale → High Contrast → Noise Reduction → Adaptive Threshold → Morphological Closing → Final Sharpening
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={ onClose }
                            className="bg-primary hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}