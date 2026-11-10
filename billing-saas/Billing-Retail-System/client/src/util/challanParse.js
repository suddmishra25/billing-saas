import {
    matchClient,
    matchItem,
    parseSpokenDate,
} from "./voiceInvoiceParse.js";

const TABLE_END =
    /please return|received the above|authorised|authorized|authorised signatory|subject to|gst\s*no/i;

const META_LINE =
    /delivery\s*challan|jai\s*balaji|rubber\s*technolog|manufacturers|gst|gstin|email|website|mob|phone|vasai|waliv|@\s*|\.com|premises|industrial|mumbai|maharashtra|27[a-z0-9]{10}/i;

const LABEL_ONLY = /^(challan\s*no\.?|date|bill\s*no\.?|p\.?\s*o\.?\s*no\.?|p\.?\s*o\.?\s*date)$/i;

const DATE_TOKEN = /^(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})$/;

const cleanLineName = (raw) =>
    (raw || "")
        .replace(/^\d+[\.\):\-]\s*/, "")
        .replace(/\s+/g, " ")
        .trim();

const parseQtyToken = (token) => {
    const n = Number(String(token).replace(/,/g, "").replace(/[^\d.]/g, ""));
    return n > 0 && n < 1_000_000 ? n : 0;
};

const isMetaLine = (line) => {
    const t = (line || "").trim();
    if (!t) return true;
    if (META_LINE.test(t)) return true;
    if (LABEL_ONLY.test(t)) return true;
    if (/^(s\.?\s*no\.?|description|quantity|bill\s*no|p\.?\s*o)/i.test(t)) return true;
    return false;
};

const cleanClientName = (raw) => {
    let name = (raw || "").trim();
    name = name.replace(/^customer\s*\(\s*m\s*\/\s*s\s*\)\s*:?\s*/i, "");
    const stop = name.search(/\b(gala|building|bldg|hdil|virar|vasai|road|nagar|dist)\b/i);
    if (stop > 4) name = name.slice(0, stop).trim();
    name = name.replace(/\s{2,}.*/, "").trim();
    name = name.replace(/[,;]+$/, "").trim();
    return name.slice(0, 120);
};

/** Merge "Challan No." + "159" on separate OCR lines. */
export const normalizeChallanOcrText = (raw) => {
    const lines = (raw || "")
        .replace(/\r/g, "\n")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

    const out = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const next = lines[i + 1] || "";

        if (/^challan\s*no\.?\s*$/i.test(line) && /^\d{1,8}$/.test(next)) {
            out.push(`Challan No. ${next}`);
            i++;
            continue;
        }
        if (/^date\s*$/i.test(line) && DATE_TOKEN.test(next)) {
            out.push(`Date ${next}`);
            i++;
            continue;
        }
        if (/^customer\s*\(\s*m\s*\/\s*s\s*\)\s*$/i.test(line) && next && !isMetaLine(next)) {
            out.push(`Customer (M/s) ${next}`);
            i++;
            continue;
        }

        out.push(
            line
                .replace(/\bcha[1lI]lan\b/gi, "Challan")
                .replace(/\bcust0mer\b/gi, "Customer")
        );
    }
    return out.join("\n");
};

const mergeLineHints = (arrays) => {
    const seen = new Set();
    const out = [];
    for (const list of arrays) {
        for (const row of list || []) {
            const name = cleanLineName(row.namePhrase);
            const qty = Number(row.quantity);
            if (!name || !qty || qty <= 0) continue;
            if (/^(description|quantity|s\.?\s*no)$/i.test(name)) continue;
            if (isMetaLine(name)) continue;
            const key = `${name.toLowerCase()}:${qty}`;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({namePhrase: name, quantity: qty});
        }
    }
    return out;
};

const extractChallanNumber = (lines) => {
    for (const line of lines) {
        const same = line.match(/challan\s*no\.?\s*[:\-]?\s*(\d{1,8})/i);
        if (same) return same[1];
    }
    for (let i = 0; i < lines.length; i++) {
        if (/challan\s*no\.?/i.test(lines[i]) && /^\d{1,8}$/.test(lines[i + 1] || "")) {
            return lines[i + 1];
        }
    }
    return "";
};

const extractChallanDate = (lines) => {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const inline = line.match(/\bdate\s*[:\-]?\s*(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})/i);
        if (inline) {
            const before = line.slice(0, inline.index).toLowerCase();
            if (!/p\.?\s*o/.test(before)) {
                const iso = parseSpokenDate(inline[1]);
                if (iso) return iso;
            }
        }
        if (/^date\s*$/i.test(line) && DATE_TOKEN.test(lines[i + 1] || "")) {
            return parseSpokenDate(lines[i + 1]);
        }
    }
    for (const line of lines.slice(0, 40)) {
        if (/p\.?\s*o/i.test(line)) continue;
        const m = line.match(/(\d{1,2}\.\d{1,2}\.\d{2,4})/);
        if (m) {
            const iso = parseSpokenDate(m[1]);
            if (iso) return iso;
        }
    }
    return "";
};

const extractCustomer = (lines) => {
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!/customer\s*\(\s*m\s*\/\s*s\s*\)/i.test(line)) continue;

        const inline = line.match(/customer\s*\(\s*m\s*\/\s*s\s*\)\s*:?\s*(.+)/i);
        if (inline?.[1]?.trim()) {
            const name = cleanClientName(inline[1]);
            if (name.length > 2) return name;
        }
        const next = lines[i + 1];
        if (next && !isMetaLine(next) && !DATE_TOKEN.test(next) && !/^\d{1,8}$/.test(next)) {
            const name = cleanClientName(next);
            if (name.length > 2) return name;
        }
    }
    return "";
};

const extractProductLines = (lines) => {
    const rows = [];
    const tableHeaderIdx = lines.findIndex(
        (l) => /description/i.test(l) && /quantity/i.test(l)
    );
    const customerIdx = lines.findIndex((l) => /customer\s*\(\s*m\s*\/\s*s\s*\)/i.test(l));
    let start = tableHeaderIdx >= 0 ? tableHeaderIdx + 1 : customerIdx >= 0 ? customerIdx + 2 : 0;
    if (start < 0) start = 0;

    let end = lines.length;
    for (let i = start; i < lines.length; i++) {
        if (TABLE_END.test(lines[i])) {
            end = i;
            break;
        }
    }

    const slice = lines.slice(start, end);

    for (let i = 0; i < slice.length; i++) {
        const line = slice[i];
        if (isMetaLine(line)) continue;
        if (/^(s\.?\s*no\.?|description|quantity)$/i.test(line)) continue;

        const serialRow = line.match(
            /^(\d+)\s+(.+?)\s+(\d+(?:\.\d+)?)\s*(?:pcs?|nos?)?\.?\s*$/i
        );
        if (serialRow) {
            const qty = parseQtyToken(serialRow[3]);
            const name = cleanLineName(serialRow[2]);
            if (name && qty) rows.push({namePhrase: name, quantity: qty});
            continue;
        }

        const pcsInline = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:pcs?|nos?)\.?\s*$/i);
        if (pcsInline) {
            const name = cleanLineName(pcsInline[1]);
            const qty = parseQtyToken(pcsInline[2]);
            if (name.length > 1 && qty && /[a-zA-Z]/.test(name)) {
                rows.push({namePhrase: name, quantity: qty});
                continue;
            }
        }

        const qtyOnly = (slice[i + 1] || "").match(/^(\d+(?:\.\d+)?)\s*(?:pcs?|nos?)\.?\s*$/i);
        if (
            qtyOnly &&
            /[a-zA-Z]/.test(line) &&
            !/^\d+$/.test(line) &&
            line.length > 2
        ) {
            const name = cleanLineName(line);
            const qty = parseQtyToken(qtyOnly[1]);
            if (name && qty) {
                rows.push({namePhrase: name, quantity: qty});
                i++;
            }
        }
    }

    if (!rows.length) {
        for (const line of lines) {
            if (isMetaLine(line)) continue;
            const pcs = line.match(
                /^(.{3,80}?)\s+(\d+(?:\.\d+)?)\s*(?:pcs?|nos?)\b/i
            );
            if (pcs && /[a-zA-Z]/.test(pcs[1])) {
                const name = cleanLineName(pcs[1]);
                const qty = parseQtyToken(pcs[2]);
                if (name && qty) rows.push({namePhrase: name, quantity: qty});
            }
        }
    }

    return mergeLineHints([rows]);
};

const scoreParse = (parsed) =>
    (parsed.clientHint ? 3 : 0) +
    (parsed.challanNumber ? 3 : 0) +
    (parsed.challanDated ? 2 : 0) +
    (parsed.lineHints?.length || 0) * 4;

const parseDeliveryChallanStructured = (rawText) => {
    const normalized = normalizeChallanOcrText(rawText);
    const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);

    const clientHint = extractCustomer(lines);
    const challanNumber = extractChallanNumber(lines);
    const challanDated = extractChallanDate(lines);
    const lineHints = extractProductLines(lines);

    return {
        rawText: normalized,
        clientHint,
        challanNumber,
        challanDated,
        lineHints,
    };
};

/**
 * Parse OCR or pasted challan text (JaiBalaji delivery challan layout).
 */
export const parseChallanText = (rawText) => {
    const structured = parseDeliveryChallanStructured(rawText);
    return structured;
};

export const parseChallanTextsPickBest = (texts) => {
    let best = null;
    let bestScore = -1;
    let bestRaw = "";
    for (const t of texts || []) {
        if (!t?.trim()) continue;
        const p = parseChallanText(t);
        const s = scoreParse(p);
        if (s > bestScore) {
            bestScore = s;
            best = p;
            bestRaw = t.trim();
        }
    }
    if (!best && texts?.[0]?.trim()) {
        best = parseChallanText(texts[0]);
        bestRaw = texts[0].trim();
    }
    return best ? {...best, rawText: bestRaw} : parseChallanText("");
};

export const mapHintsToInvoiceLines = (lineHints, catalogItems) => {
    return (lineHints || []).map((hint) => {
        const item = matchItem(hint.namePhrase, catalogItems);
        return {
            itemId: item?.itemId || "",
            name: item?.name || hint.namePhrase,
            quantity: hint.quantity,
            rate: item?.sellingPrice != null ? String(item.sellingPrice) : "",
            matched: Boolean(item),
        };
    });
};

export const resolveClientFromHint = (clientHint, clients) => {
    if (!clientHint?.trim() || !clients?.length) return null;
    return matchClient(clientHint, clients);
};

export const SAMPLE_CHALLAN_OCR = `DELIVERY CHALLAN
Challan No.
159
Date
15.9.26
Customer (M/s) Sunshine Billiards
S. No. Description Quantity
1 "L" Rubber Red. 60 PCS
Please Return The Copy Duly Signed.`;
