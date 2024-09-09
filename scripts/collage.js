export default function organizeCollage(images) {
     console.log('organizeCollage');
     const dropArea = document.getElementById('drop-area');
     const padding = 5; // 5px spacing between images
     let currentX = padding;
     let currentY = padding;
     let rowHeight = 0;
 
     // Remove any existing styles
     dropArea.style.position = 'relative';
     Array.from(images).forEach(img => {
         img.style.position = 'absolute';
         img.style.margin = '0';
         img.style.maxWidth = 'none';
         img.style.maxHeight = 'none';
     });
 
     // Organize images
     Array.from(images).forEach(img => {
         if (currentX + img.width > dropArea.clientWidth) {
             // Move to next row
             currentX = padding;
             currentY += rowHeight + padding;
             rowHeight = 0;
         }
 
         img.style.left = `${currentX}px`;
         img.style.top = `${currentY}px`;
 
         currentX += img.width + padding;
         rowHeight = Math.max(rowHeight, img.height);
     });
 
     // Set drop area height to fit all images
     dropArea.style.height = `${currentY + rowHeight + padding}px`;
 }