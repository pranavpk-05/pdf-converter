# Image to PDF Converter

A simple, fast, and user-friendly web application to convert multiple images into a single PDF file. Supports up to 30 images and maintains their quality.

## Features

✨ **Easy to Use** - Drag and drop or click to upload images  
📸 **Multiple Formats** - Supports JPG, PNG, GIF, BMP, and WebP  
📄 **Batch Conversion** - Convert up to 30 images to PDF in one go  
🎯 **Smart Resizing** - Images are automatically sized to fit the PDF page  
⚡ **Fast Processing** - Real-time preview and conversion  
📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile  
🔒 **Privacy Focused** - All processing happens in your browser (no server upload)  

## How to Use

1. **Open the Website** - Open `index.html` in your web browser
2. **Add Images** - Click on the upload area or drag and drop images
3. **Preview** - See previews of selected images
4. **Remove Images** - Hover over a preview and click the × button to remove
5. **Convert to PDF** - Click the "Convert to PDF" button
6. **Download** - The PDF will be automatically downloaded to your device

## File Structure

```
├── index.html      # Main HTML file
├── style.css       # Styling and layout
├── script.js       # JavaScript functionality
└── README.md       # This file
```

## Technical Details

- **Frontend Framework**: Vanilla JavaScript (no dependencies on your end)
- **PDF Library**: jsPDF (loaded from CDN)
- **Browser Compatibility**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **Processing**: 100% client-side (nothing is sent to any server)

## Image Limits

- **Maximum Images**: 30 per PDF
- **Supported Formats**: JPG, PNG, GIF, BMP, WebP
- **File Size**: Depends on total image quality and resolution

## Tips

1. For best results, use images with similar aspect ratios
2. High-resolution images may take slightly longer to process
3. The PDF will automatically handle portrait and landscape images
4. Images are centered on each PDF page

## Browser Support

- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Opera (latest)

## License

Free to use and modify for personal and commercial purposes.

## Version

v1.0.0

---

Enjoy converting your images to PDF! 📄✨
