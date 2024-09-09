export default function organizeCollage(imageItems) {
     const dropArea = document.getElementById('drop-area');
     const padding = 5; // 5px spacing between images
     let currentX = padding;
     let currentY = padding;
     let rowHeight = 0;
     let maxWidth = 0;
     let totalHeight = 0;

     // First pass: calculate total width and height
     imageItems.forEach(item => {
         if (currentX + item.width > dropArea.clientWidth) {
             maxWidth = Math.max(maxWidth, currentX - padding);
             currentX = padding;
             currentY += rowHeight + padding;
             rowHeight = 0;
         }

         currentX += item.width + padding;
         rowHeight = Math.max(rowHeight, item.height);
     });
     totalHeight = currentY + rowHeight + padding;
     maxWidth = Math.max(maxWidth, currentX - padding);

     // Calculate offsets to center the collage
     const offsetX = Math.max(0, (dropArea.clientWidth - maxWidth) / 2);
     const offsetY = Math.max(0, (dropArea.clientHeight - totalHeight) / 2);

     // Reset for second pass
     currentX = padding;
     currentY = padding;
     rowHeight = 0;

     // Second pass: position images
     imageItems.forEach(item => {
         if (currentX + item.width > dropArea.clientWidth) {
             currentX = padding;
             currentY += rowHeight + padding;
             rowHeight = 0;
         }

         item.x = currentX + offsetX;
         item.y = currentY + offsetY;
         item.updatePosition();

         currentX += item.width + padding;
         rowHeight = Math.max(rowHeight, item.height);
     });

     // Set drop area height to fit all images
     dropArea.style.height = `${Math.max(dropArea.clientHeight, totalHeight)}px`;
 }