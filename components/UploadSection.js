// components/UploadSection.js
import { useCallback, useRef } from 'react';

export default function UploadSection( { onFilesSelected } ) {
    const fileInputRef = useRef( null );

    const handleDragOver = useCallback( ( e ) => {
        e.preventDefault();
        e.currentTarget.classList.add( 'border-primary', 'scale-105' );
    }, [] );

    const handleDragLeave = useCallback( ( e ) => {
        e.preventDefault();
        e.currentTarget.classList.remove( 'border-primary', 'scale-105' );
    }, [] );

    const handleDrop = useCallback( ( e ) => {
        e.preventDefault();
        e.currentTarget.classList.remove( 'border-primary', 'scale-105' );
        const files = e.dataTransfer.files;
        if ( files.length > 0 ) {
            onFilesSelected( files );
        }
    }, [ onFilesSelected ] );

    const handleFileSelect = useCallback( ( e ) => {
        const files = e.target.files;
        if ( files.length > 0 ) {
            onFilesSelected( files );
        }
    }, [ onFilesSelected ] );

    return (
        <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Upload Card Images</h2>
                <div
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-primary transition-all cursor-pointer"
                    onDragOver={ handleDragOver }
                    onDragLeave={ handleDragLeave }
                    onDrop={ handleDrop }
                    onClick={ () => fileInputRef.current?.click() }
                >
                    <div className="space-y-4">
                        <div className="text-6xl">📷</div>
                        <div>
                            <p className="text-lg font-medium">Drop card images here or click to browse</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Supports JPG, PNG, WebP</p>
                        </div>
                        <input
                            ref={ fileInputRef }
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={ handleFileSelect }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}