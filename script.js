const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const convertBtn = document.getElementById('convertBtn');
const clearBtn = document.getElementById('clearBtn');
const countSpan = document.getElementById('count');
const progressBar = document.getElementById('progressBar');

let selectedFiles = [];
const MAX_FILES = 30;

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
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const reader = new FileReader();

        await new Promise((resolve) => {
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    if (i > 0) pdf.addPage();
                    
                    const imgWidth = pageWidth - 20;
                    const imgHeight = (img.height * imgWidth) / img.width;
                    const y = (pageHeight - imgHeight) / 2;

                    pdf.addImage(e.target.result, 'JPEG', 10, Math.max(10, y), imgWidth, imgHeight);
                    
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