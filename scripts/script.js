import ImageItem from './ImageItem.js';
import organizeCollage from './collage.js';

const body = document.body;
const dropArea = document.getElementById('drop-area');
const dropText = document.getElementById('drop-text');

let images = [];

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
    }
}

// Add this new function to handle drop area dragging
function handleDropAreaDrag(e) {
    if (isDraggingDropArea) {
        const deltaX = (e.clientX - dragStartX);
        const deltaY = (e.clientY - dragStartY);

        ImageItem.instances.forEach(item => {
            item.x += deltaX;
            item.y += deltaY;
            item.updatePosition();
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
});

// Add clone functionality
const cloneBtn = document.querySelector('#secondary-toolbar .tool-btn[title="Clone"]');
cloneBtn.addEventListener('click', () => {
    console.log('Clone button clicked');
    const selectedItem = ImageItem.selectedItems[0];
    if (selectedItem) {
        // Implement clone functionality here
        console.log('Cloning not implemented yet');
    }
});

// Add magic wand functionality
const magicWandBtn = document.querySelector('#secondary-toolbar .tool-btn[title="Magic Wand"]');
magicWandBtn.addEventListener('click', () => {
    console.log('Magic Wand button clicked');
    const selectedItem = ImageItem.selectedItems[0];
    if (selectedItem) {
        // Implement magic wand functionality here
        console.log('Magic Wand not implemented yet');
    }
});

// Get references to the buttons
const clearCanvasBtn = document.getElementById('clear-canvas-btn');
const deleteSelectedBtn = document.querySelector('[title="Delete Selected"]');

// Function to clear the entire canvas
function clearCanvas() {
    const dropArea = document.getElementById('drop-area');
    while (dropArea.firstChild) {
        dropArea.removeChild(dropArea.firstChild);
    }
    // Reset the ImageItem instances
    ImageItem.instances = [];
    ImageItem.selectedItems = [];
    
    // Reset the drop text
    const dropText = document.createElement('p');
    dropText.id = 'drop-text';
    dropText.textContent = 'Drop an image';
    dropArea.appendChild(dropText);
    
    // Hide the clear canvas button
    clearCanvasBtn.style.display = 'none';
    
    // Hide the secondary toolbar
    ImageItem.hideSecondaryToolbar();
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
    organizeCollage(ImageItem.instances);
});

// Export the images array if needed in other parts of your application
export { images };

document.addEventListener('DOMContentLoaded', () => {
    // ... (other initialization code)

    resizeDropArea();
});

// Add this function to handle zooming
// add zoomlevel to the function
        
function handleZoom(e) {
    e.preventDefault();
    const delta = e.deltaY;
    if (delta > 0) {
        zoomLevel -= ZOOM_SPEED;
    } else {
        zoomLevel += ZOOM_SPEED;
    }
    zoomLevel = Math.max(MIN_ZOOM, Math.min(zoomLevel, MAX_ZOOM));
    ImageItem.instances.forEach(item => {
        item.updatePosition();
        //update size of item relative to the mouse position
        item.updateSizeNoResize(zoomLevel);
    });
}

// Add wheel event listener to the drop area
dropArea.addEventListener('wheel', handleZoom, { passive: false });

// Remove the handleDrag function as it's not needed anymore