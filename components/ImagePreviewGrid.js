// components/image-preview-grid.js

import React from 'react';
import ImagePreviewModal from './ImagePreviewModal';

/**
 * ImagePreviewGrid displays thumbnails of uploaded images and
 * allows opening each in a modal for region customization.
 *
 * Props:
 * - files: File[]
 * - customRegions: { [index: number]: RegionMap }
 * - onImagesUpdate: (File[]) => void
 * - onRegionsUpdate: (index: number | null, regions: RegionMap | null, overrideMap?: {}) => void
 */
export function ImagePreviewGrid( { files, customRegions, onImagesUpdate, onRegionsUpdate } ) {
    const removeImage = ( index ) => {
        const updatedFiles = files.filter( ( _, i ) => i !== index );
        onImagesUpdate( updatedFiles );

        const updatedRegions = { ...customRegions };
        delete updatedRegions[ index ];

        // Re-index region keys
        const reindexed = {};
        Object.entries( updatedRegions ).forEach( ( [ oldIdx, regions ] ) => {
            const numIdx = parseInt( oldIdx, 10 );
            if ( numIdx > index ) {
                reindexed[ numIdx - 1 ] = regions;
            } else if ( numIdx < index ) {
                reindexed[ numIdx ] = regions;
            }
        } );

        onRegionsUpdate( null, null, reindexed );
    };

    const openRegionEditor = ( file, index ) => {
        const url = URL.createObjectURL( file );
        ImagePreviewModal.open( {
            imageUrl: url,
            existingRegions: customRegions[ index ] || null,
            onSave: ( updatedRegions ) => onRegionsUpdate( index, updatedRegions ),
        } );
    };

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            { files.map( ( file, index ) => (
                <div key={ index } className="relative border p-2 rounded shadow bg-white">
                    <img
                        src={ URL.createObjectURL( file ) }
                        alt={ `Upload ${ index + 1 }` }
                        className="w-full h-auto cursor-pointer rounded"
                        onClick={ () => openRegionEditor( file, index ) }
                    />
                    <button
                        onClick={ () => removeImage( index ) }
                        className="absolute top-1 right-1 text-white bg-red-500 rounded-full w-6 h-6 flex items-center justify-center"
                        title="Remove image"
                    >
                        ×
                    </button>
                </div>
            ) ) }
        </div>
    );
}
