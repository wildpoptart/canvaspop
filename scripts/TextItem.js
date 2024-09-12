class TextItem {
    constructor(text, x, y, id = null) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.id = id || this.generateId();
        this.fontSize = 24; // Set an initial font size
        this.fontFamily = 'Arial';
        this.color = getComputedStyle(document.documentElement).getPropertyValue('--default-text-color').trim();
        this.isSelected = false;
        this.zIndex = TextItem.getMaxZIndex() + 1;
        this.rotation = 0;
        this.width = 100; // Default width, adjust as needed
        this.height = 30; // Default height, adjust as needed
        this.scale = 1;
        this.isEditing = false;
        this.createTextElement();
        this.createEditableInput();
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    createTextElement() {
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'text-item';
        this.canvas.style.position = 'absolute';
        this.canvas.style.cursor = 'move';
        this.ctx = this.canvas.getContext('2d');
        this.updateCanvasSize();
        this.renderText();
        document.getElementById('drop-area').appendChild(this.canvas);
        this.addEventListeners();
    }

    updateCanvasSize() {
        this.canvas.width = this.width * this.scale;
        this.canvas.height = this.height * this.scale;
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
    }

    renderText() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);

        // Set text properties
        this.ctx.textBaseline = 'middle';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = this.color;

        // Set the font size to fit the container
        this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;

        // Draw the text
        this.ctx.fillText(this.text, this.width / 2, this.height / 2);

        this.ctx.restore();
    }

    createResizeOverlay() {
        if (!this.resizeOverlay) {
            this.resizeOverlay = document.createElement('div');
            this.resizeOverlay.className = 'text-item-resize-overlay';
            this.resizeOverlay.innerHTML = `
                <div class="text-item-resize-handle top-left"></div>
                <div class="text-item-resize-handle top-right"></div>
                <div class="text-item-resize-handle bottom-left"></div>
                <div class="text-item-resize-handle bottom-right"></div>
                <div class="text-item-rotate-handle"></div>
            `;
            document.getElementById('drop-area').appendChild(this.resizeOverlay);
            this.addResizeListeners();
        }
        this.updateResizeOverlay();
    }

    updateResizeOverlay() {
        if (this.resizeOverlay) {
            this.resizeOverlay.style.left = `${this.x}px`;
            this.resizeOverlay.style.top = `${this.y}px`;
            this.resizeOverlay.style.width = `${this.width}px`;
            this.resizeOverlay.style.height = `${this.height}px`;
            this.resizeOverlay.style.transform = `rotate(${this.rotation}rad)`;
        }
    }

    removeResizeOverlay() {
        if (this.resizeOverlay && this.resizeOverlay.parentNode) {
            this.resizeOverlay.parentNode.removeChild(this.resizeOverlay);
            this.resizeOverlay = null;
        }
    }

    createEditableInput() {
        this.editableInput = document.createElement('textarea');
        this.editableInput.className = 'text-item-editable';
        this.editableInput.style.position = 'absolute';
        this.editableInput.style.display = 'none';
        this.editableInput.style.fontFamily = this.fontFamily;
        this.editableInput.style.color = this.color;
        this.editableInput.style.border = 'none';
        this.editableInput.style.outline = 'none';
        this.editableInput.style.resize = 'none';
        this.editableInput.style.overflow = 'hidden';
        this.editableInput.style.background = 'transparent';
        this.editableInput.style.textAlign = 'center';
        this.editableInput.style.verticalAlign = 'middle';
        this.editableInput.style.zIndex = this.zIndex; // Set initial z-index
        this.editableInput.style.wordWrap = 'break-word'; // Enable word wrapping
        document.getElementById('drop-area').appendChild(this.editableInput);
    }

    updateStyle() {
        this.canvas.style.left = `${this.x}px`;
        this.canvas.style.top = `${this.y}px`;
        this.canvas.style.zIndex = this.zIndex;
        this.canvas.style.transform = `rotate(${this.rotation}rad)`;
        this.updateCanvasSize();
        if (!this.isEditing) {
            this.renderText();
        }
        this.updateEditableInput();
        this.updateResizeOverlay();
    }

    updateEditableInput() {
        this.editableInput.style.left = `${this.x}px`;
        this.editableInput.style.top = `${this.y}px`;
        this.editableInput.style.width = `${this.width}px`;
        this.editableInput.style.height = `${this.height}px`;
        this.editableInput.style.transform = `rotate(${this.rotation}rad)`;
        this.editableInput.style.fontSize = `${this.fontSize}px`;
        this.editableInput.style.lineHeight = `${this.height}px`;
        this.editableInput.style.zIndex = this.zIndex; // Update z-index
        this.editableInput.style.color = this.color; // Add this line to ensure color is updated
    }

    addEventListeners() {
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('click', this.onClick.bind(this));
        this.canvas.addEventListener('dblclick', this.onDoubleClick.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
    }

    addResizeListeners() {
        const handles = this.resizeOverlay.querySelectorAll('.text-item-resize-handle');
        handles.forEach(handle => {
            handle.addEventListener('mousedown', this.startResize.bind(this));
        });

        const rotateHandle = this.resizeOverlay.querySelector('.text-item-rotate-handle');
        rotateHandle.addEventListener('mousedown', this.startRotate.bind(this));
    }

    startResize(e) {
        this.isResizing = true;
        this.resizeStartX = e.clientX;
        this.resizeStartY = e.clientY;
        this.resizeStartWidth = this.width;
        this.resizeStartHeight = this.height;
        this.resizeHandle = e.target.className.split(' ')[1];
        e.stopPropagation();
    }

    startRotate(e) {
        this.isRotating = true;
        const rect = this.canvas.getBoundingClientRect();
        this.centerX = rect.left + rect.width / 2;
        this.centerY = rect.top + rect.height / 2;
        e.stopPropagation();
    }

    onMouseDown(e) {
        if (!TextItem.isCroppingActive) {
            this.isDragging = true;
            const rect = this.canvas.getBoundingClientRect();
            this.dragOffsetX = e.clientX - rect.left;
            this.dragOffsetY = e.clientY - rect.top;
            e.preventDefault();
        }
    }

    onMouseMove(e) {
        if (this.isDragging && !TextItem.isCroppingActive) {
            const dropArea = document.getElementById('drop-area');
            const dropAreaRect = dropArea.getBoundingClientRect();
            this.x = Math.max(0, Math.min(e.clientX - dropAreaRect.left - this.dragOffsetX, dropArea.clientWidth - this.width));
            this.y = Math.max(0, Math.min(e.clientY - dropAreaRect.top - this.dragOffsetY, dropArea.clientHeight - this.height));
            this.updateStyle();
        } else if (this.isResizing) {
            this.resize(e);
        } else if (this.isRotating) {
            this.rotate(e);
        }
    }

    onMouseUp() {
        this.isDragging = false;
        this.isResizing = false;
        this.isRotating = false;
    }

    resize(e) {
        const dx = e.clientX - this.resizeStartX;
        const dy = e.clientY - this.resizeStartY;
        let newWidth, newHeight, newX, newY;

        switch (this.resizeHandle) {
            case 'top-left':
                newWidth = Math.max(20, this.resizeStartWidth - dx);
                newHeight = Math.max(20, this.resizeStartHeight - dy);
                newX = this.x + (this.resizeStartWidth - newWidth);
                newY = this.y + (this.resizeStartHeight - newHeight);
                break;
            case 'top-right':
                newWidth = Math.max(20, this.resizeStartWidth + dx);
                newHeight = Math.max(20, this.resizeStartHeight - dy);
                newX = this.x;
                newY = this.y + (this.resizeStartHeight - newHeight);
                break;
            case 'bottom-left':
                newWidth = Math.max(20, this.resizeStartWidth - dx);
                newHeight = Math.max(20, this.resizeStartHeight + dy);
                newX = this.x + (this.resizeStartWidth - newWidth);
                newY = this.y;
                break;
            case 'bottom-right':
                newWidth = Math.max(20, this.resizeStartWidth + dx);
                newHeight = Math.max(20, this.resizeStartHeight + dy);
                newX = this.x;
                newY = this.y;
                break;
        }

        this.width = newWidth;
        this.height = newHeight;
        this.x = newX;
        this.y = newY;

        // Adjust font size based on the new dimensions
        this.fontSize = Math.min(this.width, this.height) * 0.8; // 80% of the smaller dimension

        this.updateStyle();
        this.renderText();
    }

    rotate(e) {
        const angle = Math.atan2(e.clientY - this.centerY, e.clientX - this.centerX);
        this.rotation = angle;
        this.updateStyle();
    }

    onClick(e) {
        if (!this.isDragging && !TextItem.isCroppingActive) {
            if (e.shiftKey) {
                this.toggleSelect();
            } else {
                TextItem.deselectAll();
                this.select();
            }
        }
        e.stopPropagation();
    }

    onDoubleClick(e) {
        if (!TextItem.isCroppingActive) {
            this.startEditing();
        }
        e.stopPropagation();
    }

    select() {
        this.isSelected = true;
        this.canvas.style.outline = '2px solid #007bff';
        if (!TextItem.selectedItems.includes(this)) {
            TextItem.selectedItems.push(this);
        }
        TextItem.showTextToolbar();
        this.createResizeOverlay();
    }

    deselect() {
        this.isSelected = false;
        this.canvas.style.outline = 'none';
        const index = TextItem.selectedItems.indexOf(this);
        if (index > -1) {
            TextItem.selectedItems.splice(index, 1);
        }
        if (TextItem.selectedItems.length === 0) {
            TextItem.hideTextToolbar();
        }
        this.removeResizeOverlay();
    }

    toggleSelect() {
        if (this.isSelected) {
            this.deselect();
        } else {
            this.select();
        }
    }

    static deselectAll() {
        TextItem.selectedItems.forEach(item => item.deselect());
        TextItem.selectedItems = [];
        TextItem.hideTextToolbar();
    }

    static getMaxZIndex() {
        return Math.max(0, ...TextItem.instances.map(item => item.zIndex));
    }

    setZIndex(newZIndex) {
        this.zIndex = Math.max(0, Math.min(newZIndex, TextItem.getMaxZIndex() + 1));
        this.updateStyle();
    }

    incrementZIndex() {
        this.setZIndex(this.zIndex + 1);
    }

    decrementZIndex() {
        this.setZIndex(this.zIndex - 1);
    }

    static updateAllZIndices() {
        const sortedItems = TextItem.instances.slice().sort((a, b) => a.zIndex - b.zIndex);
        sortedItems.forEach((item, index) => {
            item.zIndex = index + 1;
            item.updateStyle();
        });
    }

    setText(newText) {
        this.text = newText;
        this.renderText();
    }

    setFontSize(newSize) {
        this.fontSize = newSize;
        this.editableInput.style.fontSize = `${this.fontSize}px`;
        this.renderText();
    }

    setFontFamily(newFamily) {
        this.fontFamily = newFamily;
        this.editableInput.style.fontFamily = this.fontFamily;
        this.renderText();
    }

    setColor(newColor) {
        this.color = newColor;
        this.editableInput.style.color = this.color;
        this.canvas.style.color = this.color; // Add this line to update the canvas color
        this.renderText();
        // Update the color picker value
        const colorPicker = document.getElementById('text-color-picker');
        if (colorPicker) {
            colorPicker.value = this.color;
        }
        // Force a re-render for both editing and non-editing states
        if (this.isEditing) {
            this.updateEditableInput();
        } else {
            this.updateStyle();
        }
    }

    setRotation(angle) {
        this.rotation = angle;
        this.updateStyle();
    }

    remove() {
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        if (this.editableInput && this.editableInput.parentNode) {
            this.editableInput.parentNode.removeChild(this.editableInput);
        }
        this.removeResizeOverlay();
        const index = TextItem.instances.indexOf(this);
        if (index > -1) {
            TextItem.instances.splice(index, 1);
        }
    }

    static showTextToolbar() {
        const mainToolbar = document.getElementById('main-toolbar');
        const secondaryToolbar = document.getElementById('secondary-toolbar');
        const textToolbar = document.getElementById('text-toolbar');
        
        mainToolbar.style.display = 'none';
        secondaryToolbar.classList.remove('visible');
        textToolbar.classList.add('visible');
        
        // Remove the code that adds z-index buttons
    }

    static hideTextToolbar() {
        const mainToolbar = document.getElementById('main-toolbar');
        const secondaryToolbar = document.getElementById('secondary-toolbar');
        const textToolbar = document.getElementById('text-toolbar');
        
        mainToolbar.style.display = 'flex';
        secondaryToolbar.classList.remove('visible');
        textToolbar.classList.remove('visible');
    }

    static handleDropAreaClick(e) {
        if (e.target.id === 'drop-area') {
            TextItem.deselectAll();
        }
    }

    startEditing() {
        this.isEditing = true;
        this.editableInput.value = this.text;
        this.editableInput.style.display = 'block';
        this.canvas.style.display = 'none';  // Hide the canvas completely
        this.updateEditableInput();
        this.editableInput.focus();

        this.editableInput.addEventListener('input', this.updateTextSize.bind(this));
        this.editableInput.addEventListener('blur', this.stopEditing.bind(this));
    }

    stopEditing() {
        this.isEditing = false;
        this.text = this.editableInput.value;
        this.editableInput.style.display = 'none';
        this.canvas.style.display = 'block';  // Show the canvas
        this.updateTextSize();
        this.renderText();

        this.editableInput.removeEventListener('input', this.updateTextSize.bind(this));
    }

    updateTextSize() {
        const padding = 10; // Padding around the text
        const minWidth = 50; // Minimum width of the text box
        const minHeight = 30; // Minimum height of the text box

        // Create a temporary span to measure the text
        const tempSpan = document.createElement('span');
        tempSpan.style.font = `${this.fontSize}px ${this.fontFamily}`;
        tempSpan.style.whiteSpace = 'pre-wrap';
        tempSpan.style.display = 'inline-block';
        tempSpan.style.maxWidth = `${this.width}px`; // Set max width to current width
        tempSpan.textContent = this.editableInput.value || this.text;
        document.body.appendChild(tempSpan);

        // Get the dimensions of the text
        const textWidth = Math.max(minWidth, tempSpan.offsetWidth + padding * 2);
        const textHeight = Math.max(minHeight, tempSpan.offsetHeight + padding * 2);

        // Remove the temporary span
        document.body.removeChild(tempSpan);

        // Update dimensions
        this.width = textWidth;
        this.height = textHeight;

        // Update the editable input and canvas
        this.updateEditableInput();
        this.updateCanvasSize();
        this.renderText();
    }

    updateEditableInput() {
        this.editableInput.style.left = `${this.x}px`;
        this.editableInput.style.top = `${this.y}px`;
        this.editableInput.style.width = `${this.width}px`;
        this.editableInput.style.height = `${this.height}px`;
        this.editableInput.style.transform = `rotate(${this.rotation}rad)`;
        this.editableInput.style.fontSize = `${this.fontSize}px`;
        this.editableInput.style.lineHeight = `${this.fontSize}px`;
        this.editableInput.style.padding = '5px'; // Add some padding
        this.editableInput.style.zIndex = this.zIndex;
        this.editableInput.style.color = this.color;
    }

    renderText() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);

        // Set text properties
        this.ctx.textBaseline = 'top';
        this.ctx.textAlign = 'left';
        this.ctx.fillStyle = this.color;
        this.ctx.font = `${this.fontSize}px ${this.fontFamily}`;

        // Draw the text with word wrap
        const words = this.text.split(' ');
        let line = '';
        let y = 5; // Start with a small padding
        const maxWidth = this.width - 10; // Subtract padding from both sides

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = this.ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                this.ctx.fillText(line, 5, y);
                line = words[n] + ' ';
                y += this.fontSize + 2;
            } else {
                line = testLine;
            }
        }
        this.ctx.fillText(line, 5, y);

        this.ctx.restore();
    }
}

TextItem.selectedItems = [];
TextItem.instances = [];
TextItem.isCroppingActive = false;

export default TextItem;
