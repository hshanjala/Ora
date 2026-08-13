import { format } from 'date-fns'

/**
 * Invoice print template used by the patient drawer.
 *
 * NOTE: app/(dashboard)/invoices/page.jsx still carries its own richer copy
 * (with the payment ledger). Both are replaced by one real print stylesheet
 * — A4/A5, clinic letterhead, Bangla-safe fonts, page-break control — in the
 * invoices migration phase. Output here is intentionally unchanged from the
 * version that previously lived inside components/PatientPanel.jsx.
 */
export function printInvoice(invoice, items = [], clinicName) {
  const remaining = Math.max(0, (invoice.total || 0) - (invoice.paid_amount || 0))
  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${invoice.invoice_number}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#1e293b;font-size:14px}
.hdr{display:flex;justify-content:space-between;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #e2e8f0}
.clinic{font-size:24px;font-weight:800;color:#065f46}
.sub{color:#64748b;font-size:13px;margin-top:4px}
.inv-num{font-size:20px;font-weight:700;text-align:right}
.inv-date{color:#64748b;font-size:12px;margin-top:4px;text-align:right}
.bill-box{background:#f8fafc;border-radius:10px;padding:14px 18px;margin-bottom:24px}
.bill-label{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.bill-name{font-size:16px;font-weight:700}
table{width:100%;border-collapse:collapse;margin-bottom:20px}
thead{background:#f0fdf4}
th{padding:10px 12px;text-align:left;font-size:12px;color:#065f46;font-weight:600}
.tr{text-align:right}
td{padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px}
.totals{margin-left:auto;width:260px;margin-bottom:24px}
.trow{display:flex;justify-content:space-between;padding:8px 0;font-size:13px}
.trow.grand{border-top:2px solid #e2e8f0;padding-top:12px;margin-top:4px;font-weight:800;font-size:16px}
.trow.paid-r{color:#065f46;font-weight:600}
.trow.due-r{color:#b91c1c;font-weight:700;font-size:15px}
.sbadge{display:inline-block;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;margin-bottom:24px}
.spaid{background:#d1fae5;color:#065f46}
.spartial{background:#fef3c7;color:#854d0e}
.sunpaid{background:#fee2e2;color:#991b1b}
.footer{text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:16px}
</style></head><body>
<div class="hdr">
  <div><div class="clinic">${clinicName || 'Ora Dental Clinic'}</div><div class="sub">Dental Clinic</div></div>
  <div><div class="inv-num">${invoice.invoice_number}</div><div class="inv-date">${format(new Date(invoice.date), 'MMMM d, yyyy')}</div></div>
</div>
<div class="bill-box"><div class="bill-label">Bill To</div><div class="bill-name">${invoice.patients?.name || 'Patient'}</div></div>
<table>
  <thead><tr><th>Description</th><th class="tr">Qty</th><th class="tr">Unit Price</th><th class="tr">Total</th></tr></thead>
  <tbody>${items.map(item => `<tr><td>${item.description}</td><td class="tr">${item.quantity}</td><td class="tr">&#2547;${Number(item.unit_price).toLocaleString()}</td><td class="tr">&#2547;${Number(item.total).toLocaleString()}</td></tr>`).join('')}</tbody>
</table>
<div class="totals">
  <div class="trow grand"><span>Total</span><span>&#2547;${Number(invoice.total).toLocaleString()}</span></div>
  <div class="trow paid-r"><span>Paid</span><span>&#2547;${Number(invoice.paid_amount || 0).toLocaleString()}</span></div>
  ${remaining > 0 ? `<div class="trow due-r"><span>Due</span><span>&#2547;${remaining.toLocaleString()}</span></div>` : ''}
</div>
<span class="sbadge ${invoice.status === 'paid' ? 'spaid' : invoice.status === 'partial' ? 'spartial' : 'sunpaid'}">${(invoice.status || '').toUpperCase()}</span>
<div class="footer">Thank you for choosing ${clinicName || 'Ora Dental Clinic'} &middot; Powered by Ora</div>
</body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 400)
}
