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

/* ---------- AUTO WHITE TRIM FUNCTION ---------- */
function trimWhiteSpace(img){

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    const data = imageData.data;

    let top = null, bottom = null, left = null, right = null;

    for(let y=0; y<canvas.height; y++){
        for(let x=0; x<canvas.width; x++){
            const index = (y*canvas.width + x)*4;
            const r = data[index];
            const g = data[index+1];
            const b = data[index+2];

            // detect non-white pixel
            if(!(r>240 && g>240 && b>240)){
                if(top===null) top=y;
                bottom=y;
                if(left===null || x<left) left=x;
                if(right===null || x>right) right=x;
            }
        }
    }

    if(top===null) return canvas;

    const width = right-left;
    const height = bottom-top;

    const croppedCanvas = document.createElement("canvas");
    croppedCanvas.width = width;
    croppedCanvas.height = height;

    croppedCanvas.getContext("2d").drawImage(
        canvas,
        left, top, width, height,
        0, 0, width, height
    );

    return croppedCanvas;
}

/* ---------- PDF GENERATION ---------- */

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

                const trimmedCanvas = trimWhiteSpace(img);

                const mmPerPx = 0.264583;
                const width = trimmedCanvas.width * mmPerPx;
                const height = trimmedCanvas.height * mmPerPx;

                if(first){
                    pdf = new jsPDF({
                        orientation: width>height?"l":"p",
                        unit:"mm",
                        format:[width,height]
                    });
                    first=false;
                }else{
                    pdf.addPage([width,height],
                        width>height?"l":"p");
                }

                const imgData = trimmedCanvas.toDataURL("image/jpeg", imageQuality);

                pdf.addImage(
                    imgData,
                    "JPEG",
                    0,
                    0,
                    width,
                    height,
                    undefined,
                    "SLOW",
                    imageQuality
                );

                progressFill.style.width =
                    ((i+1)/files.length)*100 + "%";

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
