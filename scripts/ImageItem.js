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
          this.zIndex = 0;  // Initialize zIndex
          this.addEventListeners();
          this.setZIndex(ImageItem.getMaxZIndex() + 1);
     }

     static getMaxZIndex() {
          const maxZIndex = Math.max(0, ...ImageItem.instances.map(item => item.zIndex));
          console.log(`Max z-index: ${maxZIndex}`);
          return maxZIndex;
     }

     setZIndex(newZIndex) {
          const oldZIndex = this.zIndex;
          this.zIndex = Math.max(0, Math.min(newZIndex, ImageItem.instances.length - 1));
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
          this.isDragging = true;
          this.dragOffsetX = e.clientX - this.x;
          this.dragOffsetY = e.clientY - this.y;
          e.preventDefault();
     }

     onMouseMove(e) {
          if (this.isDragging) {
               const dropArea = document.getElementById('drop-area');
               this.x = Math.max(0, Math.min(e.clientX - this.dragOffsetX, dropArea.clientWidth - this.width));
               this.y = Math.max(0, Math.min(e.clientY - this.dragOffsetY, dropArea.clientHeight - this.height));
               this.updatePosition();
          }
     }

     onMouseUp() {
          this.isDragging = false;
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
          console.log('Selected items:', ImageItem.selectedItems.length);
     }

     deselect() {
          this.isSelected = false;
          this.updateSelectionStyle();
          const index = ImageItem.selectedItems.indexOf(this);
          if (index > -1) {
               ImageItem.selectedItems.splice(index, 1);
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
}

ImageItem.selectedItems = [];
ImageItem.instances = [];

export default ImageItem;