class ImageItem {
     constructor(src, x, y) {
          this.src = src;
          this.width = Math.round(window.innerWidth * 0.2);  // 20% of window width
          this.height = 0;  // Will be calculated to maintain aspect ratio
          this.canvas = this.createCanvasElement();
          this.drawImage();
          this.isSelected = false;
          this.dragOffsetX = 0;
          this.dragOffsetY = 0;
          this.x = x - this.width / 2;  // Adjust x to center the image
          this.y = y - this.height / 2;  // Adjust y to center the image
          this.zIndex = 0;  // Initialize zIndex to 0
          this.addEventListeners();
          this.setZIndex(ImageItem.instances.length + 1);
          this.isCropMode = false;
     }

     static getMaxZIndex() {
          const maxZIndex = ImageItem.instances.length;
          console.log(`Max z-index: ${maxZIndex}`);
          return maxZIndex;
     }

     setZIndex(newZIndex) {
          const oldZIndex = this.zIndex;
          this.zIndex = Math.max(0, Math.min(newZIndex, ImageItem.instances.length));
          this.canvas.style.zIndex = this.zIndex;
          this.swapZIndex(oldZIndex, this.zIndex);
          ImageItem.updateAllZIndices();
     }

     swapZIndex(oldZIndex, newZIndex) {
          const itemToSwap = ImageItem.instances.find(item => item !== this && item.zIndex === newZIndex);
          if (itemToSwap) {
               itemToSwap.zIndex = oldZIndex;
               itemToSwap.canvas.style.zIndex = oldZIndex;
          }
     }

     static updateAllZIndices() {
          const sortedItems = ImageItem.instances.slice().sort((a, b) => a.zIndex - b.zIndex);
          sortedItems.forEach((item, index) => {
               item.zIndex = index;
               item.canvas.style.zIndex = index;
          });
          console.log('Updated all z-indices');
     }

     createCanvasElement() {
          const canvas = document.createElement('canvas');
          canvas.className = 'image-canvas';
          canvas.draggable = true; // Make the canvas draggable
          document.getElementById('drop-area').appendChild(canvas);
          return canvas;
     }

     drawImage() {
          const ctx = this.canvas.getContext('2d');
          const img = new Image();
          img.src = this.src;
          img.onload = () => {
               // Calculate height to maintain aspect ratio
               const aspectRatio = img.width / img.height;
               this.height = Math.round(this.width / aspectRatio);

               // Set canvas size
               this.canvas.width = this.width;
               this.canvas.height = this.height;

               // Draw the resized image
               ctx.drawImage(img, 0, 0, this.width, this.height);
               // this.x = this.x/2;  // Adjust x to center the image
               this.y = this.y/2;  // Adjust y to center the image
               this.updatePosition();
          };
     }

     addEventListeners() {
          this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
          this.canvas.addEventListener('click', this.onClick.bind(this));
          document.addEventListener('mousemove', this.onMouseMove.bind(this));
          document.addEventListener('mouseup', this.onMouseUp.bind(this));
     }

     onMouseDown(e) {
          if (!this.isCropMode) {
               this.isDragging = true;
               this.dragOffsetX = e.clientX - this.x;
               this.dragOffsetY = e.clientY - this.y;
               e.preventDefault();
          }
     }

     onMouseMove(e) {
          if (this.isDragging && !this.isCropMode) {
               const dropArea = document.getElementById('drop-area');
               this.x = Math.max(0, Math.min(e.clientX - this.dragOffsetX, dropArea.clientWidth - this.width));
               this.y = Math.max(0, Math.min(e.clientY - this.dragOffsetY, dropArea.clientHeight - this.height));
               this.updatePosition();
          }
     }

     onMouseUp(e) {
          if (!this.isCropMode) {
               this.isDragging = false;
               console.log('Selected items:', ImageItem.selectedItems.length);
          }
     }

     onClick(e) {
          if (!this.isDragging) {
               if (e.shiftKey) {
                    this.toggleSelect();
               } else {
                    ImageItem.deselectAll();
                    this.select();
               }
          }
          e.stopPropagation();
     }

     updatePosition() {
          this.canvas.style.left = `${this.x}px`;
          this.canvas.style.top = `${this.y}px`;
          this.canvas.style.zIndex = this.zIndex;  // Set the z-index
     }

     select() {
          this.isSelected = true;
          this.updateSelectionStyle();
          if (!ImageItem.selectedItems.includes(this)) {
               ImageItem.selectedItems.push(this);
          }
          ImageItem.showSecondaryToolbar();
          console.log('Selected items:', ImageItem.selectedItems.length);
     }

     deselect() {
          this.isSelected = false;
          this.updateSelectionStyle();
          const index = ImageItem.selectedItems.indexOf(this);
          if (index > -1) {
               ImageItem.selectedItems.splice(index, 1);
          }
          if (ImageItem.selectedItems.length === 0) {
               ImageItem.hideSecondaryToolbar();
          }
          console.log('Selected items:', ImageItem.selectedItems.length);
     }

     toggleSelect() {
          if (this.isSelected) {
               this.deselect();
          } else {
               this.select();
          }
     }

     static deselectAll() {
          ImageItem.selectedItems.forEach(item => item.deselect());
          ImageItem.selectedItems = [];
          ImageItem.hideSecondaryToolbar();
     }

     updateSelectionStyle() {
          if (this.isSelected) {
               this.canvas.style.outline = '3px solid #007bff';
          } else {
               this.canvas.style.outline = 'none';
          }
     }

     hide() {
          this.canvas.style.display = 'none';
     }

     static updateAllPositions(deltaX, deltaY) {
          ImageItem.instances.forEach(instance => {
               instance.x += deltaX;
               instance.y += deltaY;
               instance.canvas.style.left = `${instance.x}px`;
               instance.canvas.style.top = `${instance.y}px`;
          });
     }

     resize() {
          this.width = Math.round(window.innerWidth * 0.2);
          this.drawImage();
     }

     initCropMode() {
          this.isCropMode = true;
          // Store the current selection style
          this.previousOutline = this.canvas.style.outline;
          // Temporarily remove the selection border
          this.canvas.style.outline = 'none';

          this.cropOverlay = document.createElement('div');
          this.cropOverlay.className = 'crop-overlay';
          this.cropOverlay.style.position = 'absolute';
          this.cropOverlay.style.border = '2px dashed #fff';
          this.cropOverlay.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.5)';
          this.cropOverlay.style.cursor = 'move';

          const cropConfirmBtn = document.getElementById('crop-confirm-btn');
          cropConfirmBtn.style.display = 'inline-block';
          cropConfirmBtn.onclick = this.confirmCrop.bind(this);

          const cropCancelBtn = document.getElementById('crop-cancel-btn');
          cropCancelBtn.style.display = 'inline-block';
          cropCancelBtn.onclick = this.exitCropMode.bind(this);

          this.canvas.parentNode.appendChild(this.cropOverlay);

          // Align the crop overlay with the image, accounting for the canvas position
          this.cropOverlay.style.left = `${this.x}px`;
          this.cropOverlay.style.top = `${this.y}px`;
          this.cropOverlay.style.width = `${this.width}px`;
          this.cropOverlay.style.height = `${this.height}px`;

          // Add resize handles
          const handles = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];
          handles.forEach(position => {
               const handle = document.createElement('div');
               handle.className = `crop-handle ${position}`;
               this.cropOverlay.appendChild(handle);
          });

          this.addCropEventListeners();

          this.cropOverlay.addEventListener('mousedown', (e) => {
               e.stopPropagation();
          });

          this.cropOverlay.addEventListener('click', (e) => {
               e.stopPropagation();
          });

          // Show only the crop confirm and cancel buttons, hide others
          const secondaryToolbar = document.getElementById('secondary-toolbar');
          Array.from(secondaryToolbar.children).forEach(button => {
               if (button.id === 'crop-confirm-btn' || button.id === 'crop-cancel-btn') {
                    button.style.display = 'inline-block';
               } else {
                    button.style.display = 'none';
               }
          });

          // Add event listener for Enter key
          this.confirmCropOnEnter = (e) => {
               if (e.key === 'Enter') {
                    this.confirmCrop();
               }
          };
          document.addEventListener('keydown', this.confirmCropOnEnter);
     }

     addCropEventListeners() {
          this.cropOverlay.addEventListener('mousedown', this.onCropMouseDown.bind(this));
          document.addEventListener('mousemove', this.onCropMouseMove.bind(this));
          document.addEventListener('mouseup', this.onCropMouseUp.bind(this));

          // Add listeners for resize handles
          const handles = this.cropOverlay.querySelectorAll('.crop-handle');
          handles.forEach(handle => {
               handle.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    this.onResizeStart(e);
               });
          });
     }

     onCropMouseDown(e) {
          e.stopPropagation();
          this.isCropDragging = true;
          this.cropDragStartX = e.clientX - this.cropOverlay.offsetLeft;
          this.cropDragStartY = e.clientY - this.cropOverlay.offsetTop;
     }

     onCropMouseMove(e) {
          if (this.isCropDragging) {
               const newLeft = e.clientX - this.cropDragStartX;
               const newTop = e.clientY - this.cropDragStartY;
               
               this.cropOverlay.style.left = `${Math.max(this.x, Math.min(newLeft, this.x + this.width - parseInt(this.cropOverlay.style.width)))}px`;
               this.cropOverlay.style.top = `${Math.max(this.y, Math.min(newTop, this.y + this.height - parseInt(this.cropOverlay.style.height)))}px`;
          } else if (this.isResizing) {
               const deltaX = e.clientX - this.resizeStartX;
               const deltaY = e.clientY - this.resizeStartY;

               let newWidth = this.resizeStartWidth;
               let newHeight = this.resizeStartHeight;
               let newLeft = this.cropOverlay.offsetLeft;
               let newTop = this.cropOverlay.offsetTop;

               switch (this.resizeHandle) {
                    case 'n':
                         newHeight -= deltaY;
                         newTop += deltaY;
                         break;
                    case 's':
                         newHeight += deltaY;
                         break;
                    case 'e':
                         newWidth += deltaX;
                         break;
                    case 'w':
                         newWidth -= deltaX;
                         newLeft += deltaX;
                         break;
                    case 'ne':
                         newWidth += deltaX;
                         newHeight -= deltaY;
                         newTop += deltaY;
                         break;
                    case 'nw':
                         newWidth -= deltaX;
                         newHeight -= deltaY;
                         newLeft += deltaX;
                         newTop += deltaY;
                         break;
                    case 'se':
                         newWidth += deltaX;
                         newHeight += deltaY;
                         break;
                    case 'sw':
                         newWidth -= deltaX;
                         newHeight += deltaY;
                         newLeft += deltaX;
                         break;
               }

               // Apply constraints
               newWidth = Math.max(20, Math.min(newWidth, this.x + this.width - newLeft));
               newHeight = Math.max(20, Math.min(newHeight, this.y + this.height - newTop));
               newLeft = Math.max(this.x, Math.min(newLeft, this.x + this.width - 20));
               newTop = Math.max(this.y, Math.min(newTop, this.y + this.height - 20));

               // Ensure the crop overlay doesn't exceed image boundaries
               if (newLeft + newWidth > this.x + this.width) {
                    newWidth = this.x + this.width - newLeft;
               }
               if (newTop + newHeight > this.y + this.height) {
                    newHeight = this.y + this.height - newTop;
               }

               // Update crop overlay size and position
               this.cropOverlay.style.width = `${newWidth}px`;
               this.cropOverlay.style.height = `${newHeight}px`;
               this.cropOverlay.style.left = `${newLeft}px`;
               this.cropOverlay.style.top = `${newTop}px`;
          }
     }

     onCropMouseUp(e) {
          e.stopPropagation();
          this.isCropDragging = false;
          this.isResizing = false;
     }

     onResizeStart(e) {
          this.isResizing = true;
          this.resizeHandle = e.target.className.split(' ')[1]; // Get handle position (nw, ne, sw, se)
          this.resizeStartX = e.clientX;
          this.resizeStartY = e.clientY;
          this.resizeStartWidth = parseInt(this.cropOverlay.style.width);
          this.resizeStartHeight = parseInt(this.cropOverlay.style.height);
          e.stopPropagation();
     }

     confirmCrop() {
          const cropX = this.cropOverlay.offsetLeft - this.x;
          const cropY = this.cropOverlay.offsetTop - this.y;
          const cropWidth = parseInt(this.cropOverlay.style.width);
          const cropHeight = parseInt(this.cropOverlay.style.height);

          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = cropWidth;
          tempCanvas.height = cropHeight;
          const tempCtx = tempCanvas.getContext('2d');

          tempCtx.drawImage(
               this.canvas,
               cropX, cropY, cropWidth, cropHeight,
               0, 0, cropWidth, cropHeight
          );

          this.width = cropWidth;
          this.height = cropHeight;
          this.canvas.width = cropWidth;
          this.canvas.height = cropHeight;
          const ctx = this.canvas.getContext('2d');
          ctx.drawImage(tempCanvas, 0, 0);

          this.exitCropMode();
          this.updatePosition();
          this.restoreSelectionStyle();
     }

     exitCropMode() {
          this.isCropMode = false;
          if (this.cropOverlay) {
               this.cropOverlay.remove();
               this.cropOverlay = null;
          }
          
          // Restore all buttons in the secondary toolbar except crop confirm and cancel
          const secondaryToolbar = document.getElementById('secondary-toolbar');
          Array.from(secondaryToolbar.children).forEach(button => {
               if (button.id === 'crop-confirm-btn' || button.id === 'crop-cancel-btn') {
                    button.style.display = 'none';
               } else {
                    button.style.display = 'inline-block';
               }
          });

          // Remove the Enter key event listener
          document.removeEventListener('keydown', this.confirmCropOnEnter);

          this.restoreSelectionStyle();
     }

     restoreSelectionStyle() {
          // Restore the previous selection style
          if (this.previousOutline !== undefined) {
               this.canvas.style.outline = this.previousOutline;
               this.previousOutline = undefined;
          }
     }

     static showSecondaryToolbar() {
          const mainToolbar = document.getElementById('main-toolbar');
          const secondaryToolbar = document.getElementById('secondary-toolbar');
          mainToolbar.style.opacity = '0';
          mainToolbar.style.visibility = 'hidden';
          mainToolbar.style.pointerEvents = 'none';
          secondaryToolbar.classList.add('visible');
     }

     static hideSecondaryToolbar() {
          const mainToolbar = document.getElementById('main-toolbar');
          const secondaryToolbar = document.getElementById('secondary-toolbar');
          mainToolbar.style.opacity = '1';
          mainToolbar.style.visibility = 'visible';
          mainToolbar.style.pointerEvents = 'auto';
          secondaryToolbar.classList.remove('visible');
     }
}

ImageItem.selectedItems = [];
ImageItem.instances = [];

export default ImageItem;