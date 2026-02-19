const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const countSpan = document.getElementById('count');
const progressBar = document.getElementById('progressBar');

let selectedFiles = [];
const MAX_FILES = 30;
let imageQuality = 1.0;  // Default = highest quality

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

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (selectedFiles.length + newFiles.length > MAX_FILES) {
        alert(`Maximum ${MAX_FILES} images allowed!`);
        return;
    }

    selectedFiles = [...selectedFiles, ...newFiles];
    updatePreview();
    updateCount();
}

function updatePreview() {
    if (selectedFiles.length === 0) {
        previewContainer.innerHTML = '<p class="empty-message">No images selected</p>';
        convertBtn.disabled = true;
        return;
    }

    previewContainer.innerHTML = '';
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'image-preview-wrapper';
            
            const img = document.createElement('img');
            img.src = e.target.result;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.textContent = '×';
            removeBtn.onclick = () => removeImage(index);
            
            wrapper.appendChild(img);
            wrapper.appendChild(removeBtn);
            previewContainer.appendChild(wrapper);
        };
        reader.readAsDataURL(file);
    });

    convertBtn.disabled = false;
}

function removeImage(index) {
    selectedFiles.splice(index, 1);
    updatePreview();
    updateCount();
}

function updateCount() {
    countSpan.textContent = selectedFiles.length;
}

clearBtn.addEventListener('click', () => {
    selectedFiles = [];
    fileInput.value = '';
    updatePreview();
    updateCount();
});

convertBtn.addEventListener('click', convertToPDF);

async function convertToPDF() {
    if (selectedFiles.length === 0) {
        alert('Please select at least one image!');
        return;
    }

    progressBar.style.display = 'block';
    const progressFill = progressBar.querySelector('.progress-fill');

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const reader = new FileReader();

        await new Promise((resolve) => {
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {

                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const pageHeight = pdf.internal.pageSize.getHeight();

                    if (i > 0) pdf.addPage();

                    const imgRatio = img.width / img.height;
                    const pageRatio = pageWidth / pageHeight;

                    let renderWidth, renderHeight, x = 0, y = 0;

                   if (imgRatio > pageRatio) {
    // Image is wider → fit to page width
    renderWidth = pageWidth;
    renderHeight = renderWidth / imgRatio;
    y = (pageHeight - renderHeight) / 2;
} else {
    // Image is taller → fit to page height
    renderHeight = pageHeight;
    renderWidth = imgRatio * renderHeight;
    x = (pageWidth - renderWidth) / 2;
}

                    pdf.addImage(
                        e.target.result,
                        'JPEG',
                        x,
                        y,
                        renderWidth,
                        renderHeight,
                        undefined,
                        'SLOW',
                        imageQuality   // make sure slider variable exists
                    );

                    const progress = ((i + 1) / selectedFiles.length) * 100;
                    progressFill.style.width = progress + '%';

                    resolve();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    pdf.save('converted.pdf');

    progressBar.style.display = 'none';
    progressFill.style.width = '0%';

    alert('PDF downloaded successfully!');
    selectedFiles = [];
    fileInput.value = '';
    updatePreview();
    updateCount();
}
