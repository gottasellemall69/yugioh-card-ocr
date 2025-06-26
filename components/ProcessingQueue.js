// components/ProcessingQueue.js
export default function ProcessingQueue( { queue } ) {
    const getStatusColor = ( status ) => {
        const colors = {
            pending: 'text-gray-500',
            reading: 'text-blue-500',
            preprocessing: 'text-blue-500',
            'ocr-setup': 'text-yellow-500',
            'ocr-name-prep': 'text-yellow-500',
            'ocr-name': 'text-yellow-500',
            'ocr-effect-prep': 'text-yellow-500',
            'ocr-effect': 'text-yellow-500',
            pricing: 'text-purple-500',
            complete: 'text-green-500',
            error: 'text-red-500'
        };
        return colors[ status ] || 'text-gray-500';
    };

    const getStatusText = ( status ) => {
        const texts = {
            pending: 'Pending',
            reading: 'Reading file',
            preprocessing: 'Loading image',
            uploading: 'Uploading image',
            'ocr-setup': 'Initializing OCR',
            'ocr-name-prep': 'Preprocessing name region',
            'ocr-name': 'Reading card name',
            'ocr-effect-prep': 'Preprocessing text region',
            'ocr-effect': 'Reading effect text',
            pricing: 'Fetching prices',
            complete: 'Complete',
            error: 'Error'
        };
        return texts[ status ] || 'Processing';
    };

    return (
        <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Processing Queue</h2>
                <div className="space-y-4">
                    { queue.map( item => (
                        <div key={ item.id } className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                            <div className="flex items-center space-x-4">
                                { item.imageUrl ? (
                                    <img src={ item.imageUrl } alt="Card" className="w-16 h-20 object-cover rounded" />
                                ) : (
                                    <div className="w-16 h-20 bg-gray-200 dark:bg-gray-600 rounded"></div>
                                ) }
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">{ item.file.name }</span>
                                        <span className={ `text-sm ${ getStatusColor( item.status ) }` }>
                                            { getStatusText( item.status ) }
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all duration-300"
                                            style={ { width: `${ item.progress }%` } }
                                        ></div>
                                    </div>
                                    { item.cardName && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                            Card: { item.cardName }
                                        </p>
                                    ) }
                                </div>
                            </div>
                        </div>
                    ) ) }
                </div>
            </div>
        </div>
    );
}