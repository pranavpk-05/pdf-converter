const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const convertBtn = document.getElementById("convertBtn");
const exactMode = document.getElementById("exactMode");
const qualitySlider = document.getElementById("quality");
const progressBar = document.getElementById("progressBar");
const progressFill = document.querySelector(".progress-fill");

let files = [];
let imageQuality = 1.0;

uploadArea.onclick = () => fileInput.click();

uploadArea.addEventListener("dragover", e=>{
    e.preventDefault();
});

uploadArea.addEventListener("drop", e=>{
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener("change", e=>{
    handleFiles(e.target.files);
});

qualitySlider.addEventListener("input", ()=>{
    imageQuality = parseFloat(qualitySlider.value);
});

function handleFiles(selected){
    const images = Array.from(selected).filter(f=>f.type.startsWith("image/"));
    files = [...files, ...images];
    renderPreview();
}

function renderPreview(){
    preview.innerHTML="";
    files.forEach(file=>{
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

if(files.length===0){
    alert("Upload images first");
    return;
}

progressBar.style.display="block";

const { jsPDF } = window.jspdf;
let pdf;
let first=true;

for(let i=0;i<files.length;i++){

    await new Promise(resolve=>{

        const reader=new FileReader();

        reader.onload=e=>{

            const img=new Image();

            img.onload=()=>{

                const mmPerPx=0.264583;
                const width=img.width*mmPerPx;
                const height=img.height*mmPerPx;

                if(first){
                    pdf=new jsPDF({
                        orientation:width>height?"l":"p",
                        unit:"mm",
                        format:[width,height]
                    });
                    first=false;
                }else{
                    pdf.addPage([width,height],
                        width>height?"l":"p");
                }

                pdf.addImage(
                    e.target.result,
                    "JPEG",
                    0,
                    0,
                    width,
                    height,
                    undefined,
                    "SLOW",
                    imageQuality
                );

                progressFill.style.width=
                    ((i+1)/files.length)*100+"%";

                resolve();
            };

            img.src=e.target.result;
        };

        reader.readAsDataURL(files[i]);
    });
}

pdf.save("converted.pdf");

progressBar.style.display="none";
progressFill.style.width="0%";

});
