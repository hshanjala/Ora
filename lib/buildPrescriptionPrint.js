import { format } from 'date-fns'

// Bangla-safe stack. The print window is a separate document that cannot see
// next/font, so Anek Bangla is linked from Google Fonts and backed by the
// Bangla faces commonly installed in Bangladesh (Nirmala UI on Windows,
// SolaimanLipi/Kalpurush elsewhere) in case the print machine is offline.
const FONT_LINK =
  '<link rel="preconnect" href="https://fonts.googleapis.com">' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
  '<link href="https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@400;500;600;700&display=swap" rel="stylesheet">'

const FONT_STACK =
  `'Anek Bangla','Nirmala UI','SolaimanLipi','Kalpurush','Noto Sans Bengali',` +
  `-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif`

const PAPER = {
  A4: { size: 'A4', margin: '14mm 12mm', base: 13, minBody: '150mm' },
  A5: { size: 'A5', margin: '10mm 9mm', base: 11.5, minBody: '95mm' },
}

/**
 * Prescription print document.
 *
 * Treated as printed collateral rather than a web page: real @page geometry,
 * A4/A5 support, page-break control so a medicine row never splits across
 * pages, repeating headers on multi-page prints, and a Bangla-safe font
 * stack so patient names never fall back to a glyphless face.
 *
 * The three clinic-configurable header layouts are unchanged.
 */
export function buildPrintHtml(template, tpl, prescription, items, options = {}) {
  const paper = PAPER[options.paperSize] || PAPER.A4

  const clinic  = tpl.clinic_name || 'Ora Dental Clinic'
  const doctor  = tpl.doctor_name || ''
  const desig   = tpl.doctor_designation || ''
  const sub     = tpl.doctor_subtext || ''
  const reg     = tpl.doctor_reg_no || ''
  const phone   = tpl.doctor_phone || ''
  const email   = tpl.doctor_email || ''
  const addr    = tpl.clinic_address || ''
  const logo    = tpl.clinic_logo_url || ''
  const d2name  = tpl.doctor2_name || ''
  const d2desig = tpl.doctor2_designation || ''
  const d2sub   = tpl.doctor2_subtext || ''
  const d2email = tpl.doctor2_email || ''
  const d2reg   = tpl.doctor2_reg_no || ''
  const pat     = prescription.patients?.name || '—'
  const age     = prescription.patients?.age || ''
  const gender  = prescription.patients?.gender || ''
  const date    = format(new Date(prescription.date), 'dd/MM/yyyy')

  const baseStyle = `
    @page { size: ${paper.size} portrait; margin: ${paper.margin}; }

    *{box-sizing:border-box;margin:0;padding:0}

    html,body{
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }

    body{
      font-family:${FONT_STACK};
      color:#1e293b;
      font-size:${paper.base}px;
      line-height:1.45;
    }

    /* On screen (the preview window before the print dialog) show the sheet
       on a neutral backdrop at true paper width. */
    @media screen{
      body{background:#f1f2f4;padding:16px}
      .page{
        background:#fff;
        width:${paper.size === 'A5' ? '148mm' : '210mm'};
        min-height:${paper.size === 'A5' ? '210mm' : '297mm'};
        margin:0 auto;
        padding:${paper.margin};
        box-shadow:0 4px 12px rgba(16,24,40,.08);
      }
    }
    @media print{
      .page{width:auto;min-height:0;padding:0;box-shadow:none}
    }

    /* Header repeats on every printed page; signature/footer never splits. */
    .rx-header{break-inside:avoid;break-after:avoid}
    .patient-row{break-inside:avoid;break-after:avoid}
    .med-row{break-inside:avoid;page-break-inside:avoid}
    .sig,.footer-bar,.followup{break-inside:avoid}

    .patient-row{
      display:flex;gap:20px;flex-wrap:wrap;
      background:#f7f8f9;border:1px solid #e7e9ec;
      padding:7px 12px;margin-bottom:16px;
      font-size:${paper.base - 1}px;color:#3c424c;
    }
    .patient-row strong{color:#14171c;font-weight:600}

    .body-cols{display:flex;min-height:${paper.minBody}}
    .left-col{width:${paper.size === 'A5' ? '108px' : '140px'};padding-right:14px;border-right:1px solid #d5d8dd;padding-top:6px}
    .right-col{flex:1;padding-left:18px;padding-top:6px}

    .cl-label{font-size:${paper.base - 3}px;font-weight:700;color:#6d7480;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;margin-top:16px}
    .cl-label:first-child{margin-top:0}
    .cl-value{font-size:${paper.base - 1}px;color:#14171c}

    .rx{font-size:${paper.base + 7}px;font-weight:700;color:#0f6a3e;margin-bottom:10px;font-style:italic}

    .med-row{margin-bottom:9px}
    .med-name{font-weight:600;font-size:${paper.base}px;color:#14171c}
    .med-detail{font-size:${paper.base - 1}px;color:#6d7480;margin-top:1px}

    .adv-box{background:#fef6e7;border-left:3px solid #b45309;padding:8px 12px;margin-top:14px;font-size:${paper.base - 1}px}

    .fl{font-size:${paper.base - 3}px;color:#6d7480;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;font-weight:600}
    .fv{font-size:${paper.base}px;font-weight:600;color:#14171c;margin-bottom:10px}

    .followup{margin-top:22px;border-top:1px solid #e7e9ec;padding-top:12px;display:flex;align-items:center;gap:12px}
    .followup-label{font-size:${paper.base - 3}px;font-weight:700;color:#6d7480;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap}
    .followup-value{font-size:${paper.base + 1}px;font-weight:700;color:#0f6a3e}
    .followup-blank{display:inline-block;width:180px;border-bottom:1px solid #a0a6b0}

    .sig{margin-top:42px;display:flex;justify-content:flex-end}
    .sig-line{border-top:1px solid #14171c;width:180px;text-align:center;padding-top:5px;font-size:${paper.base - 3}px;color:#6d7480}

    .footer-bar{border-top:1px solid #e7e9ec;padding:8px 0 0;display:flex;justify-content:space-between;gap:12px;font-size:${paper.base - 2}px;color:#6d7480;margin-top:26px}

    .hdr{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;border-bottom:2px solid #e7e9ec;padding-bottom:14px;margin-bottom:14px}
    .clinic-name{font-size:${paper.base + 5}px;font-weight:700;color:#0f6a3e}
    .dr-name{font-size:${paper.base + 4}px;font-weight:700;color:#14171c}
    .dr-line{font-size:${paper.base - 1}px;color:#3c424c;margin-top:1px}
    .dr-meta{font-size:${paper.base - 2}px;color:#6d7480}
    .dr-reg{font-size:${paper.base - 2}px;color:#a0a6b0}
    .logo{height:52px;object-fit:contain;object-position:left}
    .logo-lg{width:68px;height:68px;object-fit:contain}
    .logo-ph{width:68px;height:68px;border:1px dashed #d5d8dd;display:flex;align-items:center;justify-content:center;font-size:${paper.base - 3}px;color:#a0a6b0}`

  const followUp = prescription.follow_up_date
    ? format(new Date(prescription.follow_up_date + 'T00:00:00'), 'dd/MM/yyyy')
    : ''

  const patRow = `
    <div class="patient-row">
      <span>Name: <strong>${pat}</strong></span>
      ${age ? `<span>Age: <strong>${age}y</strong></span>` : ''}
      ${gender ? `<span>Gender: <strong>${gender}</strong></span>` : ''}
      <span>Date: <strong>${date}</strong></span>
    </div>`

  const followUpBlock = `
    <div class="followup">
      <span class="followup-label">Next Visit / Follow-up:</span>
      ${followUp
        ? `<span class="followup-value">${followUp}</span>`
        : `<span class="followup-blank">&nbsp;</span>`}
    </div>`

  const medRows = items.map((item, i) => `
    <div class="med-row">
      <div class="med-name">${i + 1}. ${item.medicine}</div>
      <div class="med-detail">${[item.frequency, item.duration, item.instructions].filter(Boolean).join(' , ')}</div>
    </div>`).join('')

  const twoColBody = `
    <div class="body-cols">
      <div class="left-col">
        ${prescription.chief_complaint ? `<div class="cl-label">C/C</div><div class="cl-value">${prescription.chief_complaint}</div>` : ''}
        ${prescription.diagnosis ? `<div class="cl-label">O/E</div><div class="cl-value">${prescription.diagnosis}</div>` : ''}
        ${prescription.advice ? `<div class="cl-label">Adv</div><div class="cl-value">${prescription.advice}</div>` : ''}
      </div>
      <div class="right-col">
        <div class="rx">R<sub>x</sub></div>
        ${medRows}
      </div>
    </div>`

  const singleColBody = `
    <div style="padding-top:4px">
      ${prescription.chief_complaint ? `<div class="fl">C/C — Chief Complaint</div><div class="fv">${prescription.chief_complaint}</div>` : ''}
      ${prescription.diagnosis ? `<div class="fl">O/E — On Examination</div><div class="fv">${prescription.diagnosis}</div>` : ''}
      <div class="rx" style="margin-top:8px">R<sub>x</sub></div>
      ${medRows}
      ${prescription.advice ? `<div class="adv-box"><strong>Adv:</strong> ${prescription.advice}</div>` : ''}
      ${prescription.notes ? `<div style="margin-top:14px"><div class="fl">Doctor's Notes</div><div class="fv">${prescription.notes}</div></div>` : ''}
      ${followUpBlock}
      <div class="sig"><div class="sig-line">Doctor's Signature</div></div>
    </div>`

  function drBlock(name, dg, sb, em, rg, align = 'left') {
    const ta = align === 'right' ? 'text-align:right' : ''
    return `
      <div style="${ta}">
        <div class="dr-name">${name}</div>
        ${dg ? `<div class="dr-line">${dg}</div>` : ''}
        ${sb ? `<div class="dr-meta">${sb}</div>` : ''}
        ${em ? `<div class="dr-meta">${em}</div>` : ''}
        ${rg ? `<div class="dr-reg">Reg No: ${rg}</div>` : ''}
      </div>`
  }

  function doc(body) {
    return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<title>Prescription - ${pat}</title>
${FONT_LINK}
<style>${baseStyle}</style>
</head><body><div class="page">${body}</div></body></html>`
  }

  // Template 1 — logo left, single doctor right
  if (template === 1) {
    const header = `
      <div class="hdr rx-header">
        <div style="display:flex;flex-direction:column;gap:6px">
          ${logo ? `<img class="logo" src="${logo}" alt="${clinic}" />` : `<div class="clinic-name">${clinic}</div>`}
          ${addr ? `<div class="dr-meta">${addr}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div class="dr-name">${doctor}</div>
          ${desig ? `<div class="dr-line">${desig}</div>` : ''}
          ${sub ? `<div class="dr-meta">${sub}</div>` : ''}
          ${phone ? `<div class="dr-meta">${phone}</div>` : ''}
          ${email ? `<div class="dr-meta">${email}</div>` : ''}
          ${reg ? `<div class="dr-reg">Reg No: ${reg}</div>` : ''}
        </div>
      </div>`
    return doc(`${header}${patRow}${twoColBody}${followUpBlock}`)
  }

  // Template 2 — two doctors flanking a centred logo
  if (template === 2) {
    const header = `
      <div class="hdr rx-header">
        ${drBlock(doctor, desig, sub, email, reg, 'left')}
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:0 14px">
          ${logo
            ? `<img class="logo-lg" src="${logo}" alt="${clinic}" />`
            : `<div class="logo-ph">Logo</div>`}
        </div>
        ${drBlock(d2name, d2desig, d2sub, d2email, d2reg, 'right')}
      </div>`
    const footer = `
      <div class="footer-bar">
        <span>${addr}</span>
        <span>${phone}</span>
      </div>`
    return doc(`${header}${patRow}${twoColBody}${followUpBlock}${footer}`)
  }

  // Template 3 — doctor left, clinic right, single-column body
  if (template === 3) {
    const header = `
      <div class="hdr rx-header">
        <div>
          <div class="dr-name">${doctor}</div>
          ${desig ? `<div class="dr-line">${desig}</div>` : ''}
          ${sub ? `<div class="dr-meta">${sub}</div>` : ''}
          ${email ? `<div class="dr-meta">${email}</div>` : ''}
          ${reg ? `<div class="dr-reg">Reg No: ${reg}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div class="clinic-name">${clinic}</div>
          ${addr ? `<div class="dr-meta" style="margin-top:3px">${addr}</div>` : ''}
          ${phone ? `<div class="dr-meta">${phone}</div>` : ''}
        </div>
      </div>`
    return doc(`${header}${patRow}${singleColBody}`)
  }

  return ''
}

/**
 * Open the print window. Waits for webfonts to settle so Bangla names are not
 * captured mid-swap, then triggers the print dialog.
 */
export function printPrescription(template, tpl, prescription, items, options) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(buildPrintHtml(template, tpl, prescription, items, options))
  win.document.close()
  let printed = false
  const go = () => {
    if (printed) return
    printed = true
    try { win.focus(); win.print() } catch {}
  }
  if (win.document.fonts?.ready) {
    win.document.fonts.ready.then(() => setTimeout(go, 150))
    setTimeout(go, 1500) // fallback if fonts never resolve (offline machine)
  } else {
    setTimeout(go, 500)
  }
}
