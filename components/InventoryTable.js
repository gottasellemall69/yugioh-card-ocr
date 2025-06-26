// components/InventoryTable.js
import { useState } from 'react';
import OCRModal from './OCRModal';

export default function InventoryTable( {
    inventory,
    onRemoveCard,
    onUpdateCard,
    onClearInventory
} ) {
    const [ selectedCard, setSelectedCard ] = useState( null );

    const handleConditionChange = ( id, condition ) => {
        onUpdateCard( id, { condition } );
    };

    const handleClearInventory = () => {
        if ( confirm( 'Are you sure you want to clear all inventory?' ) ) {
            onClearInventory();
        }
    };

    if ( inventory.length === 0 ) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Card Inventory</h2>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">0 cards</span>
                            <button
                                onClick={ handleClearInventory }
                                className="text-red-600 hover:text-red-800 text-sm"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <div className="text-4xl mb-4">📋</div>
                    <p>No cards in inventory. Upload some card images to get started!</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Card Inventory</h2>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                                { inventory.length } card{ inventory.length !== 1 ? 's' : '' }
                            </span>
                            <button
                                onClick={ handleClearInventory }
                                className="text-red-600 hover:text-red-800 text-sm"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Image</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Card Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Set</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Condition</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Prices</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            { inventory.map( item => (
                                <tr key={ item.id }>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <img
                                            src={ item.imageUrl }
                                            alt={ item.cardName }
                                            className="w-12 h-16 object-cover rounded"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium">{ item.cardName }</div>
                                        <div className="text-sm text-gray-500">{ item.setCode }</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>{ item.setName }</div>
                                        <div className="text-sm text-gray-500">{ item.edition }</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            className="text-base border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600"
                                            value={ item.condition }
                                            onChange={ ( e ) => handleConditionChange( item.id, e.target.value ) }
                                        >
                                            <option value="Near Mint">Near Mint</option>
                                            <option value="Lightly Played">Lightly Played</option>
                                            <option value="Moderately Played">Moderately Played</option>
                                            <option value="Heavily Played">Heavily Played</option>
                                            <option value="Damaged">Damaged</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <div className="text-sm truncate" title={ item.description }>
                                            { item.description }
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <div>eBay: ${ item.prices.ebay }</div>
                                            <div>TCG: ${ item.prices.tcgplayer }</div>
                                            <div>CM: ${ item.prices.cardmarket }</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-2">
                                            <button
                                                onClick={ () => setSelectedCard( item ) }
                                                className="text-blue-600 hover:text-blue-800 text-sm block"
                                            >
                                                View OCR
                                            </button>
                                            <button
                                                onClick={ () => onRemoveCard( item.id ) }
                                                className="text-red-600 hover:text-red-800 text-sm block"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) ) }
                        </tbody>
                    </table>
                </div>
            </div>

            { selectedCard && (
                <OCRModal
                    card={ selectedCard }
                    onClose={ () => setSelectedCard( null ) }
                />
            ) }
        </>
    );
}