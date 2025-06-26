// hooks/useInventory.js
import { useState, useCallback } from 'react';
import { exportInventoryToCSV, parseCSVToInventory } from '../utils/csvExport';

export function useInventory() {
    const [ inventory, setInventory ] = useState( [] );

    const addCard = useCallback( ( card ) => {
        setInventory( prev => [ ...prev, { ...card, id: Date.now() + Math.random() } ] );
    }, [] );

    const removeCard = useCallback( ( id ) => {
        setInventory( prev => prev.filter( card => card.id !== id ) );
    }, [] );

    const updateCard = useCallback( ( id, updates ) => {
        setInventory( prev => prev.map( card =>
            card.id === id ? { ...card, ...updates } : card
        ) );
    }, [] );

    const clearInventory = useCallback( () => {
        setInventory( [] );
    }, [] );

    const exportToCSV = useCallback( ( filename = 'card_inventory.csv' ) => {
        try {
            if ( inventory.length === 0 ) {
                throw new Error( 'No cards to export' );
            }
            exportInventoryToCSV( inventory, filename );
            return { success: true };
        } catch ( error ) {
            console.error( 'Export failed:', error );
            return { success: false, error: error.message };
        }
    }, [ inventory ] );

    const importFromCSV = useCallback( ( csvContent ) => {
        try {
            const importedInventory = parseCSVToInventory( csvContent );
            setInventory( prev => [ ...prev, ...importedInventory ] );
            return {
                success: true,
                count: importedInventory.length,
                data: importedInventory
            };
        } catch ( error ) {
            console.error( 'Import failed:', error );
            return { success: false, error: error.message };
        }
    }, [] );

    return {
        inventory,
        addCard,
        removeCard,
        updateCard,
        clearInventory,
        exportToCSV,
        importFromCSV
    };
}