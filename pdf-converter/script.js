const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const countDisplay = document.getElementById('count');
const progressBar = document.getElementById('progressBar');

let selectedImages = [];
const MAX_IMAGES = 30;

// Open file input on click
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

// File input change
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

function handleFiles(files) {
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (newFiles.length === 0) {
        alert('Please select valid image files (JPG, PNG, GIF, BMP, WebP)');
        return;
    }

    const totalAfterAdd = selectedImages.length + newFiles.length;
    
    if (totalAfterAdd > MAX_IMAGES) {
        alert(`You can only add up to ${MAX_IMAGES} images. Currently you have ${selectedImages.length} images.`);
        // Add only the remaining allowed images
        const remaining = MAX_IMAGES - selectedImages.length;
        if (remaining > 0) {
            addImagesToList(newFiles.slice(0, remaining));
        }
    } else {
        addImagesToList(newFiles);
    }
    
    updatePreview();
    updateButtonState();
}

function addImagesToList(files) {
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            selectedImages.push({
                name: file.name,
                data: e.target.result
            });
        };
        reader.readAsDataURL(file);
    });
}

function updatePreview() {
    if (selectedImages.length === 0) {
        previewContainer.innerHTML = '<p class="empty-message">No images selected</p>';
        return;
    }

    previewContainer.innerHTML = '';
    selectedImages.forEach((image, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.innerHTML = `
            <img src="${image.data}" alt="preview">
            <div class="index">${index + 1}</div>
            <button class="remove-btn" onclick="removeImage(${index})">×</button>
        `;
        previewContainer.appendChild(previewItem);
    });

    countDisplay.textContent = selectedImages.length;
}

function removeImage(index) {
    selectedImages.splice(index, 1);
    updatePreview();
    updateButtonState();
}

function updateButtonState() {
    convertBtn.disabled = selectedImages.length === 0;
}

clearBtn.addEventListener('click', () => {
    selectedImages = [];
    fileInput.value = '';
    updatePreview();
    updateButtonState();
});

convertBtn.addEventListener('click', () => {
    if (selectedImages.length === 0) {
        alert('Please select at least one image');
        return;
    }
    convertImagesToPDF();
});

async function convertImagesToPDF() {
    try {
        progressBar.style.display = 'block';
        convertBtn.disabled = true;
        clearBtn.disabled = true;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < selectedImages.length; i++) {
            const image = selectedImages[i];

            // Create a temporary image to get dimensions
            const img = new Image();
            img.src = image.data;

            await new Promise((resolve) => {
                img.onload = () => {
                    const imgWidth = img.width;
                    const imgHeight = img.height;
                    const ratio = imgWidth / imgHeight;

                    let width = pdfWidth - 10; // 5mm margin on each side
                    let height = width / ratio;

                    // If height exceeds page height, scale width accordingly
                    if (height > pdfHeight - 10) {
                        height = pdfHeight - 10;
                        width = height * ratio;
                    }

                    // Center the image
                    const x = (pdfWidth - width) / 2;
                    const y = (pdfHeight - height) / 2;

                    pdf.addImage(image.data, 'JPEG', x, y, width, height);

                    if (i < selectedImages.length - 1) {
                        pdf.addPage();
                    }

                    resolve();
                };
            });
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `images-to-pdf-${timestamp}.pdf`;

        pdf.save(filename);

        progressBar.style.display = 'none';
        alert(`PDF created successfully! (${selectedImages.length} images)`);

        // Reset for next conversion
        selectedImages = [];
        fileInput.value = '';
        updatePreview();
        updateButtonState();
        clearBtn.disabled = false;

    } catch (error) {
        console.error('Error converting images to PDF:', error);
        alert('Error converting images to PDF. Please try again.');
        progressBar.style.display = 'none';
        convertBtn.disabled = false;
        clearBtn.disabled = false;
    }
}

// Initialize
updatePreview();
updateButtonState();
