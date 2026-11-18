// Standard ISO/IEC 15417 Code128 bar-width patterns (values 0..106)
// Each entry represents alternating bar/space widths; Stop (106) has 7 elements (13 modules).
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131',
  '211412', // 103: Start A
  '211214', // 104: Start B
  '211232', // 105: Start C
  '2331112' // 106: Stop
];

export function encodeCode128(text) {
  const clean = String(text || '').trim();
  if (!clean) return [];

  // Use Code128C for even-length pure digit strings (e.g. 14-digit Nova Poshta TTN)
  const isEvenDigits = /^\d+$/.test(clean) && clean.length % 2 === 0;
  const codes = [];

  if (isEvenDigits) {
    codes.push(105); // Start C
    for (let i = 0; i < clean.length; i += 2) {
      codes.push(parseInt(clean.slice(i, i + 2), 10));
    }
  } else {
    codes.push(104); // Start B
    for (let i = 0; i < clean.length; i++) {
      const ch = clean.charCodeAt(i);
      if (ch >= 32 && ch <= 126) {
        codes.push(ch - 32);
      }
    }
  }

  // Checksum = (start + sum(val_i * i)) % 103
  let checksum = codes[0];
  for (let i = 1; i < codes.length; i++) {
    checksum += codes[i] * i;
  }
  codes.push(checksum % 103);
  codes.push(106); // Stop

  return codes;
}

export function buildCode128Svg(text, height = 60) {
  const codes = encodeCode128(text);
  if (!codes.length) return '';

  const quietZone = 10;
  let x = quietZone;
  const rects = [];

  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code];
    if (!pattern) continue;
    for (let i = 0; i < pattern.length; i++) {
      const w = Number(pattern[i]);
      if (i % 2 === 0) {
        // Bar (black)
        rects.push(`<rect x="${x}" y="0" width="${w}" height="${height}" fill="#000" />`);
      }
      x += w;
    }
  }

  const totalWidth = x + quietZone;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" preserveAspectRatio="none" shape-rendering="crispEdges" style="width:100%;height:100%;display:block;background:#fff;">${rects.join('')}</svg>`;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTtnDisplayHtml(ttn) {
  const digits = String(ttn || '').replace(/\D/g, '');
  if (digits.length === 14) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6, 10)} <span class="ttn-tail">${digits.slice(10)}</span>`;
  }
  return escapeHtml(ttn);
}

export function printNpBarcodes58x40(ordersList = []) {
  const items = (Array.isArray(ordersList) ? ordersList : [])
    .map((order) => {
      const details = order?.shipping_details || {};
      const ttn = String(details.ttn || order?.ttn || '').replace(/\s+/g, '').trim();
      if (!ttn) return null;
      const fromDetails = `${details.lastName || details.last_name || ''} ${details.firstName || details.first_name || ''}`.trim();
      const fromCustomer = `${order?.customers?.last_name || ''} ${order?.customers?.first_name || ''}`.trim();
      const clientName = fromDetails || fromCustomer || order?.client_name || '';
      return { ttn, clientName };
    })
    .filter(Boolean);

  if (!items.length) return false;

  const labelsHtml = items
    .map((item) => {
      const svg = buildCode128Svg(item.ttn, 64);
      const ttnHtml = formatTtnDisplayHtml(item.ttn);
      return `
        <div class="label">
          ${item.clientName ? `<div class="recipient">${escapeHtml(item.clientName)}</div>` : ''}
          <div class="barcode-wrap">${svg}</div>
          <div class="ttn-num">${ttnHtml}</div>
        </div>
      `;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8" />
  <title>Штрих-коди НП 58×40 (${items.length})</title>
  <style>
    @page {
      size: 58mm 40mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 58mm;
      background: #fff;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .label {
      width: 58mm;
      height: 40mm;
      padding: 2mm 1.8mm 1.8mm 1.8mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      overflow: hidden;
      page-break-after: always;
      break-after: page;
    }
    .label:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .recipient {
      width: 100%;
      text-align: center;
      font-size: 9pt;
      font-weight: 700;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #000;
    }
    .barcode-wrap {
      width: 100%;
      height: 23mm;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .ttn-num {
      width: 100%;
      text-align: center;
      font-family: 'Courier New', Courier, monospace;
      font-size: 11.5pt;
      font-weight: 700;
      letter-spacing: 0.2px;
      line-height: 1;
      color: #000;
    }
    .ttn-tail {
      font-size: 13pt;
      font-weight: 900;
    }
  </style>
</head>
<body>
  ${labelsHtml}
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 120);
    };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=420,height=340');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}
