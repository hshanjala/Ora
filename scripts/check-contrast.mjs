// WCAG AA contrast audit for every text/background pair the system produces.
const hex = h => { h=h.replace('#',''); if(h.length===3) h=h.split('').map(c=>c+c).join(''); return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)) }
const lum = rgb => { const c=rgb.map(v=>{v/=255; return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)}); return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2] }
const ratio = (a,b) => { const [l1,l2]=[lum(hex(a)),lum(hex(b))].sort((x,y)=>y-x); return (l1+0.05)/(l2+0.05) }

const T = {
  'gray-0':'#FFFFFF','gray-25':'#FCFCFD','gray-50':'#F7F8F9','gray-100':'#F1F2F4',
  'gray-200':'#E7E9EC','gray-300':'#D5D8DD','gray-400':'#666D78','gray-500':'#464D58','gray-placeholder':'#8A909B',
  'gray-700':'#2C323B','gray-900':'#14171C',
  'green-500':'#1FA363','green-600':'#16874F','green-650':'#0F7A46','green-700':'#0F6A3E','green-50':'#EDF8F2',
  'red-600':'#C62828','red-50':'#FDECEC','amber-700':'#B45309','amber-50':'#FEF6E7',
  'blue-600':'#1D4ED8','blue-50':'#EEF3FE',
}

const pairs = [
  // [label, fg, bg, minimum, note]
  ['text-primary on canvas','gray-900','gray-50',4.5,'body text'],
  ['text-primary on surface','gray-900','gray-0',4.5,'body text'],
  ['text-primary on surface-hover','gray-900','gray-100',4.5,'hovered row'],
  ['text-secondary on canvas','gray-500','gray-50',4.5,'labels'],
  ['text-secondary on surface','gray-500','gray-0',4.5,'labels'],
  ['text-secondary on surface-subtle','gray-500','gray-25',4.5,'table header'],
  ['text-secondary on surface-hover','gray-500','gray-100',4.5,'hovered row label'],
  ['text-primary on surface-subtle','gray-900','gray-25',4.5,'table header value'],
  ['text-tertiary on surface','gray-400','gray-0',4.5,'meta text — real content'],
  ['text-tertiary on canvas','gray-400','gray-50',4.5,'meta text — real content'],
  ['text-tertiary on surface-hover','gray-400','gray-100',4.5,'meta in hovered row'],
  ['placeholder on surface','gray-placeholder','gray-0',3.0,'WCAG-exempt: incidental/disabled'],
  ['text-inverse on accent','gray-0','green-600',4.5,'primary button'],
  ['text-inverse on accent-hover','gray-0','green-700',4.5,'primary button hover'],
  ['accent-text on surface','green-700','gray-0',4.5,'links'],
  ['accent-text on accent-subtle','green-700','green-50',4.5,'accent chip'],
  ['success on success-subtle','green-650','green-50',4.5,'paid pill'],
  ['warning on warning-subtle','amber-700','amber-50',4.5,'partial pill'],
  ['danger on danger-subtle','red-600','red-50',4.5,'unpaid pill'],
  ['info on info-subtle','blue-600','blue-50',4.5,'scheduled pill'],
  ['text-inverse on danger','gray-0','red-600',4.5,'danger button'],
  ['border-subtle vs surface','gray-200','gray-0',1.0,'hairline (non-text)'],
  ['focus-ring vs surface','green-500','gray-0',3.0,'focus indicator (UI component)'],
  ['focus-ring vs canvas','green-500','gray-50',3.0,'focus indicator (UI component)'],
]

let fails = 0
console.log('WCAG contrast audit\n' + '='.repeat(78))
for (const [label, fg, bg, min, note] of pairs) {
  const r = ratio(T[fg], T[bg])
  const ok = r >= min
  if (!ok) fails++
  const level = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA-large/UI' : 'fail'
  console.log(`${ok?'PASS':'FAIL'}  ${r.toFixed(2).padStart(5)}:1  min ${min}  ${level.padEnd(12)} ${label}`)
  console.log(`                                    ${note}`)
}
console.log('='.repeat(78))
console.log(fails === 0 ? `All ${pairs.length} pairs pass.` : `${fails} FAILING pair(s).`)
process.exit(fails ? 1 : 0)
