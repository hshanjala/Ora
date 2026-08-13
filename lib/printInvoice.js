import { format } from 'date-fns'

// Bangla-safe stack — matches the prescription document. The print window is
// a separate document that cannot see next/font, so Anek Bangla is linked and
// backed by faces commonly installed in Bangladesh for offline machines.
const FONT_LINK =
  '<link rel="preconnect" href="https://fonts.googleapis.com">' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;500;600;700&display=swap" rel="stylesheet">'

const FONT_STACK =
  `'Anek Bangla','Nirmala UI','SolaimanLipi','Kalpurush','Noto Sans Bengali',` +
  `-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif`

const PAPER = {
  A4: { size: 'A4', margin: '14mm 12mm', base: 13, w: '210mm', h: '297mm' },
  A5: { size: 'A5', margin: '10mm 9mm', base: 11.5, w: '148mm', h: '210mm' },
}

const money = (n) => `&#2547;${Number(n || 0).toLocaleString()}`

/**
 * The invoice print document — one template for the whole product.
 *
 * Replaces three hand-built copies that previously lived in
 * invoices/page.jsx, PatientPanel.jsx and QuickAddFlow.jsx.
 *
 * @param invoice   invoice row (may carry `patients`)
 * @param items     invoice_items rows
 * @param clinicName clinic letterhead name
 * @param payments  invoice_payments rows; when present (or when a prior
 *                  balance exists) the payment ledger is printed
 * @param options   { paperSize: 'A4' | 'A5' }
 */
export function buildInvoiceHtml(invoice, items = [], clinicName, payments = [], options = {}) {
  const paper = PAPER[options.paperSize] || PAPER.A4

  const total = Number(invoice.total || 0)
  const paid = Number(invoice.paid_amount || 0)
  const remaining = Math.max(0, total - paid)
  const discountVal = Number(invoice.discount || 0)
  const subtotalVal = items.reduce((s, i) => s + Number(i.total || 0), 0)

  // Ledger: any amount paid before the itemised payments were recorded shows
  // as an opening row, matching the on-screen ledger exactly.
  const ledgerTotal = payments.reduce((s, p) => s + Number(p.amount), 0)
  const priorAmount = Math.round((paid - ledgerTotal) * 100) / 100
  const showLedger = paid > 0 && (payments.length > 0 || priorAmount > 0)

  let ledgerRows = ''
  if (showLedger) {
    let cumulative = 0
    const rows = []
    if (priorAmount > 0) {
      cumulative += priorAmount
      const bal = Math.max(0, total - cumulative)
      rows.push(`<tr>
        <td>${format(new Date(invoice.date + 'T00:00:00'), 'dd.MM.yy')}</td>
        <td class="tc">${money(priorAmount)}</td>
        <td class="tr ${bal > 0 ? 'due' : 'ok'}">${money(bal)}</td>
      </tr>`)
    }
    payments.forEach(p => {
      cumulative += Number(p.amount)
      const bal = Math.max(0, total - cumulative)
      rows.push(`<tr>
        <td>${format(new Date(p.date + 'T00:00:00'), 'dd.MM.yy')}</td>
        <td class="tc">${money(p.amount)}</td>
        <td class="tr ${bal > 0 ? 'due' : 'ok'}">${money(bal)}</td>
      </tr>`)
    })
    ledgerRows = rows.join('')
  }

  const style = `
    @page { size: ${paper.size} portrait; margin: ${paper.margin}; }

    *{box-sizing:border-box;margin:0;padding:0}
    html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact}

    body{
      font-family:${FONT_STACK};
      color:#14171c;
      font-size:${paper.base}px;
      line-height:1.45;
    }

    @media screen{
      body{background:#f1f2f4;padding:16px}
      .page{background:#fff;width:${paper.w};min-height:${paper.h};margin:0 auto;
        padding:${paper.margin};box-shadow:0 4px 12px rgba(16,24,40,.08)}
    }
    @media print{ .page{width:auto;min-height:0;padding:0;box-shadow:none} }

    /* Page-break control: rows stay whole, headers repeat, totals never split */
    thead{display:table-header-group}
    tr{break-inside:avoid;page-break-inside:avoid}
    .totals,.bill-box,.hdr,.status,.footer{break-inside:avoid}

    .hdr{display:flex;justify-content:space-between;gap:16px;
      margin-bottom:22px;padding-bottom:14px;border-bottom:2px solid #e7e9ec}
    .clinic{font-size:${paper.base + 8}px;font-weight:700;color:#0f6a3e}
    .sub{color:#6d7480;font-size:${paper.base - 1}px;margin-top:3px}
    .inv-num{font-size:${paper.base + 5}px;font-weight:700;text-align:right}
    .inv-date{color:#6d7480;font-size:${paper.base - 2}px;margin-top:3px;text-align:right}

    .bill-box{background:#f7f8f9;border:1px solid #e7e9ec;border-radius:8px;
      padding:12px 16px;margin-bottom:20px}
    .bill-label{font-size:${paper.base - 3}px;color:#6d7480;text-transform:uppercase;
      letter-spacing:.06em;margin-bottom:3px}
    .bill-name{font-size:${paper.base + 2}px;font-weight:600}

    table{width:100%;border-collapse:collapse;margin-bottom:18px}
    thead th{background:#f7f8f9;padding:8px 10px;text-align:left;
      font-size:${paper.base - 2}px;color:#3c424c;font-weight:600;
      border-bottom:1px solid #e7e9ec}
    td{padding:8px 10px;border-bottom:1px solid #e7e9ec;font-size:${paper.base - 1}px}
    .tr{text-align:right}
    .tc{text-align:center}
    .due{color:#c62828;font-weight:600}
    .ok{color:#16874f;font-weight:600}

    .totals{margin-left:auto;width:${paper.size === 'A5' ? '210px' : '260px'};margin-bottom:20px}
    .trow{display:flex;justify-content:space-between;padding:6px 0;font-size:${paper.base - 1}px}
    .trow.grand{border-top:2px solid #e7e9ec;padding-top:10px;margin-top:3px;
      font-weight:700;font-size:${paper.base + 3}px}
    .trow.paid-r{color:#16874f;font-weight:600}
    .trow.due-r{color:#c62828;font-weight:700;font-size:${paper.base + 1}px}
    .trow.disc{color:#b45309}

    .status{display:inline-block;padding:3px 10px;border-radius:99px;
      font-size:${paper.base - 2}px;font-weight:600;margin-bottom:20px}
    .s-paid{background:#edf8f2;color:#16874f}
    .s-partial{background:#fef6e7;color:#b45309}
    .s-unpaid{background:#fdecec;color:#c62828}

    .notes{background:#f7f8f9;border-radius:8px;padding:10px 14px;
      margin-bottom:22px;font-size:${paper.base - 1}px;color:#3c424c}

    .ledger-title{font-size:${paper.base + 3}px;font-weight:600;
      margin:22px 0 12px;text-align:center}

    .footer{text-align:center;color:#a0a6b0;font-size:${paper.base - 2}px;
      border-top:1px solid #e7e9ec;padding-top:14px;margin-top:22px}`

  const statusClass = invoice.status === 'paid'
    ? 's-paid'
    : invoice.status === 'partial' ? 's-partial' : 's-unpaid'

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<title>Invoice ${invoice.invoice_number}</title>
${FONT_LINK}
<style>${style}</style>
</head><body><div class="page">

<div class="hdr">
  <div>
    <div class="clinic">${clinicName || 'Ora Dental Clinic'}</div>
    <div class="sub">Dental Clinic</div>
  </div>
  <div>
    <div class="inv-num">${invoice.invoice_number}</div>
    <div class="inv-date">${format(new Date(invoice.date), 'MMMM d, yyyy')}</div>
  </div>
</div>

<div class="bill-box">
  <div class="bill-label">Bill To</div>
  <div class="bill-name">${invoice.patients?.name || 'Patient'}</div>
</div>

<table>
  <thead>
    <tr>
      <th>Description</th>
      <th class="tr">Qty</th>
      <th class="tr">Unit Price</th>
      <th class="tr">Total</th>
    </tr>
  </thead>
  <tbody>
    ${items.map(item => `<tr>
      <td>${item.description}</td>
      <td class="tr">${item.quantity}</td>
      <td class="tr">${money(item.unit_price)}</td>
      <td class="tr">${money(item.total)}</td>
    </tr>`).join('')}
  </tbody>
</table>

<div class="totals">
  ${discountVal > 0 ? `
    <div class="trow"><span>Subtotal</span><span>${money(subtotalVal)}</span></div>
    <div class="trow disc"><span>Discount</span><span>&#8722;${money(discountVal)}</span></div>` : ''}
  <div class="trow grand"><span>Total</span><span>${money(total)}</span></div>
  <div class="trow paid-r"><span>Paid</span><span>${money(paid)}</span></div>
  ${remaining > 0 ? `<div class="trow due-r"><span>Due</span><span>${money(remaining)}</span></div>` : ''}
</div>

<span class="status ${statusClass}">${(invoice.status || '').toUpperCase()}</span>

${invoice.notes ? `<div class="notes"><strong>Notes:</strong> ${invoice.notes}</div>` : ''}

${showLedger ? `
  <div class="ledger-title">Payment Details</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th class="tc">Paid Amount</th>
        <th class="tr">Due Amount</th>
      </tr>
    </thead>
    <tbody>${ledgerRows}</tbody>
  </table>` : ''}

<div class="footer">Thank you for choosing ${clinicName || 'Ora Dental Clinic'} &middot; Powered by Ora</div>

</div></body></html>`
}

/** Open the print window, waiting for webfonts so Bangla names render. */
export function printInvoice(invoice, items = [], clinicName, payments = [], options) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(buildInvoiceHtml(invoice, items, clinicName, payments, options))
  win.document.close()
  let printed = false
  const go = () => {
    if (printed) return
    printed = true
    try { win.focus(); win.print() } catch {}
  }
  if (win.document.fonts?.ready) {
    win.document.fonts.ready.then(() => setTimeout(go, 150))
    setTimeout(go, 1500)
  } else {
    setTimeout(go, 500)
  }
}
