/**
 * Preprocess pink delivery-challan photos for OCR (contrast + upscale).
 */
export const prepareChallanImageForOcr = (file) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            const scale = Math.min(2.5, Math.max(1.75, 2400 / Math.max(img.width, img.height)));
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                URL.revokeObjectURL(url);
                resolve(file);
                return;
            }
            ctx.drawImage(img, 0, 0, w, h);
            const imageData = ctx.getImageData(0, 0, w, h);
            const {data} = imageData;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                const pinkSheet = r > g + 15 && r > b + 15;
                let out;
                if (pinkSheet) {
                    out = gray < 165 ? 0 : 255;
                } else {
                    out = gray < 130 ? 0 : 255;
                }
                data[i] = out;
                data[i + 1] = out;
                data[i + 2] = out;
            }
            ctx.putImageData(imageData, 0, 0);
            canvas.toBlob(
                (blob) => {
                    URL.revokeObjectURL(url);
                    resolve(blob || file);
                },
                "image/png",
                1
            );
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Could not load image"));
        };
        img.src = url;
    });

const runTesseract = async (input, psm) => {
    const {createWorker, PSM} = await import("tesseract.js");
    const worker = await createWorker("eng");
    await worker.setParameters({
        tessedit_pageseg_mode: psm ?? PSM.SINGLE_BLOCK,
    });
    const {data} = await worker.recognize(input);
    await worker.terminate();
    return data.text || "";
};

/** Run OCR on original + preprocessed image. */
export const recognizeChallanImage = async (file) => {
    const {PSM} = await import("tesseract.js");
    const psm = PSM.SINGLE_BLOCK;
    const texts = [];
    try {
        texts.push(await runTesseract(file, psm));
    } catch (e) {
        console.warn("OCR on original failed", e);
    }
    try {
        const prepped = await prepareChallanImageForOcr(file);
        texts.push(await runTesseract(prepped, psm));
    } catch (e) {
        console.warn("OCR on preprocessed failed", e);
    }
    return [...new Set(texts.filter(Boolean))];
};
