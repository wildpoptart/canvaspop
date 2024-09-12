export default function organizeCollage(imageItems, rows = 1, columns = 1, spacing = 5) {
	const dropArea = document.getElementById('drop-area');
	const padding = Math.max(spacing, 0);
	const overlap = Math.abs(Math.min(spacing, 0));
	let currentX = padding;
	let currentY = padding;
	let rowHeight = 0;
	let maxWidth = 0;
	let totalHeight = 0;

	const itemsPerRow = Math.ceil(imageItems.length / rows);

	// First pass: calculate total width and height
	imageItems.forEach((item, index) => {
		if (index % itemsPerRow === 0 && index !== 0) {
			maxWidth = Math.max(maxWidth, currentX - padding + overlap);
			currentX = padding;
			currentY += rowHeight - overlap + padding;
			rowHeight = 0;
		}

		currentX += item.width - overlap + padding;
		rowHeight = Math.max(rowHeight, item.height);
	});
	totalHeight = currentY + rowHeight - overlap + padding;
	maxWidth = Math.max(maxWidth, currentX - padding + overlap);

	// Calculate offsets to center the collage
	const offsetX = Math.max(0, (dropArea.clientWidth - maxWidth) / 2);
	const offsetY = Math.max(0, (dropArea.clientHeight - totalHeight) / 2);

	// Reset for second pass
	currentX = padding;
	currentY = padding;
	rowHeight = 0;

	// Second pass: position images
	imageItems.forEach((item, index) => {
		if (index % itemsPerRow === 0 && index !== 0) {
			currentX = padding;
			currentY += rowHeight - overlap + padding;
			rowHeight = 0;
		}

		item.x = currentX + offsetX;
		item.y = currentY + offsetY;
		item.updatePosition();

		currentX += item.width - overlap + padding;
		rowHeight = Math.max(rowHeight, item.height);
	});

	// Set drop area height to fit all images
	dropArea.style.height = `${Math.max(dropArea.clientHeight, totalHeight)}px`;
}