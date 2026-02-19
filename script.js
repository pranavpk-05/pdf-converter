const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const convertBtn = document.getElementById("convertBtn");

const pdfMode = document.getElementById("pdfMode");
const pageSize = document.getElementById("pageSize");
const orientation = document.getElementById("orientation");
const marginInput = document.getElementById("margin");
const qualitySlider = document.getElementById("quality");
const qualityValue = document.getElementById("qualityValue");

const progressBar = document.getElementById("progressBar");
const progressFill = document.querySelector(".progress-fill");

let selectedFiles = [];
let imageQuality = 1.0;

uploadArea.onclick = () => fileInput.click();

uploadArea.addEventListener("dragover", e=>{
    e.preventDefault();
    uploadArea.classList.add("dragover");
});

uploadArea.addEventListener("dragleave", ()=>{
    uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", e=>{
    e.preventDefault();
    uploadArea.classList.remove("dragover");
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener("change", e=>{
    handleFiles(e.target.files);
});

qualitySlider.addEventListener("input", ()=>{
    imageQuality = parseFloat(qualitySlider.value);
    qualityValue.textContent = imageQuality.toFixed(1);
});

function handleFiles(files){
    const images = Array.from(files).filter(f=>f.type.startsWith("image/"));
    selectedFiles = [...selectedFiles, ...images];
    updatePreview();
}

function updatePreview(){
    preview.innerHTML = "";
    selectedFiles.forEach(file=>{
        const reader = new FileReader();
        reader.onload = e=>{
            const img = document.createElement("img");
            img.src = e.target.result;
            preview.appendChild(img);
        };
        reader.readAsDataURL(file);
    });
}

convertBtn.addEventListener("click", async ()=>{

if(selectedFiles.length===0){
    alert("Upload images first");
    return;
}

progressBar.style.display="block";

const { jsPDF } = window.jspdf;
let pdf;
let firstPage=true;
const margin=parseFloat(marginInput.value)||0;

for(let i=0;i<selectedFiles.length;i++){

    await new Promise(resolve=>{

        const reader=new FileReader();

        reader.onload=e=>{

            const img=new Image();

            img.onload=()=>{

                if(pdfMode.value==="exact"){

                    const mmPerPx=0.264583;
                    const width=img.width*mmPerPx;
                    const height=img.height*mmPerPx;

                    if(firstPage){
                        pdf=new jsPDF({
                            orientation:width>height?"l":"p",
                            unit:"mm",
                            format:[width,height]
                        });
                        firstPage=false;
                    }else{
                        pdf.addPage([width,height],
                            width>height?"l":"p");
                    }

                    pdf.addImage(e.target.result,"JPEG",0,0,width,height,
                        undefined,"SLOW",imageQuality);

                }else{

                    if(firstPage){
                        pdf=new jsPDF(orientation.value,"mm",pageSize.value);
                        firstPage=false;
                    }else{
                        pdf.addPage(pageSize.value,orientation.value);
                    }

                    const pageWidth=pdf.internal.pageSize.getWidth();
                    const pageHeight=pdf.internal.pageSize.getHeight();

                    const usableWidth=pageWidth-margin*2;
                    const usableHeight=pageHeight-margin*2;

                    const imgRatio=img.width/img.height;
                    const pageRatio=usableWidth/usableHeight;

                    let renderWidth,renderHeight;

                    if(imgRatio>pageRatio){
                        renderWidth=usableWidth;
                        renderHeight=usableWidth/imgRatio;
                    }else{
                        renderHeight=usableHeight;
                        renderWidth=usableHeight*imgRatio;
                    }

                    const x=(pageWidth-renderWidth)/2;
                    const y=(pageHeight-renderHeight)/2;

                    pdf.addImage(e.target.result,"JPEG",x,y,
                        renderWidth,renderHeight,
                        undefined,"SLOW",imageQuality);
                }

                progressFill.style.width=
                    ((i+1)/selectedFiles.length)*100+"%";

                resolve();
            };

            img.src=e.target.result;
        };

        reader.readAsDataURL(selectedFiles[i]);
    });
}

pdf.save("converted.pdf");

progressBar.style.display="none";
progressFill.style.width="0%";

});
