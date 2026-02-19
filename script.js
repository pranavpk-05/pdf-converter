const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const countDisplay = document.getElementById('count');
const previewCount = document.getElementById('previewCount');
const progressBar = document.getElementById('progressBar');
const themeToggle = document.getElementById('themeToggle');

const cropModal = document.getElementById('cropModal');
const cropImage = document.getElementById('cropImage');
const cropCancel = document.getElementById('cropCancel');
const cropApply = document.getElementById('cropApply');
const cropModalClose = document.getElementById('cropModalClose');

let selectedImages = [];
let currentCropIndex = -1;
let cropper = null;
const MAX_IMAGES = 30;
const A4_RATIO = 210 / 297; // A4 aspect ratio

// Theme toggle
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
});

// Load saved theme
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

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
                data: e.target.result,
                cropped: null
            });
            updatePreview();
            updateButtonState();
        };
        reader.readAsDataURL(file);
    });
}

function updatePreview() {
    if (selectedImages.length === 0) {
        previewContainer.innerHTML = '<p class="empty-message">No images selected yet</p>';
        previewCount.textContent = '0 selected';
        return;
    }

    previewContainer.innerHTML = '';
    selectedImages.forEach((image, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.innerHTML = `
            <img src="${image.cropped || image.data}" alt="preview">
            <div class="index">${index + 1}</div>
            <button class="crop-btn" onclick="openCropModal(${index})">Crop</button>
            <button class="remove-btn" onclick="removeImage(${index})">×</button>
        `;
        previewContainer.appendChild(previewItem);
    });

    countDisplay.textContent = selectedImages.length;
    previewCount.textContent = `${selectedImages.length} selected`;
}

function openCropModal(index) {
    currentCropIndex = index;
    cropImage.src = selectedImages[index].cropped || selectedImages[index].data;
    cropModal.style.display = 'flex';
    
    setTimeout(() => {
        if (cropper) {
            cropper.destroy();
        }
        
        cropper = new Cropper(cropImage, {
            aspectRatio: A4_RATIO,
            viewMode: 1,
            autoCropArea: 1,
            responsive: true,
            guides: true,
            center: true,
            highlight: true,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: true,
        });
    }, 100);
}

function closeCropModal() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    cropModal.style.display = 'none';
    currentCropIndex = -1;
}

cropCancel.addEventListener('click', closeCropModal);
cropModalClose.addEventListener('click', closeCropModal);

cropApply.addEventListener('click', () => {
    if (cropper && currentCropIndex >= 0) {
        const canvas = cropper.getCroppedCanvas();
        selectedImages[currentCropIndex].cropped = canvas.toDataURL('image/jpeg', 0.95);
        updatePreview();
        closeCropModal();
    }
});

cropModal.addEventListener('click', (e) => {
    if (e.target === cropModal) {
        closeCropModal();
    }
});

function removeImage(index) {
    selectedImages.splice(index, 1);
    updatePreview();
    updateButtonState();
}

function updateButtonState() {
    convertBtn.disabled = selectedImages.length === 0;
}

clearBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all images?')) {
        selectedImages = [];
        fileInput.value = '';
        updatePreview();
        updateButtonState();
    }
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
            const imageData = image.cropped || image.data;

            // Create a temporary image to get dimensions
            const img = new Image();
            img.src = imageData;

            await new Promise((resolve) => {
                img.onload = () => {
                    const imgWidth = img.width;
                    const imgHeight = img.height;
                    const ratio = imgWidth / imgHeight;

                    let width = pdfWidth - 10;
                    let height = width / ratio;

                    if (height > pdfHeight - 10) {
                        height = pdfHeight - 10;
                        width = height * ratio;
                    }

                    const x = (pdfWidth - width) / 2;
                    const y = (pdfHeight - height) / 2;

                    pdf.addImage(imageData, 'JPEG', x, y, width, height);

                    if (i < selectedImages.length - 1) {
                        pdf.addPage();
                    }

                    resolve();
                };
            });
        }

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().slice(0, 10);
        const filename = `PDF-${timestamp}-${Date.now()}.pdf`;

        pdf.save(filename);

        progressBar.style.display = 'none';
        alert(`✓ PDF created successfully!\n${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''} converted to A4 format`);
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
