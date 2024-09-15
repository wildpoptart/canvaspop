// Import DeepLab model (make sure to include this in your HTML)
// <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/deeplab"></script>

let model;
const base = 'pascal';

async function loadModel() {
    if (!model) {
        model = await deeplab.load({ base: base, quantizationBytes: 2 });
    }
    return model;
}

async function removeBackground(imageFile) {
    const model = await loadModel();
    const img = await loadImageFromFile(imageFile);
    
    console.log('Image', img);
    
    const prediction = await model.segment(img);
    console.log('Segmentation Result', prediction);

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    // Draw the original image
    ctx.drawImage(img, 0, 0);

    // Get the original image data
    const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const originalData = originalImageData.data;

    // Create a temporary canvas for the segmentation map
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = prediction.width;
    tempCanvas.height = prediction.height;
    const tempCtx = tempCanvas.getContext('2d');

    // Create ImageData from the segmentation map
    const segmentationData = new ImageData(
        new Uint8ClampedArray(prediction.segmentationMap),
        prediction.width,
        prediction.height
    );


    // Put the segmentation map on the temporary canvas
    tempCtx.putImageData(segmentationData, 0, 0);

    // Draw the temporary canvas onto the original canvas, scaling it to the original size
    ctx.drawImage(tempCanvas, 0, 0, img.width, img.height);

    // Get the scaled segmentation data
    const scaledSegmentationData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    // Apply the segmentation mask to the original image
    for (let i = 0; i < originalData.length; i += 4) {
        // Check if the pixel is classified as background (assuming 0 is background)
        if (scaledSegmentationData[i] === 0) {
            originalData[i + 3] = 0; // Set alpha to 0 (transparent)
        }
    }

    // Put the modified original image data back on the canvas
    ctx.putImageData(originalImageData, 0, 0);

    // Crop the image to the bounding box of non-transparent pixels
    const croppedCanvas = cropToBoundingBox(ctx, canvas.width, canvas.height);
    
    return croppedCanvas.toDataURL();
}

function cropToBoundingBox(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    let minX = width, minY = height, maxX = 0, maxY = 0;

    // Find the bounding box of non-transparent pixels
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            if (data[index + 3] !== 0) { // Check alpha channel
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    // Calculate new width and height
    const newWidth = maxX - minX + 1;
    const newHeight = maxY - minY + 1;

    // Create a new canvas for the cropped image
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = newWidth;
    croppedCanvas.height = newHeight;
    const croppedCtx = croppedCanvas.getContext('2d');

    // Draw the cropped image onto the new canvas
    croppedCtx.drawImage(ctx.canvas, minX, minY, newWidth, newHeight, 0, 0, newWidth, newHeight);

    return croppedCanvas;
}

function loadImageFromFile(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// Removed the Gaussian blur function

// Export the removeBackground function
export default removeBackground;
