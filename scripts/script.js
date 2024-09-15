import ImageItem from './ImageItem.js';
import organizeCollage from './collage.js';
import TextItem from './textItem.js';
import removeBackground from './removeBackgroundLocal.js';

const body = document.body;
const dropArea = document.getElementById('drop-area');
const dropText = document.getElementById('drop-text');

let images = [];
let copiedItems = []; // Add this near the top of the file

// Add these variables at the top of the file
let zoomLevel = 1;
const ZOOM_SPEED = 0.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5;

// Add these variables at the top of the file
let isDraggingDropArea = false;
let dragStartX, dragStartY;

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    body.addEventListener(eventName, preventDefaults, false);
    dropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Handle dropped files
dropArea.addEventListener('drop', handleDrop, false);

// Add highlight class when dragging over the drop area
['dragenter', 'dragover'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, unhighlight, false);
});

function highlight(e) {
    dropArea.classList.add('highlight');
}

function unhighlight(e) {
    dropArea.classList.remove('highlight');
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    handleFiles(files, e.clientX, e.clientY);

    // Show the clear canvas button when an image is added
    clearCanvasBtn.style.display = 'inline-block';

    // Hide the drop text
    const dropText = document.getElementById('drop-text');
    if (dropText) dropText.style.display = 'none';
}

function handleFiles(files, x, y) {
    Array.from(files).forEach(file => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                const newImage = new ImageItem(reader.result, x, y);
                const newZIndex = ImageItem.instances.length + 1;
                newImage.setZIndex(newZIndex);
                ImageItem.instances.push(newImage);
                hideDropText();
            };
        }
    });
}

function hideDropText() {
    if (dropText) {
        dropText.style.display = 'none';
    }
}

// Modify the handleDropAreaClick function
function handleDropAreaClick(e) {
    if (e.target === dropArea && !ImageItem.isCroppingActive) {
        if (e.type === 'mousedown') {
            isDraggingDropArea = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
        } else if (e.type === 'mouseup') {
            isDraggingDropArea = false;
        }
        ImageItem.deselectAll();
        TextItem.deselectAll(); // Add this line to deselect TextItems as well
    }
}

// Modify the handleDropAreaDrag function
function handleDropAreaDrag(e) {
    if (isDraggingDropArea) {
        const deltaX = (e.clientX - dragStartX) / zoomLevel;
        const deltaY = (e.clientY - dragStartY) / zoomLevel;

        ImageItem.instances.forEach(item => {
            item.x += deltaX;
            item.y += deltaY;
            item.updatePosition();
        });

        TextItem.instances.forEach(item => {
            item.x += deltaX;
            item.y += deltaY;
            item.updateStyle();
        });

        dragStartX = e.clientX;
        dragStartY = e.clientY;
    }
}

// Add event listeners to drop area to deselect all images when clicking outside
dropArea.addEventListener('mousedown', handleDropAreaClick);
dropArea.addEventListener('mouseup', handleDropAreaClick);
dropArea.addEventListener('mousemove', handleDropAreaDrag);
document.addEventListener('mouseup', () => {
    isDraggingDropArea = false;
});

// Resize drop area to window size
function resizeDropArea() {
    const toolbarContainer = document.getElementById('toolbar-container');
    const toolbarHeight = toolbarContainer.offsetHeight;
    dropArea.style.width = `${window.innerWidth}px`;
    dropArea.style.height = `${window.innerHeight - toolbarHeight}px`;
    dropArea.style.top = `${toolbarHeight}px`;
    
    // Don't reset zoom level here, just update positions
    ImageItem.instances.forEach(item => {
        item.updatePosition();
    });
}

// Make sure to call this function on window resize and initial load
window.addEventListener('resize', resizeDropArea);
resizeDropArea(); // Initial call to set the size

// window.addEventListener('resize', () => {
//     ImageItem.instances.forEach(image => image.resize());
// });

// Update these lines to match the new HTML structure
const moveUpBtn = document.querySelector('#secondary-toolbar .tool-btn[title="Move Up"]');
const moveDownBtn = document.querySelector('#secondary-toolbar .tool-btn[title="Move Down"]');

moveUpBtn.addEventListener('click', () => adjustZIndex(1));
moveDownBtn.addEventListener('click', () => adjustZIndex(-1));

function adjustZIndex(delta) {
    console.log(`Adjusting z-index by ${delta}`);
    console.log('Selected items:', ImageItem.selectedItems.length);
    ImageItem.selectedItems.forEach(item => {
        const newZIndex = item.zIndex + delta;
        console.log(`Changing z-index from ${item.zIndex} to ${newZIndex}`);
        item.setZIndex(newZIndex);
    });
    ImageItem.updateAllZIndices();
}

// Add crop functionality
const cropBtn = document.querySelector('#secondary-toolbar .tool-btn[title="Crop"]');
cropBtn.addEventListener('click', () => {
    console.log('Crop button clicked');
    const selectedItem = ImageItem.selectedItems[0];
    if (selectedItem) {
        selectedItem.initCropMode();
    }
});

// Add event listener for exiting crop mode
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const selectedItem = ImageItem.selectedItems[0];
        if (selectedItem && selectedItem.cropOverlay) {
            selectedItem.exitCropMode();
        }
    }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copySelectedItems();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteItems();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        cloneSelectedItems();
    }
    // ..
});

// Add clone functionality
const cloneBtn = document.querySelector('#secondary-toolbar .tool-btn[title="Clone"]');
cloneBtn.addEventListener('click', () => {
    console.log('Clone button clicked');
    const selectedItem = ImageItem.selectedItems[0];
    if (selectedItem) {
        cloneSelectedItems();
    }
});

// Add magic wand functionality
const magicWandBtn = document.querySelector('#secondary-toolbar .tool-btn[title="Magic Wand"]');
magicWandBtn.addEventListener('click', handleMagicWand);

async function handleMagicWand() {
    console.log('Magic Wand button clicked');
    const selectedItems = ImageItem.selectedItems;
    if (selectedItems.length === 0) {
        console.log('No items selected');
        return;
    }

    showLoadingIndicator();

    for (const selectedItem of selectedItems) {
        try {
            const imageData = selectedItem.canvas.toDataURL('image/png');
            const file = dataURLtoFile(imageData, 'image.png');

            // Pass the zoomLevel to the removeBackground function
            const result = await removeBackground(file);

            const offsetX = 20;
            const offsetY = 20;
            const newImage = new ImageItem(result, selectedItem.x + offsetX, selectedItem.y + offsetY);
            const newZIndex = ImageItem.instances.length + 1;
            newImage.setZIndex(newZIndex);
            ImageItem.instances.push(newImage);

            selectedItem.deselect();
        } catch (error) {
            console.error('Error processing image:', error);
        }
    }

    hideLoadingIndicator();
    hideDropText();
}

// Helper function to convert data URL to File object
function dataURLtoFile(dataurl, filename) {
    let arr = dataurl.split(','),
        mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]),
        n = bstr.length,
        u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
}

// Add these functions to show/hide a loading indicator
function showLoadingIndicator() {
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.textContent = 'Processing...';
    loadingIndicator.style.position = 'fixed';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.padding = '10px';
    loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    loadingIndicator.style.color = 'white';
    loadingIndicator.style.borderRadius = '5px';
    loadingIndicator.style.zIndex = '9999';
    document.body.appendChild(loadingIndicator);
}

function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

// Get references to the buttons
const clearCanvasBtn = document.getElementById('clear-canvas-btn');
const deleteSelectedBtn = document.querySelector('[title="Delete Selected"]');

// Function to clear the entire canvas
function clearCanvas() {
    const dropArea = document.getElementById('drop-area');
    while (dropArea.firstChild) {
        dropArea.removeChild(dropArea.firstChild);
    }
    // Reset the ImageItem and TextItem instances
    ImageItem.instances = [];
    ImageItem.selectedItems = [];
    TextItem.instances = [];
    TextItem.selectedItems = [];
    
    // Reset the drop text
    const dropText = document.createElement('p');
    dropText.id = 'drop-text';
    dropText.textContent = 'Drop an image or Text';
    dropText.style.display = 'block';
    dropArea.appendChild(dropText);
    
    // Hide the clear canvas button
    clearCanvasBtn.style.display = 'none';
    
    // Hide the secondary toolbar and text toolbar
    ImageItem.hideSecondaryToolbar();
    TextItem.hideTextToolbar();
}

// Function to delete the selected images
function deleteSelected() {
    const dropArea = document.getElementById('drop-area');
    ImageItem.selectedItems.forEach(item => {
        if (item.canvas && item.canvas.parentNode) {
            item.canvas.parentNode.removeChild(item.canvas);
        }
        if (item.resizeOverlay && item.resizeOverlay.parentNode) {
            item.resizeOverlay.parentNode.removeChild(item.resizeOverlay);
        }
        const index = ImageItem.instances.indexOf(item);
        if (index > -1) {
            ImageItem.instances.splice(index, 1);
        }
    });
    
    ImageItem.selectedItems = [];
    
    // If no images left, show the drop text and hide the clear canvas button
    if (ImageItem.instances.length === 0) {
        const dropText = document.getElementById('drop-text');
        if (dropText) dropText.style.display = 'block';
        clearCanvasBtn.style.display = 'none';
        ImageItem.hideSecondaryToolbar();
    }
}

// Event listeners for the buttons
clearCanvasBtn.addEventListener('click', clearCanvas);
deleteSelectedBtn.addEventListener('click', deleteSelected);

// Add this near the other button selections
const collageBtn = document.querySelector('#toolbar-container .tool-btn[title="Organize Collage"]');

// Add this with the other button event listeners
collageBtn.addEventListener('click', () => {
    console.log('Collage button clicked');
    updateCollage(); // Call updateCollage instead of organizeCollage directly
    
    // Show the collage toolbar
    const collageToolbar = document.getElementById('collage-toolbar');
    if (collageToolbar) {
        collageToolbar.style.display = 'flex';
    }

    // Hide the main toolbar
    const mainToolbar = document.getElementById('main-toolbar');
    if (mainToolbar) {
        mainToolbar.style.opacity = '0';
        mainToolbar.style.visibility = 'hidden';
        mainToolbar.style.pointerEvents = 'none';
    }
});

// Get references to the sliders
const rowsSlider = document.querySelector('#collage-toolbar .tool-slider[title="Rows"] input');
const columnsSlider = document.querySelector('#collage-toolbar .tool-slider[title="Columns"] input');
const spacingSlider = document.querySelector('#collage-toolbar .tool-slider[title="Spacing"] input');

// Add event listeners for the sliders
rowsSlider.addEventListener('input', updateCollage);
columnsSlider.addEventListener('input', updateCollage);
spacingSlider.addEventListener('input', updateCollage);

function updateCollage() {
    const rows = parseInt(rowsSlider.value);
    const columns = parseInt(columnsSlider.value);
    const spacing = parseInt(spacingSlider.value);

    // Update the displayed values
    document.getElementById('rows-value').textContent = rows;
    document.getElementById('columns-value').textContent = columns;
    document.getElementById('spacing-value').textContent = spacing;

    // Call organizeCollage with the new values
    organizeCollage(ImageItem.instances, rows, columns, spacing);
}

// Export the images array if needed in other parts of your application
export { images };

document.addEventListener('DOMContentLoaded', () => {
    // ... (other initialization code)

    resizeDropArea();
});

// Add this function to handle zooming
// add zoomlevel to the function
        
let zoomOriginX, zoomOriginY;

function handleZoom(e) {
    e.preventDefault();
    const delta = e.deltaY;
    const oldZoomLevel = zoomLevel;
    
    if (delta > 0) {
        zoomLevel = Math.max(MIN_ZOOM, zoomLevel - ZOOM_SPEED);
    } else {
        zoomLevel = Math.min(MAX_ZOOM, zoomLevel + ZOOM_SPEED);
    }

    // Calculate zoom origin (mouse position)
    const rect = dropArea.getBoundingClientRect();
    zoomOriginX = e.clientX - rect.left;
    zoomOriginY = e.clientY - rect.top;

    const zoomFactor = zoomLevel / oldZoomLevel;

    ImageItem.instances.forEach(item => {
        // Calculate new position relative to zoom origin
        const dx = item.x - zoomOriginX;
        const dy = item.y - zoomOriginY;
        
        item.x = zoomOriginX + dx * zoomFactor;
        item.y = zoomOriginY + dy * zoomFactor;
        
        // Update size
        item.updateSizeNoResize(zoomLevel);
        item.updatePosition();
    });

    TextItem.instances.forEach(item => {
        // Calculate new position relative to zoom origin
        const dx = item.x - zoomOriginX;
        const dy = item.y - zoomOriginY;
        
        item.x = zoomOriginX + dx * zoomFactor;
        item.y = zoomOriginY + dy * zoomFactor;
        
        // Update size and font
        item.width *= zoomFactor;
        item.height *= zoomFactor;
        item.fontSize *= zoomFactor;
        item.updateStyle();
        item.renderText();
    });
}

// Add wheel event listener to the drop area
dropArea.addEventListener('wheel', handleZoom, { passive: false });

// Remove the handleDrag function as it's not needed anymore

function initializeToolbar() {
    const textButton = document.querySelector('.tool-btn[title="Text"]');
    textButton.addEventListener('click', addTextItem);

    // Add event listeners for text toolbar buttons
    const editColorBtn = document.querySelector('#text-toolbar .tool-btn[title="Edit Color"]');
    const colorPicker = document.getElementById('text-color-picker');
    const moveUpBtn = document.querySelector('#text-toolbar .tool-btn[title="Move Up"]');
    const moveDownBtn = document.querySelector('#text-toolbar .tool-btn[title="Move Down"]');
    const deleteTextBtn = document.querySelector('#text-toolbar .tool-btn[title="Delete Text"]'); // Add this line

    editColorBtn.addEventListener('click', () => {
        colorPicker.click();
    });

    colorPicker.addEventListener('input', (e) => {
        TextItem.selectedItems.forEach(item => item.setColor(e.target.value));
    });

    moveUpBtn.addEventListener('click', () => {
        TextItem.selectedItems.forEach(item => item.incrementZIndex());
        TextItem.updateAllZIndices();
    });

    moveDownBtn.addEventListener('click', () => {
        TextItem.selectedItems.forEach(item => item.decrementZIndex());
        TextItem.updateAllZIndices();
    });

    // Add this event listener for the delete button
    deleteTextBtn.addEventListener('click', () => {
        deleteSelectedTextItems();
    });

    // ... rest of the existing code ...
}

function addTextItem() {
    const dropArea = document.getElementById('drop-area');
    const x = dropArea.clientWidth / 2;
    const y = dropArea.clientHeight / 2;
    const textItem = new TextItem('New Text', x, y);
    TextItem.instances.push(textItem);
    textItem.select();
    textItem.startEditing();

    // Set the initial color of the color picker
    const colorPicker = document.getElementById('text-color-picker');
    if (colorPicker) {
        colorPicker.value = getComputedStyle(document.documentElement).getPropertyValue('--default-text-color').trim();
    }

    // Hide the drop text
    hideDropText();

    // Show the clear canvas button
    const clearCanvasBtn = document.getElementById('clear-canvas-btn');
    if (clearCanvasBtn) {
        clearCanvasBtn.style.display = 'inline-block';
    }
}

// Add this function to delete selected text items
function deleteSelectedTextItems() {
    TextItem.selectedItems.forEach(item => {
        item.remove();
        const index = TextItem.instances.indexOf(item);
        if (index > -1) {
            TextItem.instances.splice(index, 1);
        }
    });

    TextItem.selectedItems = [];
    TextItem.hideTextToolbar();

    // If no items left, show the drop text and hide the clear canvas button
    if (TextItem.instances.length === 0 && ImageItem.instances.length === 0) {
        const dropText = document.getElementById('drop-text');
        if (dropText) dropText.style.display = 'block';
        const clearCanvasBtn = document.getElementById('clear-canvas-btn');
        if (clearCanvasBtn) clearCanvasBtn.style.display = 'none';
    }
}

// Make sure to call initializeToolbar() if it's not already being called
initializeToolbar();

// Add this function near the top of the file, after the existing imports
function selectAllItems() {
    ImageItem.instances.forEach(item => item.select());
    TextItem.instances.forEach(item => item.select());
    
    if (ImageItem.instances.length > 0) {
        ImageItem.showSecondaryToolbar();
    } else if (TextItem.instances.length > 0) {
        TextItem.showTextToolbar();
    }
}

// Add this event listener near the bottom of the file, before the initializeToolbar() call
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAllItems();
    }
});

// Add this event listener for the delete key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
    }
});

function copySelectedItems() {
    copiedItems = [];
    ImageItem.selectedItems.forEach(item => {
        copiedItems.push({
            type: 'image',
            src: item.src,
            width: item.width,
            height: item.height,
            zIndex: item.zIndex
        });
    });
    TextItem.selectedItems.forEach(item => {
        copiedItems.push({
            type: 'text',
            text: item.text,
            fontSize: item.fontSize,
            fontFamily: item.fontFamily,
            color: item.color,
            width: item.width,
            height: item.height,
            zIndex: item.zIndex
        });
    });
    console.log('Items copied:', copiedItems.length);
}

function pasteItems(offsetX = 5, offsetY = 5) {
    copiedItems.forEach(item => {
        if (item.type === 'image') {
            const newImage = new ImageItem(item.src, item.x + offsetX, item.y + offsetY);
            newImage.width = item.width;
            newImage.height = item.height;
            newImage.setZIndex(ImageItem.instances.length + 1);
            ImageItem.instances.push(newImage);
        } else if (item.type === 'text') {
            const newText = new TextItem(item.text, item.x + offsetX, item.y + offsetY);
            newText.fontSize = item.fontSize;
            newText.fontFamily = item.fontFamily;
            newText.color = item.color;
            newText.width = item.width;
            newText.height = item.height;
            newText.setZIndex(TextItem.instances.length + 1);
            TextItem.instances.push(newText);
        }
    });
    hideDropText();
    updateClearCanvasButtonVisibility();
}

function cloneSelectedItems(offsetX = -50, offsetY = 10) {
    const clonedItems = [];
    ImageItem.selectedItems.forEach(item => {
        const newImage = new ImageItem(item.src, item.x + item.width * zoomLevel + offsetX, item.y + offsetY);
        newImage.width = item.width;
        newImage.height = item.height;
        newImage.setZIndex(ImageItem.instances.length + 1);
        ImageItem.instances.push(newImage);
        clonedItems.push(newImage);
        
        // Deselect the original item
        item.deselect();
        
        // Select the new cloned item
        newImage.select();
    });
    TextItem.selectedItems.forEach(item => {
        const newText = new TextItem(item.text, item.x + offsetX, item.y + offsetY);
        newText.fontSize = item.fontSize;
        newText.fontFamily = item.fontFamily;
        newText.color = item.color;
        newText.width = item.width;
        newText.height = item.height;
        newText.setZIndex(TextItem.instances.length + 1);
        TextItem.instances.push(newText);
        clonedItems.push(newText);
        
        // Deselect the original item
        item.deselect();
        
        // Select the new cloned item
        newText.select();
    });
    hideDropText();
    updateClearCanvasButtonVisibility();
    
    // Update the secondary toolbar visibility
    if (clonedItems.length > 0) {
        if (clonedItems[0] instanceof ImageItem) {
            ImageItem.showSecondaryToolbar();
        } else if (clonedItems[0] instanceof TextItem) {
            TextItem.showTextToolbar();
        }
    }
    
    return clonedItems;
}

function updateClearCanvasButtonVisibility() {
    const clearCanvasBtn = document.getElementById('clear-canvas-btn');
    if (clearCanvasBtn) {
        clearCanvasBtn.style.display = (ImageItem.instances.length > 0 || TextItem.instances.length > 0) ? 'inline-block' : 'none';
    }
}

// Add this near the button selections
const combineBtn = document.querySelector('#secondary-toolbar .tool-btn[title="Combine"]');

// Show combine button when multiple images are selected
function updateCombineButtonVisibility() {
    combineBtn.style.display = (ImageItem.selectedItems.length > 1) ? 'inline-block' : 'none';
}

// Call this function whenever the selection changes
document.addEventListener('selectionchange', updateCombineButtonVisibility);

// Add event listener for the combine button
combineBtn.addEventListener('click', () => {
    const selectedItems = ImageItem.selectedItems;
    if (selectedItems.length > 1) {
        const { minX, minY } = selectedItems.reduce((acc, item) => ({
            minX: Math.min(acc.minX, item.x),
            minY: Math.min(acc.minY, item.y)
        }), { minX: Infinity, minY: Infinity });

        const combinedImageSrc = combineImages(selectedItems);
        const newImage = new ImageItem(combinedImageSrc, minX, minY);
        newImage.setZIndex(Math.max(...selectedItems.map(item => item.zIndex)) + 1);
        ImageItem.instances.push(newImage);
        
        // Remove original items
        selectedItems.forEach(item => {
            const index = ImageItem.instances.indexOf(item);
            if (index > -1) {
                ImageItem.instances.splice(index, 1);
            }
            item.remove(); // Assuming there's a remove method to remove the item from the DOM
        });

        // Select the new combined image
        newImage.select();
    }
});

// Function to combine images into a single image
function combineImages(selectedItems) {
    // Create a canvas to draw the combined image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size based on the selected images
    const { minX, minY, maxX, maxY } = selectedItems.reduce((acc, item) => {
        acc.minX = Math.min(acc.minX, item.x);
        acc.minY = Math.min(acc.minY, item.y);
        acc.maxX = Math.max(acc.maxX, item.x + item.width);
        acc.maxY = Math.max(acc.maxY, item.y + item.height);
        return acc;
    }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

    const width = maxX - minX;
    const height = maxY - minY;
    canvas.width = width;
    canvas.height = height;

    // Sort items by z-index before drawing
    const sortedItems = selectedItems.sort((a, b) => a.zIndex - b.zIndex);

    // Draw each selected image onto the canvas in order of z-index
    sortedItems.forEach(item => {
        const img = new Image();
        img.src = item.src;
        ctx.drawImage(img, item.x - minX, item.y - minY, item.width, item.height);
    });

    return canvas.toDataURL('image/png');
}

// Update the combine button visibility when selection changes
document.addEventListener('selectionchange', updateCombineButtonVisibility);