const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const countDisplay = document.getElementById('count');
const countBadge = document.getElementById('countBadge');
const progressBar = document.getElementById('progressBar');

const cropModal = document.getElementById('cropModal');
const cropImage = document.getElementById('cropImage');
const cropCancel = document.getElementById('cropCancel');
const cropApply = document.getElementById('cropApply');
const cropModalClose = document.getElementById('cropModalClose');

let selectedImages = [];
let currentCropIndex = -1;
let cropper = null;
const MAX_IMAGES = 30;
const A4_RATIO = 210 / 297;

// Upload click
uploadArea.addEventListener('click', () => fileInput.click());

// File select
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

// Drag & drop
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
    const imgs = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imgs.length === 0) {
        alert('Select image files');
        return;
    }
    if (selectedImages.length + imgs.length > MAX_IMAGES) {
        const rem = MAX_IMAGES - selectedImages.length;
        if (rem > 0) addImages(imgs.slice(0, rem));
        alert(`Max ${MAX_IMAGES} images`);
    } else {
        addImages(imgs);
    }
}

function addImages(files) {
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            selectedImages.push({
                data: e.target.result,
                cropped: null
            });
            updateUI();
        };
        reader.readAsDataURL(file);
    });
}

function updateUI() {
    if (!selectedImages.length) {
        previewContainer.innerHTML = '<p class="empty-text">No images yet</p>';
        countBadge.style.display = 'none';
        clearBtn.style.display = 'none';
        convertBtn.disabled = true;
        return;
    }

    previewContainer.innerHTML = '';
    selectedImages.forEach((img, i) => {
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.innerHTML = `
            <img src="${img.cropped || img.data}" alt="img">
            <div class="index">${i + 1}</div>
            <button class="crop-btn" onclick="openCrop(${i})">Crop</button>
            <button class="remove-btn" onclick="removeImg(${i})">×</button>
        `;
        previewContainer.appendChild(item);
    });

    countDisplay.textContent = selectedImages.length;
    countBadge.style.display = 'flex';
    clearBtn.style.display = 'inline-block';
    convertBtn.disabled = false;
}

window.openCrop = function(idx) {
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
            center: true
        });
    }, 100);
};

window.removeImg = function(idx) {
    selectedImages.splice(idx, 1);
    updateUI();
};

function closeCrop() {
    if (cropper) cropper.destroy();
    cropModal.style.display = 'none';
}

cropCancel.onclick = closeCrop;
cropModalClose.onclick = closeCrop;
cropApply.onclick = () => {
    if (cropper && currentCropIndex >= 0) {
        selectedImages[currentCropIndex].cropped = cropper.getCroppedCanvas().toDataURL('image/jpeg', 0.95);
        updateUI();
        closeCrop();
    }
};

cropModal.onclick = (e) => {
    if (e.target === cropModal) closeCrop();
};

clearBtn.onclick = () => {
    if (confirm('Clear all images?')) {
        selectedImages = [];
        fileInput.value = '';
        updateUI();
    }
};

convertBtn.onclick = () => selectedImages.length && convertPDF();

async function convertPDF() {
    try {
        progressBar.style.display = 'block';
        convertBtn.disabled = true;
        clearBtn.disabled = true;

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pw = pdf.internal.pageSize.getWidth();
        const ph = pdf.internal.pageSize.getHeight();

        for (let i = 0; i < selectedImages.length; i++) {
            const data = selectedImages[i].cropped || selectedImages[i].data;
            const img = new Image();
            img.src = data;

            await new Promise((resolve) => {
                img.onload = () => {
                    let w = pw - 10;
                    let h = w / (img.width / img.height);
                    if (h > ph - 10) {
                        h = ph - 10;
                        w = h * (img.width / img.height);
                    }
                    const x = (pw - w) / 2;
                    const y = (ph - h) / 2;
                    pdf.addImage(data, 'JPEG', x, y, w, h);
                    if (i < selectedImages.length - 1) pdf.addPage();
                    resolve();
                };
            });
        }

        pdf.save(`PDF-${new Date().toISOString().slice(0, 10)}.pdf`);
        progressBar.style.display = 'none';
        alert(`✓ PDF ready! ${selectedImages.length} image${selectedImages.length > 1 ? 's' : ''}`);
        
        selectedImages = [];
        fileInput.value = '';
        updateUI();
        clearBtn.disabled = false;

    } catch (err) {
        console.error(err);
        alert('Error creating PDF');
        progressBar.style.display = 'none';
        convertBtn.disabled = false;
        clearBtn.disabled = false;
    }
}

updateUI();
