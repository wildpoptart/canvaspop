class ImageDisplay {
     constructor() {
         this.canvasElements = []; // Store multiple canvas elements
     }

     createCanvasElement() {
         const canvas = document.createElement('canvas');
         canvas.className = 'image-canvas'; // Use a class for styling
         document.body.appendChild(canvas);
         this.canvasElements.push(canvas);
         return canvas;
     }

     displayImage(src, x, y) {
         const canvas = this.createCanvasElement(); // Create a new canvas element
         const ctx = canvas.getContext('2d');

         const img = new Image();
         img.src = src;
         img.onload = () => {
             canvas.width = img.width;
             canvas.height = img.height;
             ctx.drawImage(img, 0, 0);
             canvas.style.left = `${x}px`;
             canvas.style.top = `${y}px`;
             canvas.style.position = 'absolute';
             canvas.style.display = 'block';
         };
     }

     hideAll() {
         this.canvasElements.forEach(canvas => canvas.style.display = 'none');
     }
 }

 export default ImageDisplay;