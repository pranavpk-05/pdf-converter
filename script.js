// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const previewSection = document.getElementById('previewSection');
const actionsSection = document.getElementById('actionsSection');
const countDisplay = document.getElementById('count');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const progressBar = document.getElementById('progressBar');
const qualitySelect = document.getElementById('qualitySelect');

const cropModal = document.getElementById('cropModal');
const cropImage = document.getElementById('cropImage');
const cropCancel = document.getElementById('cropCancel');
const cropApply = document.getElementById('cropApply');
const cropModalClose = document.getElementById('cropModalClose');
const cropOverlay = document.querySelector('.crop-overlay');

// State
let selectedImages = [];
let currentCropIndex = -1;
let cropper = null;
const MAX_IMAGES = 30;
const A4_RATIO = 210 / 297;

// Quality presets
const qualityPresets = {
    high: { quality: 0.95, compression: 'HIGH' },
    medium: { quality: 0.85, compression: 'MEDIUM' },
    low: { quality: 0.75, compression: 'LOW' }
};

// Event Listeners
uploadArea.addEventListener('click', () => fileInput.click());
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

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
clearBtn.addEventListener('click', clearAllImages);
convertBtn.addEventListener('click', generatePDF);
cropCancel.addEventListener('click', closeCropModal);
cropModalClose.addEventListener('click', closeCropModal);
cropApply.addEventListener('click', applyCrop);
cropOverlay.addEventListener('click', closeCropModal);

// Functions
function handleFiles(files) {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        alert('Please select image files');
        return;
    }
    
    const availableSlots = MAX_IMAGES - selectedImages.length;
    
    if (availableSlots === 0) {
        alert(`Maximum ${MAX_IMAGES} images reached`);
        return;
    }
    
    if (imageFiles.length > availableSlots) {
        alert(`Can only add ${availableSlots} more image(s)`);
        addImages(imageFiles.slice(0, availableSlots));
    } else {
        addImages(imageFiles);
    }
}

function addImages(files) {
    let loadedCount = 0;
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            selectedImages.push({
                name: file.name,
                data: e.target.result,
                cropped: null
            });
            loadedCount++;
            
            if (loadedCount === files.length) {
                updateUI();
            }
        };
        reader.readAsDataURL(file);
    });
}

function updateUI() {
    const hasImages = selectedImages.length > 0;
    
    // Toggle sections
    if (hasImages) {
        previewSection.style.display = 'block';
        actionsSection.style.display = 'flex';
    } else {
        previewSection.style.display = 'none';
        actionsSection.style.display = 'none';
    }
    
    // Update preview grid
    previewContainer.innerHTML = '';
    selectedImages.forEach((img, i) => {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.innerHTML = `
            <img src="${img.cropped || img.data}" alt="image ${i + 1}">
            <div class="index">${i + 1}</div>
            <div class="actions">
                <button class="crop-btn" onclick="openCropModal(${i})">Crop</button>
                <button class="remove-btn" onclick="removeImage(${i})">×</button>
            </div>
        `;
        previewContainer.appendChild(item);
    });
    
    // Update count
    countDisplay.textContent = selectedImages.length;
    
    // Update button state
    convertBtn.disabled = !hasImages;
    clearBtn.disabled = !hasImages;
}

window.openCropModal = function(idx) {
    currentCropIndex = idx;
    cropImage.src = selectedImages[idx].cropped || selectedImages[idx].data;
    cropModal.style.display = 'flex';
    
    setTimeout(() => {
        if (cropper) cropper.destroy();
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
            background: false,
            restore: true,
            guides: true,
            center: true,
            highlight: true,
            crop(e) {
                // Real-time crop feedback
            }
        });
    }, 100);
};

window.removeImage = function(idx) {
    selectedImages.splice(idx, 1);
    updateUI();
};

function closeCropModal() {
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
    cropModal.style.display = 'none';
}

function applyCrop() {
    if (cropper && currentCropIndex >= 0) {
        const canvas = cropper.getCroppedCanvas({
            maxWidth: 4096,
            maxHeight: 4096,
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high'
        });
        
        selectedImages[currentCropIndex].cropped = canvas.toDataURL('image/jpeg', 0.95);
        updateUI();
        closeCropModal();
    }
}

function clearAllImages() {
    if (!confirm('Clear all images?')) return;
    
    selectedImages = [];
    fileInput.value = '';
    updateUI();
}

async function generatePDF() {
    if (selectedImages.length === 0) {
        alert('Please add images first');
        return;
    }
    
    try {
        progressBar.style.display = 'block';
        convertBtn.disabled = true;
        clearBtn.disabled = true;
        
        const quality = qualitySelect.value;
        const preset = qualityPresets[quality];
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        });
        
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10; // 10mm margins on all sides
        const maxWidth = pageWidth - (margin * 2);
        const maxHeight = pageHeight - (margin * 2);
        
        for (let i = 0; i < selectedImages.length; i++) {
            // Get image data
            const imageData = selectedImages[i].cropped || selectedImages[i].data;
            const img = new Image();
            img.src = imageData;
            
            await new Promise((resolve) => {
                img.onload = () => {
                    // Calculate dimensions to fit page while maintaining aspect ratio
                    const imgRatio = img.width / img.height;
                    let imgWidth = maxWidth;
                    let imgHeight = imgWidth / imgRatio;
                    
                    if (imgHeight > maxHeight) {
                        imgHeight = maxHeight;
                        imgWidth = imgHeight * imgRatio;
                    }
                    
                    // Center image on page
                    const xPos = (pageWidth - imgWidth) / 2;
                    const yPos = (pageHeight - imgHeight) / 2;
                    
                    // Add image to PDF with high quality
                    pdf.addImage(imageData, 'JPEG', xPos, yPos, imgWidth, imgHeight, '', preset.compression);
                    
                    // Add new page if not last image
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
        
        // Save PDF
        pdf.save(filename);
        
        progressBar.style.display = 'none';
        alert(`✓ PDF created successfully!\n${selectedImages.length} image(s) included\nQuality: ${quality.charAt(0).toUpperCase() + quality.slice(1)}`);
        
        // Reset state
        selectedImages = [];
        fileInput.value = '';
        updateUI();
        
    } catch (err) {
        console.error('PDF Generation Error:', err);
        alert('Error creating PDF. Please try again.');
        progressBar.style.display = 'none';
    } finally {
        convertBtn.disabled = false;
        clearBtn.disabled = false;
    }
}

// Initialize on page load
updateUI();
