import { format } from 'date-fns'

export function buildPrintHtml(template, tpl, prescription, items) {
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
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;font-size:13px}
    .page{padding:32px 40px;min-height:100vh;position:relative}
    .patient-row{display:flex;gap:24px;background:#f8fafc;border:1px solid #e2e8f0;padding:8px 14px;margin-bottom:20px;font-size:12px;color:#475569}
    .patient-row strong{color:#1e293b}
    .body-cols{display:flex;min-height:420px}
    .left-col{width:140px;padding-right:16px;border-right:1px solid #cbd5e1;padding-top:8px}
    .right-col{flex:1;padding-left:20px;padding-top:8px}
    .cl-label{font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;margin-top:16px}
    .cl-label:first-child{margin-top:0}
    .cl-value{font-size:12px;color:#1e293b}
    .rx{font-size:20px;font-weight:800;color:#065f46;margin-bottom:10px;font-style:italic}
    .med-row{margin-bottom:10px}
    .med-name{font-weight:700;font-size:13px;color:#1e293b}
    .med-detail{font-size:12px;color:#64748b;margin-top:1px}
    .adv-box{background:#fefce8;border-left:3px solid #eab308;padding:8px 12px;margin-top:14px;font-size:12px}
    .fl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;font-weight:600}
    .fv{font-size:13px;font-weight:600;color:#1e293b;margin-bottom:10px}
    .sig{margin-top:48px;display:flex;justify-content:flex-end}
    .sig-line{border-top:1px solid #1e293b;width:180px;text-align:center;padding-top:5px;font-size:10px;color:#94a3b8}
    .footer-bar{border-top:1px solid #e2e8f0;padding:8px 14px;display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-top:32px}`

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

  const followUpBlock = followUp ? `
    <div style="margin-top:24px;border-top:1px dashed #e2e8f0;padding-top:14px;display:flex;align-items:center;gap:10px">
      <span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em">Next Visit / Follow-up</span>
      <span style="font-size:14px;font-weight:800;color:#059669">${followUp}</span>
    </div>` : ''

  const twoColBody = `
    <div class="body-cols">
      <div class="left-col">
        ${prescription.chief_complaint ? `<div class="cl-label">C/C</div><div class="cl-value">${prescription.chief_complaint}</div>` : ''}
        ${prescription.diagnosis ? `<div class="cl-label" style="margin-top:20px">O/E</div><div class="cl-value">${prescription.diagnosis}</div>` : ''}
        ${prescription.advice ? `<div class="cl-label" style="margin-top:20px">Adv</div><div class="cl-value">${prescription.advice}</div>` : ''}
      </div>
      <div class="right-col">
        <div class="rx">R<sub>x</sub></div>
        ${items.map((item, i) => `
          <div class="med-row">
            <div class="med-name">${i + 1}. ${item.medicine}</div>
            <div class="med-detail">${[item.frequency, item.duration, item.instructions].filter(Boolean).join(' , ')}</div>
          </div>`).join('')}
      </div>
    </div>`

  const singleColBody = `
    <div style="padding-top:4px">
      ${prescription.chief_complaint ? `<div class="fl">C/C — Chief Complaint</div><div class="fv">${prescription.chief_complaint}</div>` : ''}
      ${prescription.diagnosis ? `<div class="fl">O/E — On Examination</div><div class="fv">${prescription.diagnosis}</div>` : ''}
      <div class="rx" style="margin-top:8px">R<sub>x</sub></div>
      ${items.map((item, i) => `
        <div class="med-row">
          <div class="med-name">${i + 1}. ${item.medicine}</div>
          <div class="med-detail">${[item.frequency, item.duration, item.instructions].filter(Boolean).join(' , ')}</div>
        </div>`).join('')}
      ${prescription.advice ? `<div class="adv-box"><strong>Adv:</strong> ${prescription.advice}</div>` : ''}
      ${prescription.notes ? `<div style="margin-top:14px"><div class="fl">Doctor's Notes</div><div class="fv">${prescription.notes}</div></div>` : ''}
      ${followUp ? `<div style="margin-top:20px;border-top:1px dashed #e2e8f0;padding-top:12px;display:flex;align-items:center;gap:10px"><span style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em">Next Visit / Follow-up</span><span style="font-size:14px;font-weight:800;color:#059669">${followUp}</span></div>` : ''}
      <div class="sig"><div class="sig-line">Doctor's Signature</div></div>
    </div>`

  function drBlock(name, dg, sb, em, rg, align = 'left') {
    const ta = align === 'right' ? 'text-align:right' : ''
    return `
      <div style="${ta}">
        <div style="font-size:16px;font-weight:800;color:#1e293b">${name}</div>
        ${dg ? `<div style="font-size:12px;color:#475569;margin-top:1px">${dg}</div>` : ''}
        ${sb ? `<div style="font-size:11px;color:#64748b;margin-top:1px">${sb}</div>` : ''}
        ${em ? `<div style="font-size:11px;color:#64748b">${em}</div>` : ''}
        ${rg ? `<div style="font-size:11px;color:#94a3b8">Reg No: ${rg}</div>` : ''}
      </div>`
  }

  let header = ''

  if (template === 1) {
    header = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:16px">
        <div style="display:flex;flex-direction:column;gap:6px">
          ${logo ? `<img src="${logo}" style="height:56px;object-fit:contain;object-position:left" />` : `<div style="font-size:18px;font-weight:800;color:#065f46">${clinic}</div>`}
          ${addr ? `<div style="font-size:11px;color:#64748b">${addr}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div style="font-size:17px;font-weight:800;color:#1e293b">${doctor}</div>
          ${desig ? `<div style="font-size:12px;color:#475569;margin-top:1px">${desig}</div>` : ''}
          ${sub ? `<div style="font-size:11px;color:#64748b;margin-top:1px">${sub}</div>` : ''}
          ${phone ? `<div style="font-size:11px;color:#64748b">${phone}</div>` : ''}
          ${email ? `<div style="font-size:11px;color:#64748b">${email}</div>` : ''}
          ${reg ? `<div style="font-size:11px;color:#94a3b8">Reg No: ${reg}</div>` : ''}
        </div>
      </div>`
    return `<!DOCTYPE html><html><head><title>Prescription - ${pat}</title>
<style>${baseStyle}</style></head><body><div class="page">
${header}${patRow}${twoColBody}${followUpBlock}
</div></body></html>`
  }

  if (template === 2) {
    header = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:16px">
        ${drBlock(doctor, desig, sub, email, reg, 'left')}
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:0 16px">
          ${logo ? `<img src="${logo}" style="width:72px;height:72px;object-fit:contain" />` : `<div style="width:72px;height:72px;border:1px dashed #cbd5e1;display:flex;align-items:center;justify-content:center;font-size:10px;color:#94a3b8">Logo</div>`}
        </div>
        ${drBlock(d2name, d2desig, d2sub, d2email, d2reg, 'right')}
      </div>`
    const footer = `
      <div class="footer-bar">
        <span>${addr}</span>
        <span>${phone}</span>
      </div>`
    return `<!DOCTYPE html><html><head><title>Prescription - ${pat}</title>
<style>${baseStyle}</style></head><body><div class="page">
${header}${patRow}${twoColBody}${followUpBlock}${footer}
</div></body></html>`
  }

  if (template === 3) {
    header = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #e2e8f0;padding-bottom:16px;margin-bottom:16px">
        <div>
          <div style="font-size:17px;font-weight:800;color:#1e293b">${doctor}</div>
          ${desig ? `<div style="font-size:12px;color:#475569;margin-top:1px">${desig}</div>` : ''}
          ${sub ? `<div style="font-size:11px;color:#64748b;margin-top:1px">${sub}</div>` : ''}
          ${email ? `<div style="font-size:11px;color:#64748b">${email}</div>` : ''}
          ${reg ? `<div style="font-size:11px;color:#94a3b8">Reg No: ${reg}</div>` : ''}
        </div>
        <div style="text-align:right">
          <div style="font-size:20px;font-weight:800;color:#065f46">${clinic}</div>
          ${addr ? `<div style="font-size:11px;color:#64748b;margin-top:3px">${addr}</div>` : ''}
          ${phone ? `<div style="font-size:11px;color:#64748b">${phone}</div>` : ''}
        </div>
      </div>`
    return `<!DOCTYPE html><html><head><title>Prescription - ${pat}</title>
<style>${baseStyle}</style></head><body><div class="page">
${header}${patRow}${singleColBody}
</div></body></html>`
  }

  return ''
}
