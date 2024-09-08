import ImageItem from './ImageItem.js';

const body = document.body;
const dropArea = document.getElementById('drop-area');
const dropText = document.getElementById('drop-text');

let images = [];

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
}

function handleFiles(files, x, y) {
    Array.from(files).forEach(file => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onloadend = () => {
                const newImage = new ImageItem(reader.result, x, y);
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

// Add event listeners to drop area to deselect all images when clicking outside
dropArea.addEventListener('mousedown', handleDropAreaClick);
dropArea.addEventListener('mouseup', handleDropAreaClick);
dropArea.addEventListener('click', (e) => {
    if (e.target === dropArea) {
        ImageItem.deselectAll();    
    }
});

function handleDropAreaClick(e) {
    if (e.target === dropArea) {
        ImageItem.deselectAll();
    }
}

// Resize drop area to window size
function resizeDropArea() {
    const toolbar = document.getElementById('toolbar');
    const toolbarHeight = toolbar.offsetHeight;
    dropArea.style.width = `${window.innerWidth}px`;
    dropArea.style.height = `${window.innerHeight - toolbarHeight}px`;
}

window.addEventListener('resize', resizeDropArea);
resizeDropArea(); // Initial call to set the size

window.addEventListener('resize', () => {
    images.forEach(image => image.resize());
});

// Add these lines after your existing event listeners
const moveUpBtn = document.querySelector('.tool-btn[title="Move Up"]');
const moveDownBtn = document.querySelector('.tool-btn[title="Move Down"]');

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
const cropBtn = document.querySelector('.tool-btn[title="Crop"]');
cropBtn.addEventListener('click', () => {
    const selectedItem = ImageItem.selectedItems[0];
    if (selectedItem) {
        selectedItem.initCropMode();
    }
});

// Export the images array if needed in other parts of your application
export { images };