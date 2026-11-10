const normalize = (s) =>
    (s || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

/** dd-mm-yyyy, dd/mm/yyyy, dd.mm.yyyy → yyyy-mm-dd */
export const parseSpokenDate = (fragment) => {
    if (!fragment?.trim()) return "";
    const m = fragment.trim().match(/(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})/);
    if (!m) return "";
    let d = m[1].padStart(2, "0");
    let mo = m[2].padStart(2, "0");
    let y = m[3];
    if (y.length === 2) y = Number(y) > 50 ? `19${y}` : `20${y}`;
    return `${y}-${mo}-${d}`;
};

const extractDateNear = (text, labels) => {
    for (const label of labels) {
        const re = new RegExp(
            `${label}\\s*(?:is|:)?\\s*([\\d]{1,2}[./\\-][\\d]{1,2}[./\\-][\\d]{2,4})`,
            "i"
        );
        const m = text.match(re);
        if (m) return parseSpokenDate(m[1]);
    }
    const fallback = text.match(/(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})/);
    return fallback ? parseSpokenDate(fallback[1]) : "";
};

export const matchClient = (transcript, clients) => {
    if (!clients?.length) return null;
    const t = normalize(transcript);
    let best = null;
    let bestScore = 0;
    for (const c of clients) {
        const name = normalize(c.name);
        if (!name) continue;
        if (t.includes(name)) {
            return c;
        }
        const words = name.split(" ").filter((w) => w.length > 2);
        const score = words.reduce((acc, w) => (t.includes(w) ? acc + 1 : acc), 0);
        if (score > bestScore && score >= Math.min(2, words.length)) {
            bestScore = score;
            best = c;
        }
    }
    return best;
};

export const matchItem = (phrase, catalogItems) => {
    const p = normalize(phrase);
    if (!p || !catalogItems?.length) return null;
    let best = null;
    let bestLen = 0;
    for (const it of catalogItems) {
        const name = normalize(it.name);
        if (!name) continue;
        if (p.includes(name) || name.includes(p)) {
            if (name.length > bestLen) {
                best = it;
                bestLen = name.length;
            }
        }
    }
    if (best) return best;
    for (const it of catalogItems) {
        const name = normalize(it.name);
        const words = name.split(" ").filter((w) => w.length > 3);
        if (words.some((w) => p.includes(w))) return it;
    }
    return null;
};

/**
 * Parse spoken invoice details (English-oriented). Returns partial draft for user review.
 */
export const parseVoiceInvoiceTranscript = (transcript) => {
    const raw = (transcript || "").trim();
    const text = raw.replace(/\s+/g, " ");

    const invoiceDate = extractDateNear(text, [
        "bill date",
        "invoice date",
        "bill dated",
        "dated",
    ]);

    let challanNumber = "";
    const challanNumMatch = text.match(
        /challan\s*(?:no\.?|number|#)?\s*(?:is|:)?\s*([A-Za-z0-9\-/]+)/i
    );
    if (challanNumMatch) challanNumber = challanNumMatch[1].trim();

    const challanDated =
        extractDateNear(text, ["challan date", "challan dated"]) ||
        (challanNumMatch
            ? extractDateNear(text.slice(text.indexOf(challanNumMatch[0])), ["dated"])
            : "");

    const lines = [];
    const itemPatterns = [
        /(\d+)\s+(?:pcs|pieces|qty|quantity|units?)?\s*(?:of\s+)?([^,.;]+?)(?=\s*,\s*|\s+and\s+\d+|\s*\.|$)/gi,
        /([^,.;]+?)\s+(?:qty|quantity|pcs|pieces)\s*(\d+)/gi,
    ];

    const seen = new Set();
    for (const re of itemPatterns) {
        let m;
        const copy = text;
        re.lastIndex = 0;
        while ((m = re.exec(copy)) !== null) {
            let qty;
            let name;
            if (re === itemPatterns[0]) {
                qty = Number(m[1]);
                name = m[2].trim();
            } else {
                name = m[1].trim();
                qty = Number(m[2]);
            }
            name = name.replace(/\b(for|client|bill|challan|date|invoice)\b/gi, "").trim();
            if (!name || !qty || qty <= 0) continue;
            const key = `${name}:${qty}`;
            if (seen.has(key)) continue;
            seen.add(key);
            lines.push({namePhrase: name, quantity: qty});
        }
    }

    let clientHint = "";
    const clientMatch = text.match(
        /(?:client|customer|bill to|for)\s+(?:is\s+)?([^,.]+?)(?=\s+bill\s+date|\s+challan|\s+\d+\s+pcs|,|$)/i
    );
    if (clientMatch) clientHint = clientMatch[1].trim();

    return {
        rawTranscript: raw,
        clientHint,
        invoiceDate,
        challanNumber,
        challanDated,
        lineHints: lines,
    };
};

export const getSpeechRecognition = () => {
    if (typeof window === "undefined") return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

export const parseSpokenQuantity = (text) => {
    const t = (text || "").trim();
    const wordMatch = t.match(/\b(\d+)\b/);
    if (wordMatch) return Number(wordMatch[1]);
    const onlyNum = t.replace(/[^\d]/g, "");
    if (onlyNum) return Number(onlyNum);
    return NaN;
};

const DONE_PHRASES = [
    "done",
    "finished",
    "finish",
    "no more",
    "that's all",
    "thats all",
    "all done",
    "generate",
    "complete",
    "stop",
];

export const isProductsDonePhrase = (text) => {
    const t = normalize(text);
    return DONE_PHRASES.some((p) => t === p || t.startsWith(`${p} `) || t.endsWith(` ${p}`));
};

export const isSkipPhrase = (text) => {
    const t = normalize(text);
    return ["skip", "none", "no", "na", "not applicable", "no challan"].some(
        (p) => t === p || t.startsWith(p)
    );
};

export const speakPrompt = (message) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(message);
    u.lang = "en-IN";
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
};
