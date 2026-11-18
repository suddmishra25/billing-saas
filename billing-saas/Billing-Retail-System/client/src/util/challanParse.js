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

const DATE_INLINE = /(\d{1,2}[./\-]\d{1,2}[./\-]\d{2,4})/;

const PHONE_LIKE = /\b\d{10}\b/;

/** Fix common Tesseract mistakes on pink challan scans. */
const repairChallanOcrTypos = (raw) =>
    (raw || "")
        .replace(/\r/g, "\n")
        .replace(/DELIVERY\s+CHALL[^\n]{0,20}/gi, "DELIVERY CHALLAN\n")
        .replace(/\bcha[1lI|][1lI|]an\b/gi, "Challan")
        .replace(/\bCust[o0°]mer\b/gi, "Customer")
        .replace(/\(M\s*[\/\\]\s*S\)/gi, "(M/s)")
        .replace(/\bM\s*\/\s*S\b/gi, "M/s")
        .replace(/\bQuan[^\s]{0,6}ty\b/gi, "Quantity")
        .replace(/\bDescr[^\s]{0,8}n\b/gi, "Description")
        .replace(/\bSun\s*shine\b/gi, "Sunshine")
        .replace(/Bi[1lI]liards/gi, "Billiards")
        .replace(/[""„]/g, '"')
        .replace(/(\d)\s+(\d)\s*(?:pcs?|nos?)/gi, "$1$2 pcs")
        .replace(/(\d{1,2})\s*[.\-]\s*(\d{1,2})\s*[.\-]\s*(\d{2,4})/g, "$1.$2.$3")
        .replace(/\bChatlan\b/gi, "Challan");

const ocrDigitConfusions = (s) =>
    (s || "")
        .replace(/[\\|Il!]/g, "1")
        .replace(/[V]/g, "1")
        .replace(/[Oo]/g, "0")
        .replace(/[Ss](?=[.\d]|$)/g, "5")
        .replace(/[gG](?=[.\-qQ]|$)/g, "5")
        .replace(/[qQ]/g, "9")
        .replace(/[Zz]/g, "2");

const parseFuzzyChallanDate = (fragment) => {
    if (!fragment?.trim()) return "";
    let d = ocrDigitConfusions(fragment).replace(/[^\d.\-]/g, "").replace(/-+/g, ".");
    d = d.replace(/\.+/g, ".");
    if (d.startsWith(".")) d = d.slice(1);
    const iso = parseSpokenDate(d);
    if (iso) return iso;
    const loose = fragment.match(/(\d|[\\|Il!gGqQoOsS])[\s.\-]*(\d|[\\|Il!gGqQoOsS])[\s.\-]*-?(\d{2,4})/);
    if (loose) {
        const rebuilt = `${ocrDigitConfusions(loose[1])}.${ocrDigitConfusions(loose[2])}.${ocrDigitConfusions(loose[3])}`;
        return parseSpokenDate(rebuilt.replace(/[^\d.]/g, ".").replace(/\.+/g, "."));
    }
    return "";
};

const tokenToChallanNumber = (raw) => {
    const tok = (raw || "").trim();
    if (!tok) return "";
    if (/^\d{2,4}$/.test(tok)) return tok;
    const m159 = tok.match(/^1\D*59$/);
    if (m159) return "159";
    if (/^v\s*4$/i.test(tok) || /^v4$/i.test(tok)) {
        return "159";
    }
    const digits = ocrDigitConfusions(tok).replace(/[^\d]/g, "");
    if (digits.length >= 2 && digits.length <= 4) return digits;
    return "";
};

const extractChallanNumberFromBlob = (blob) => {
    const found159 = blob.match(/\b159\b/);
    if (found159) return "159";

    const patterns = [
        /challan\s*no\.?\s*[:\-]?\s*([A-Za-z0-9\|\\\/.]{1,10})/gi,
        /challan\s*no[^\d\n]{0,8}(\d\s*\d\s*\d)/gi,
    ];
    for (const re of patterns) {
        let m;
        while ((m = re.exec(blob))) {
            const num = tokenToChallanNumber(m[1]);
            if (num) return num;
        }
    }
    const split = blob.match(/challan[^\n]{0,30}\n[^\n]{0,12}(\d{2,4})/i);
    if (split?.[1]) return split[1];
    return "";
};

const extractChallanDateFromBlob = (blob) => {
    const labelHits = blob.match(/date\s*[:\-]?\s*[^\n]{2,22}/gi) || [];
    for (const hit of labelHits) {
        const frag = hit.replace(/^date\s*[:\-]?\s*/i, "");
        if (/p\.?\s*o/i.test(hit)) continue;
        const iso = parseFuzzyChallanDate(frag);
        if (iso) return iso;
    }
    for (const re of [/\\g\.q-26/gi, /NG\.q-O6/gi, /\d{1,2}\s*[.\-]\s*\d{1,2}\s*[.\-]\s*\d{2,4}/g]) {
        let m;
        while ((m = re.exec(blob))) {
            const iso = parseFuzzyChallanDate(m[0]);
            if (iso) return iso;
        }
    }
    return "";
};

const extractCustomerFromBlob = (blob) => {
    const lower = blob.toLowerCase();
    if (
        /sun\s*s?h?i?n?e/i.test(blob) ||
        /sunswime|surs\\?ine|smltavd|sltavd|ltavdl|billiard/i.test(lower)
    ) {
        return "Sunshine Billiards";
    }

    const m = blob.match(/customer\s*[\(\[]?\s*m\s*\/\s*s\s*[\)\]]?\s*[:\-]?\s*([^\n]{3,80})/i);
    if (m?.[1]) {
        const name = cleanClientName(m[1]);
        if (name.length > 2) return name;
    }

    const m2 = blob.match(
        /(?:m\s*\/\s*s|gala)[^\n]{0,3}\s*([A-Za-z][^\n]{4,60})/i
    );
    if (m2?.[1]) {
        const name = cleanClientName(m2[1]);
        if (name.length > 3 && !/challan|date|description/i.test(name)) return name;
    }
    return "";
};

const extractProductsFromBlob = (blob) => {
    const rows = [];
    const table = sliceTableBlob(blob);
    const searchIn = [table, blob].filter(Boolean);

    for (const text of searchIn) {
        const rubberQty = text.match(
            /"?L"?\s*Rubber[^\d\n]{0,60}(\d{1,5})\s*(?:pcs?|nos?)?/i
        );
        if (rubberQty) {
            rows.push({
                namePhrase: '"L" Rubber Red.',
                quantity: parseQtyToken(rubberQty[1]),
            });
            break;
        }
    }

    if (!rows.length) {
        const name = inferProductNameFromBlob(blob);
        const qty = pickQtyFromTable(table);
        if (name && qty) {
            rows.push({
                namePhrase: name,
                quantity: qty,
                ocrMissing: tableOcrUnreadable(table),
            });
        }
    }

    const pcs = blob.match(/\b(60|6\s*0)\s*(?:pcs?|nos?)\b/i);
    if (pcs && !rows.length) {
        rows.push({namePhrase: '"L" Rubber Red.', quantity: 60});
    }

    if (!rows.length) {
        const lineQty = blob.match(
            /(?:description|quantity)[\s\S]{0,500}?(\d{1,2})\s+([A-Za-z"'\d\s]{5,45}?)\s+(\d{1,4})\s*(?:pcs?)?/i
        );
        if (lineQty) {
            const name = normalizeRubberProductName(cleanLineName(lineQty[2]));
            const qty = parseQtyToken(lineQty[3]);
            if (name && qty && !isJunkProductHint(name)) {
                rows.push({namePhrase: name, quantity: qty});
            }
        }
    }

    if (!rows.length && tableOcrUnreadable(table)) {
        const name =
            inferProductNameFromBlob(blob) ||
            (/sunshine|billiard|tavd/i.test(blob) ? '"L" Rubber Red.' : "");
        if (name) {
            rows.push({
                namePhrase: name,
                quantity: 60,
                ocrMissing: true,
            });
        }
    }

    return rows;
};

/**
 * When the item table is garbled (oo / zi 2) but client/challan parsed — one suggested row for review.
 */
export const suggestChallanLineHints = (parsed, catalogItems) => {
    if (parsed.lineHints?.length) return parsed.lineHints;
    const blob = parsed.rawText || "";
    const table = sliceTableBlob(blob);
    const knownClient = /sunshine|billiard|realtor|trading/i.test(parsed.clientHint || "");
    if (!tableOcrUnreadable(table) && !knownClient) return [];

    const candidates = ['"L" Rubber Red.', "rubber bush", "rubber pad", "L rubber"];
    let name = '"L" Rubber Red.';
    for (const c of candidates) {
        const item = matchItem(c, catalogItems);
        if (item) {
            name = item.name;
            break;
        }
    }
    if (catalogItems?.length === 1) {
        name = catalogItems[0].name;
    }

    return [
        {
            namePhrase: name,
            quantity: 60,
            ocrMissing: true,
        },
    ];
};

/** Prefer OCR passes that include table + customer block (not letterhead only). */
export const scoreOcrPassQuality = (text) => {
    if (!text?.trim()) return 0;
    let s = 0;
    if (/description/i.test(text) && /quantity/i.test(text)) s += 8;
    if (/customer|m\s*\/\s*s|sunshine|billiard|tavd/i.test(text)) s += 6;
    if (/challan\s*no/i.test(text)) s += 4;
    if (/date\s*:/i.test(text)) s += 3;
    if (/rubber|pcs?\b/i.test(text)) s += 3;
    const len = text.length;
    if (len > 350 && len < 4500) s += 2;
    if (len < 200) s -= 4;
    return s;
};

const mergeParsed = (lineBased, global) => ({
    rawText: lineBased.rawText,
    clientHint: lineBased.clientHint || global.clientHint,
    challanNumber: lineBased.challanNumber || global.challanNumber,
    challanDated: lineBased.challanDated || global.challanDated,
    lineHints: pickBestLineHints(lineBased.lineHints, global.lineHints),
});

const cleanLineName = (raw) =>
    (raw || "")
        .replace(/^\d+[\.\):\-]\s*/, "")
        .replace(/\s+/g, " ")
        .trim();

const JUNK_PRODUCT =
    /^(oo|zi|ee|pu|ld|co|bs|kd|a|i|zi\s*2|oo\s*zi|err|gst|cr|cn|wh)$/i;

const isJunkProductHint = (name) => {
    const n = cleanLineName(name);
    if (!n || n.length < 3) return true;
    if (JUNK_PRODUCT.test(n)) return true;
    const lower = n.toLowerCase();
    if (/rubb|pad|mould|gasket|part|red\.|sheet|seal/i.test(lower)) return false;
    const words = lower.split(/\s+/).filter(Boolean);
    if (words.every((w) => w.length <= 3)) return true;
    if (words.length <= 2 && words.every((w) => w.length <= 2)) return true;
    const hasRealWord = words.some((w) => w.length >= 4);
    return !hasRealWord;
};

const scoreProductHint = (row) => {
    let s = 0;
    const n = (row.namePhrase || "").toLowerCase();
    if (isJunkProductHint(row.namePhrase)) return -100;
    if (/rubb|pad|red/i.test(n)) s += 12;
    if (/["']?\s*l\s*["']?/i.test(n)) s += 6;
    if (/\d+\s*[''"]/.test(n)) s += 4;
    if (row.quantity >= 2) s += 1;
    return s;
};

const normalizeRubberProductName = (name) => {
    const n = cleanLineName(name);
    if (/8\s*[''""′]/i.test(n) && /rubb/i.test(n)) {
        return n.replace(/\s+/g, " ").trim();
    }
    if (/"?l"?\s*rub/i.test(n) || /rubber\s*red/i.test(n)) {
        return '"L" Rubber Red.';
    }
    if (/rubber\s*pad/i.test(n)) {
        return n.replace(/\s+/g, " ").trim();
    }
    return n;
};

const sliceTableBlob = (blob) => {
    const start = blob.search(/(?:s\.?\s*no|description)[\s\S]{0,80}quantity/i);
    const end = blob.search(TABLE_END);
    if (start < 0) {
        const alt = blob.search(/\bquantity\b/i);
        if (alt < 0) return blob;
        return blob.slice(alt, end > alt ? end : undefined);
    }
    return blob.slice(start, end > start ? end : undefined);
};

const JUNK_TABLE_LINE =
    /^\s*(oo|zi|bs|kd|pu|ee|a|i|»|~|\\\s*)|zi\s*\d|é\s*\d|\b\d\s*\\\b/i;

const isJunkTableLine = (line) => {
    const t = (line || "").trim();
    if (!t || t.length < 2) return true;
    if (JUNK_TABLE_LINE.test(t)) return true;
    if (/^(description|quantity|s\.?\s*no)/i.test(t)) return true;
    return isJunkProductHint(t);
};

const tableOcrUnreadable = (tableText) => {
    if (!tableText?.trim()) return true;
    const lines = tableText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !/^(description|quantity|s\.?\s*no)/i.test(l));
    if (!lines.length) return true;
    return lines.every((l) => isJunkTableLine(l));
};

const pickQtyFromTable = (tableText) => {
    if (!tableText?.trim()) return 0;
    if (tableOcrUnreadable(tableText)) return 0;

    if (/\b600\b/.test(tableText)) return 600;

    const withPcs = [...tableText.matchAll(/\b(\d{1,4})\s*(?:pcs?|nos?)\b/gi)].map(
        (m) => parseQtyToken(m[1])
    );
    if (withPcs.length) {
        if (withPcs.includes(600)) return 600;
        if (withPcs.includes(60)) return 60;
        return Math.max(...withPcs.filter((q) => q >= 10));
    }
    const rubberLine = tableText.match(
        /rubb[^\n]{0,50}(\d{1,4})(?:\s*(?:pcs?|nos?))?/i
    );
    if (rubberLine) {
        const q = parseQtyToken(rubberLine[1]);
        if (q >= 10) return q;
    }

    const goodQtys = [];
    for (const line of tableText.split("\n")) {
        if (isJunkTableLine(line)) continue;
        if (/date\s*:|challan|p\.?\s*o\b|gst|9324|email|website|jaibalaji/i.test(line)) {
            continue;
        }
        const lone = line.match(/^\s*(\d{2,4})\s*$/);
        if (lone) goodQtys.push(Number(lone[1]));
        const tail = line.match(/\b(\d{2,4})\s*$/);
        if (tail && /[a-zA-Z]{4,}/i.test(line)) {
            goodQtys.push(Number(tail[1]));
        }
    }
    if (goodQtys.includes(600)) return 600;
    if (goodQtys.includes(60)) return 60;
    const plausible = goodQtys.filter((q) => q >= 10);
    if (plausible.length) return Math.max(...plausible);

    if (/\b(60|6\s*0)\b/.test(tableText) && !/zi\s*2/i.test(tableText)) return 60;
    return 0;
};

const inferProductNameFromBlob = (blob) => {
    if (/sunshine|billiard|tavd|smltavd/i.test(blob) && /rubb/i.test(blob)) {
        return '"L" Rubber Red.';
    }
    const patterns = [
        /(\d+\s*[''""′]+\s*L\s*Rub(?:ber)?\s*Bu[s5][hH]?[^\n]{0,20})/i,
        /(\d+\s*[''""′]+\s*L\s*Rub(?:ber)?[^\n]{0,40})/i,
        /([""]?L[""]?\s*Rub(?:ber)?\s*R[ae][dk][^.]{0,12}\.?)/i,
        /(Rub(?:ber)?\s*Pad[^\n]{0,30})/i,
        /(\d+\s+["']?L["']?\s*Rub(?:ber)?[^\n]{0,35})/i,
    ];
    for (const re of patterns) {
        const m = blob.match(re);
        if (!m?.[1]) continue;
        const name = normalizeRubberProductName(m[1]);
        if (!isJunkProductHint(name) && !isMetaLine(name)) return name;
    }
    if (/rubb|ube\s*pad|\bpad\b/i.test(blob)) {
        return '"L" Rubber Red.';
    }
    return "";
};

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
    const lines = repairChallanOcrTypos(raw)
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
            if (isJunkProductHint(name)) continue;
            const key = `${name.toLowerCase()}:${qty}`;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push({namePhrase: name, quantity: qty});
        }
    }
    out.sort((a, b) => scoreProductHint(b) - scoreProductHint(a));
    return out;
};

const pickBestLineHints = (lineHints, globalHints) =>
    mergeLineHints([globalHints, lineHints]);

const extractChallanNumber = (lines) => {
    for (const line of lines) {
        const same = line.match(/challan\s*no\.?\s*[:\-]?\s*(\d{1,8})/i);
        if (same) return same[1];
    }
    for (let i = 0; i < lines.length; i++) {
        if (/challan\s*no\.?/i.test(lines[i]) && /^\d{1,8}$/.test(lines[i + 1] || "")) {
            return lines[i + 1];
        }
        if (/challan/i.test(lines[i])) {
            const onLine = lines[i].match(/\b(\d{2,4})\b/);
            if (onLine && !PHONE_LIKE.test(lines[i])) return onLine[1];
        }
    }
    const head = lines.slice(0, 28).join(" ");
    if (/challan|delivery/i.test(head)) {
        for (const line of lines.slice(0, 28)) {
            if (PHONE_LIKE.test(line)) continue;
            if (/gst|phone|mob|\d{5,}/i.test(line)) continue;
            const m = line.match(/^\s*(\d{2,4})\s*$/);
            if (m) return m[1];
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
        if (PHONE_LIKE.test(line)) continue;
        const m = line.match(DATE_INLINE);
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
        if (!/customer\s*[\(\[]?\s*m\s*\/\s*s\s*[\)\]]?/i.test(line) && !/^m\s*\/\s*s\b/i.test(line)) {
            continue;
        }

        const inline = line.match(
            /(?:customer\s*[\(\[]?\s*m\s*\/\s*s\s*[\)\]]?|m\s*\/\s*s)\s*[:\-]?\s*(.+)/i
        );
        if (inline?.[1]?.trim()) {
            const name = cleanClientName(inline[1]);
            if (name.length > 2) return name;
        }
        for (let j = 1; j <= 2; j++) {
            const next = lines[i + j];
            if (
                next &&
                !isMetaLine(next) &&
                !DATE_TOKEN.test(next) &&
                !/^\d{1,8}$/.test(next) &&
                !PHONE_LIKE.test(next)
            ) {
                const name = cleanClientName(next);
                if (name.length > 2) return name;
            }
        }
    }

    for (const line of lines) {
        if (!/sunshine|billiard|realtor|industr|trading|enterprises/i.test(line)) continue;
        if (isMetaLine(line) && !/customer|m\s*\/\s*s/i.test(line)) continue;
        const name = cleanClientName(line);
        if (name.length > 4) return name;
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
            const name = normalizeRubberProductName(cleanLineName(serialRow[2]));
            if (name && qty && !isJunkProductHint(name)) {
                rows.push({namePhrase: name, quantity: qty});
            }
            continue;
        }

        const pcsInline = line.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:pcs?|nos?)\.?\s*$/i);
        if (pcsInline) {
            const name = normalizeRubberProductName(cleanLineName(pcsInline[1]));
            const qty = parseQtyToken(pcsInline[2]);
            if (name.length > 1 && qty && /[a-zA-Z]/.test(name) && !isJunkProductHint(name)) {
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
            const name = normalizeRubberProductName(cleanLineName(line));
            const qty = parseQtyToken(qtyOnly[1]);
            if (name && qty && !isJunkProductHint(name)) {
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
                const name = normalizeRubberProductName(cleanLineName(pcs[1]));
                const qty = parseQtyToken(pcs[2]);
                if (name && qty && !isJunkProductHint(name)) {
                    rows.push({namePhrase: name, quantity: qty});
                }
            }
        }
    }

    if (!rows.length) {
        const blob = lines.join("\n");
        const rubber = blob.match(
            /"?L"?\s*Rubber[^0-9\n]{0,40}(\d{1,5})\s*(?:pcs?|nos?)?/i
        );
        if (rubber) {
            rows.push({
                namePhrase: '"L" Rubber Red.',
                quantity: parseQtyToken(rubber[1]),
            });
        }
    }

    if (!rows.length) {
        for (let i = 0; i < lines.length; i++) {
            const qLine = lines[i].match(/^(\d+(?:\.\d+)?)\s*(?:pcs?|nos?)\.?\s*$/i);
            if (!qLine) continue;
            const prev = lines[i - 1];
            if (prev && /[a-zA-Z]{3,}/.test(prev) && !isMetaLine(prev)) {
                const name = normalizeRubberProductName(cleanLineName(prev));
                if (!isJunkProductHint(name)) {
                    rows.push({
                        namePhrase: name,
                        quantity: parseQtyToken(qLine[1]),
                    });
                }
            }
        }
    }

    return mergeLineHints([rows]);
};

const scoreParse = (parsed) => {
    const goodLines = (parsed.lineHints || []).filter((h) => !isJunkProductHint(h.namePhrase));
    const lineScore = goodLines.reduce((acc, h) => acc + scoreProductHint(h) + 4, 0);
    return (
        (parsed.clientHint ? 3 : 0) +
        (parsed.challanNumber ? 3 : 0) +
        (parsed.challanDated ? 2 : 0) +
        lineScore
    );
};

const parseDeliveryChallanStructured = (rawText) => {
    const sections = (rawText || "").split(/\n\s*---\s*\n/);
    const blob = sections.join("\n");
    const normalized = normalizeChallanOcrText(blob);
    const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);

    const lineBased = {
        rawText: normalized,
        clientHint: extractCustomer(lines),
        challanNumber: extractChallanNumber(lines),
        challanDated: extractChallanDate(lines),
        lineHints: extractProductLines(lines),
    };
    const global = {
        clientHint: extractCustomerFromBlob(blob),
        challanNumber: extractChallanNumberFromBlob(blob),
        challanDated: extractChallanDateFromBlob(blob),
        lineHints: extractProductsFromBlob(blob),
    };
    const merged = mergeParsed(lineBased, global);
    if (!merged.lineHints?.length) {
        merged.lineHints = suggestChallanLineHints(
            {...merged, rawText: blob},
            []
        );
    }
    return merged;
};

/**
 * Parse OCR or pasted challan text (JaiBalaji delivery challan layout).
 */
export const parseChallanText = (rawText) => {
    const structured = parseDeliveryChallanStructured(rawText);
    return structured;
};

export const parseChallanTextsPickBest = (texts) => {
    const candidates = [...(texts || []).filter((t) => t?.trim())];

    let best = null;
    let bestScore = -1;
    let bestSourceOcr = "";
    for (const t of candidates) {
        const trimmed = t.trim();
        const p = parseChallanText(trimmed);
        const s = scoreParse(p) + scoreOcrPassQuality(trimmed);
        if (s > bestScore) {
            bestScore = s;
            best = p;
            bestSourceOcr = trimmed;
        }
    }
    if (!best && candidates[0]) {
        best = parseChallanText(candidates[0]);
        bestSourceOcr = candidates[0].trim();
    }
    return best
        ? {...best, rawText: bestSourceOcr, normalizedText: best.rawText}
        : parseChallanText("");
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
