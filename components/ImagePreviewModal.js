// components/image-preview-modal.js

import React, { useRef, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

/**
 * Modal for selecting OCR regions on an image.
 * Props:
 * - imageUrl: string
 * - existingRegions: { cardName: Region, effectText: Region }
 * - onSave: (regionMap: { cardName: Region, effectText: Region }) => void
 */
function ImagePreviewModalImpl( { imageUrl, existingRegions, onSave, onClose } ) {
    const canvasRef = useRef( null );
    const imgRef = useRef( null );
    const [ currentRegion, setCurrentRegion ] = useState( 'cardName' );
    const [ regions, setRegions ] = useState( existingRegions || {
        cardName: { left: 50, top: 50, width: 200, height: 50 },
        effectText: { left: 50, top: 120, width: 300, height: 100 },
    } );

    const drawRegions = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext( '2d' );
        const img = imgRef.current;
        if ( !canvas || !ctx || !img ) return;

        ctx.clearRect( 0, 0, canvas.width, canvas.height );
        ctx.drawImage( img, 0, 0, canvas.width, canvas.height );

        Object.entries( regions ).forEach( ( [ key, rect ] ) => {
            ctx.strokeStyle = key === currentRegion ? 'red' : 'blue';
            ctx.lineWidth = 2;
            ctx.strokeRect( rect.left, rect.top, rect.width, rect.height );
            ctx.font = '14px sans-serif';
            ctx.fillStyle = 'white';
            ctx.fillText( key, rect.left + 4, rect.top + 16 );
        } );
    };

    useEffect( () => {
        drawRegions();
    }, [ regions, currentRegion ] );

    const handleClick = ( e ) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor( e.clientX - rect.left );
        const y = Math.floor( e.clientY - rect.top );
        const updated = {
            ...regions,
            [ currentRegion ]: { left: x, top: y, width: 150, height: 50 },
        };
        setRegions( updated );
    };

    const apply = () => {
        onSave( regions );
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center">
            <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-3xl relative">
                <h2 className="text-xl font-bold mb-2">Select OCR Regions</h2>

                <div className="mb-2 flex gap-4">
                    <button
                        onClick={ () => setCurrentRegion( 'cardName' ) }
                        className={ `px-3 py-1 rounded ${ currentRegion === 'cardName' ? 'bg-blue-600 text-white' : 'bg-gray-200' }` }
                    >
                        Card Name
                    </button>
                    <button
                        onClick={ () => setCurrentRegion( 'effectText' ) }
                        className={ `px-3 py-1 rounded ${ currentRegion === 'effectText' ? 'bg-blue-600 text-white' : 'bg-gray-200' }` }
                    >
                        Effect Text
                    </button>
                </div>

                <div className="relative">
                    <canvas
                        ref={ canvasRef }
                        width={ 600 }
                        height={ 400 }
                        onClick={ handleClick }
                        className="border border-gray-400 rounded"
                    />
                    <img
                        ref={ imgRef }
                        src={ imageUrl }
                        alt="Preview"
                        className="hidden"
                        onLoad={ () => drawRegions() }
                    />
                </div>

                <div className="flex justify-end mt-4 gap-3">
                    <button onClick={ onClose } className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                    <button onClick={ apply } className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
                </div>
            </div>
        </div>
    );
}

/** Modal manager singleton */
let modalContainer = null;
export const ImagePreviewModal = {
    open( { imageUrl, existingRegions, onSave } ) {
        if ( !modalContainer ) {
            modalContainer = document.createElement( 'div' );
            document.body.appendChild( modalContainer );
        }

        const handleClose = () => {
            ReactDOM.unmountComponentAtNode( modalContainer );
        };

        ReactDOM.render(
            <ImagePreviewModalImpl
                imageUrl={ imageUrl }
                existingRegions={ existingRegions }
                onSave={ onSave }
                onClose={ handleClose }
            />,
            modalContainer
        );
    }
};
