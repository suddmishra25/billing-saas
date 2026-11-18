/**
 * Preprocess pink delivery-challan photos for OCR (contrast + upscale + blue-ink).
 */

const loadImageFromFile = (file) =>
    new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Could not load image"));
        };
        img.src = url;
    });

const canvasToBlob = (canvas) =>
    new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png", 1);
    });

const preprocessPixels = (data) => {
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const pinkSheet = r > g + 10 && r > b + 10 && r > 120;
        const blueInk = b > r + 18 && b > g - 5 && gray < 210;
        const redStamp = r > 150 && g < 120 && b < 120;
        const darkMark = blueInk || redStamp || gray < (pinkSheet ? 155 : 125);
        const out = darkMark ? 0 : 255;
        data[i] = out;
        data[i + 1] = out;
        data[i + 2] = out;
    }
};

/**
 * @param {HTMLImageElement} img
 * @param {{ sx?: number, sy?: number, sw?: number, sh?: number, scale?: number }} opts
 */
const renderChallanCanvas = (img, opts = {}) => {
    const {sx = 0, sy = 0, sw = img.width, sh = img.height} = opts;
    const scale = opts.scale ?? Math.min(2.8, Math.max(1.8, 2600 / Math.max(sw, sh)));
    const w = Math.round(sw * scale);
    const h = Math.round(sh * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    const imageData = ctx.getImageData(0, 0, w, h);
    preprocessPixels(imageData.data);
    ctx.putImageData(imageData, 0, 0);
    return canvas;
};

/** Full page + crops (header / body) for OCR. */
export const buildChallanOcrInputs = async (file) => {
    const img = await loadImageFromFile(file);
    const blobs = [];

    const pushCanvas = async (canvas) => {
        if (!canvas) return;
        const blob = await canvasToBlob(canvas);
        if (blob) blobs.push(blob);
    };

    const fullScale = Math.min(2.5, Math.max(1.6, 2400 / Math.max(img.width, img.height)));
    const full = document.createElement("canvas");
    full.width = Math.round(img.width * fullScale);
    full.height = Math.round(img.height * fullScale);
    const fctx = full.getContext("2d");
    if (fctx) {
        fctx.drawImage(img, 0, 0, full.width, full.height);
        const imageData = fctx.getImageData(0, 0, full.width, full.height);
        preprocessPixels(imageData.data);
        fctx.putImageData(imageData, 0, 0);
        await pushCanvas(full);
    }

    blobs.push(file);

    const h = img.height;
    const w = img.width;
    await pushCanvas(renderChallanCanvas(img, {sy: Math.round(h * 0.22), sh: Math.round(h * 0.52), scale: 3}));
    await pushCanvas(renderChallanCanvas(img, {sy: Math.round(h * 0.5), sh: Math.round(h * 0.38), scale: 3.2}));
    await pushCanvas(
        renderChallanCanvas(img, {sy: Math.round(h * 0.46), sh: Math.round(h * 0.22), scale: 4})
    );

    return blobs;
};

export const prepareChallanImageForOcr = (file) =>
    loadImageFromFile(file).then(async (img) => {
        const canvas = renderChallanCanvas(img);
        if (!canvas) return file;
        return (await canvasToBlob(canvas)) || file;
    });

const runTesseractOnInputs = async (inputs) => {
    const {createWorker, PSM} = await import("tesseract.js");
    const worker = await createWorker("eng");
    const psms = [PSM.SINGLE_COLUMN, PSM.SINGLE_BLOCK];
    const texts = [];

    try {
        for (const input of inputs) {
            for (const psm of psms) {
                await worker.setParameters({
                    tessedit_pageseg_mode: psm,
                    preserve_interword_spaces: "1",
                });
                try {
                    const {data} = await worker.recognize(input);
                    const t = (data.text || "").trim();
                    if (t) texts.push(t);
                } catch (e) {
                    console.warn("OCR pass failed", e);
                }
            }
        }
    } finally {
        await worker.terminate();
    }

    return [...new Set(texts)];
};

/** Run OCR on original, preprocessed, and regional crops. */
export const recognizeChallanImage = async (file) => {
    try {
        const inputs = await buildChallanOcrInputs(file);
        return await runTesseractOnInputs(inputs);
    } catch (e) {
        console.warn("buildChallanOcrInputs failed, falling back", e);
        const {PSM} = await import("tesseract.js");
        const texts = [];
        try {
            const prepped = await prepareChallanImageForOcr(file);
            const {createWorker} = await import("tesseract.js");
            const worker = await createWorker("eng");
            await worker.setParameters({tessedit_pageseg_mode: PSM.SINGLE_COLUMN});
            const {data} = await worker.recognize(prepped);
            await worker.terminate();
            if (data.text?.trim()) texts.push(data.text.trim());
        } catch (err) {
            console.warn(err);
        }
        return texts;
    }
};
