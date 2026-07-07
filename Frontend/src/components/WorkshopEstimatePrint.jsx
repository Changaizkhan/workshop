const LOGO_URL = '/horse-power-logo.png';

const WORKSHOP = {
  name: 'HORSE POWER',
  tagline: 'HPG 4.0 Workshop',
  address: '',
  city: 'Lahore',
  phone: '+92-320-0006011',
  email: 'info@horsepower.com',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDocDate(value) {
  const d = new Date(value || Date.now());
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}-${MONTHS[d.getMonth()]}-${String(d.getFullYear()).slice(-2)}`;
}

function formatDocTime(value) {
  const d = new Date(value || Date.now());
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
}

function fmtPkr(n) {
  return Number(n || 0).toLocaleString('en-PK');
}

function isExternalPart(p) {
  return p?.isExternal || String(p?.productId || '').startsWith('ext-');
}

function splitLineItems(productsUsed = [], customCharges = []) {
  const parts = [];
  const lubricants = [];

  for (const p of productsUsed) {
    if (isExternalPart(p)) lubricants.push({ kind: 'part', ...p });
    else parts.push(p);
  }

  for (const c of customCharges) {
    lubricants.push({
      kind: 'charge',
      productName: c.chargeName,
      quantity: 1,
      unitPrice: Number(c.chargeCost || 0),
      total: Number(c.chargeCost || 0),
    });
  }

  return { parts, lubricants };
}

function calcTotals(productsUsed, labourCharges, customCharges, calculations = {}) {
  const { parts, lubricants } = splitLineItems(productsUsed, customCharges);
  const partsTotal = parts.reduce((s, p) => s + Number(p.total || 0), 0);
  const oilLubTotal = lubricants.reduce((s, p) => s + Number(p.total || 0), 0);
  const labourTotal = (labourCharges || []).reduce((s, l) => s + Number(l.labourCost || 0), 0);
  const tax = Number(calculations.tax || 0);
  const discount = Number(calculations.discount || 0);
  const subtotal = partsTotal + oilLubTotal + labourTotal;
  const grandTotal = calculations.grandTotal ?? Math.max(0, subtotal + tax - discount);
  return { parts, lubricants, partsTotal, oilLubTotal, labourTotal, tax, discount, grandTotal };
}

function Field({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="estimate-field-label">{label}</p>
      <p className="estimate-field-value">{value || '—'}</p>
    </div>
  );
}

function SectionTable({ title, children }) {
  return (
    <div className="estimate-section">
      <div className="estimate-section-title">{title}</div>
      {children}
    </div>
  );
}

export default function WorkshopEstimatePrint({
  mode = 'estimate',
  docNumber,
  dateCreated,
  customerName,
  contactNo = '',
  address = '',
  customerCnic = '',
  customerEmail = '',
  vehicleMake = '',
  vehicleModel = '',
  vehicleNumber = '',
  chassisNumber = '',
  engineNumber = '',
  colour = '',
  vehicleMileage = '',
  workRequired = '',
  productsUsed = [],
  labourCharges = [],
  customCharges = [],
  calculations = {},
  jobNumber = '',
  workStatus = '',
  paymentStatus = '',
  amountPaid = 0,
  amountPending = 0,
  onClose,
  backLabel = 'Back',
}) {
  const isInvoice = mode === 'invoice';
  const docLabel = isInvoice ? 'INVOICE NO.' : 'ESTIMATE NO.';
  const title = isInvoice ? 'JOB INVOICE' : 'SUMMARY ESTIMATE';
  const totals = calcTotals(productsUsed, labourCharges, customCharges, calculations);
  const showPayment =
    isInvoice &&
    workStatus === 'DELIVERED' &&
    (paymentStatus === 'PAID' || paymentStatus === 'PARTIAL' || Number(amountPaid) > 0);
  const paidAmount = Number(amountPaid || 0);
  const pendingAmount = showPayment
    ? Number(amountPending ?? Math.max(0, totals.grandTotal - paidAmount))
    : 0;
  const isFullyPaid = showPayment && (paymentStatus === 'PAID' || pendingAmount <= 0);
  const makeModel = [vehicleMake, vehicleModel].filter(Boolean).join(' ') || '—';
  const vinLine = [chassisNumber, engineNumber ? `ENG: ${engineNumber}` : ''].filter(Boolean).join(' / ') || '—';

  const handlePrint = () => window.print();

  return (
    <div id="print-area" className="estimate-doc estimate-doc--horsepower max-w-[210mm] mx-auto shadow-xl font-sans text-[11px] leading-snug">
      <div className="estimate-watermark" aria-hidden="true">
        <img src={LOGO_URL} alt="" />
      </div>

      <div className="no-print flex justify-end gap-3 p-4 hp-print-toolbar">
        <button type="button" onClick={handlePrint} className="hp-print-btn">
          🖨️ Print {isInvoice ? 'Invoice' : 'Estimate'}
        </button>
        {onClose && (
          <button type="button" onClick={onClose} className="hp-print-btn hp-print-btn--muted">
            {backLabel}
          </button>
        )}
      </div>

      <div className="estimate-doc-content p-6 sm:p-8 space-y-4">
        {/* Header */}
        <div className="estimate-header-grid">
          <div className="estimate-header-brand">
            <div className="flex items-center gap-3 mb-2">
              <img src={LOGO_URL} alt="Horse Power" className="estimate-logo" />
              <div>
                <p className="estimate-brand-name">
                  <span className="estimate-brand-horse">HORSE</span>{' '}
                  <span className="estimate-brand-power">POWER</span>
                </p>
                <p className="estimate-brand-tagline">{WORKSHOP.tagline}</p>
              </div>
            </div>
            <p className="text-[10px] text-[var(--hp-silver-dark)]">{WORKSHOP.address}</p>
            <p className="text-[10px] text-[var(--hp-silver-dark)]">{WORKSHOP.city}</p>
            <p className="text-[10px] mt-1 text-[var(--hp-silver-dark)]">
              Tel: {WORKSHOP.phone} | {WORKSHOP.email}
            </p>
            <p className="text-[10px] text-[var(--hp-red)] font-bold">{WORKSHOP.ntn}</p>
          </div>
          <div className="estimate-header-meta">
            <p><span className="font-black text-[var(--hp-red)]">{docLabel}</span> {docNumber}</p>
            <p><span className="font-black">DATE:</span> {formatDocDate(dateCreated)}</p>
            {jobNumber && <p><span className="font-black">JOB CARD NO.</span> {jobNumber}</p>}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[var(--hp-silver)] mt-2">
              <p><span className="font-black text-[var(--hp-red)]">DATE IN</span><br />{formatDocDate(dateCreated)}</p>
              <p><span className="font-black text-[var(--hp-red)]">TIME IN</span><br />{formatDocTime(dateCreated)}</p>
            </div>
          </div>
        </div>

        {/* Customer */}
        <div className="estimate-panel">
          <div className="estimate-panel-title">Customer&apos;s Detail</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3">
            <Field label="Customer Name" value={customerName} />
            <Field label="Contact No." value={contactNo} />
            <Field label="Address" value={address} className="sm:col-span-2" />
            <Field label="Make / Model" value={makeModel} />
            <Field label="Registration No." value={vehicleNumber} />
            <Field label="VIN / Chassis No." value={vinLine} />
            <Field label="Mileage (KM)" value={vehicleMileage ? `${vehicleMileage} KM` : '—'} />
            {colour && <Field label="Colour" value={colour} />}
            <Field label="Customer CNIC / NTN" value={customerCnic} />
            <Field label="E-Mail" value={customerEmail} />
          </div>
        </div>

        <SectionTable title="Part Details">
          <table className="estimate-table w-full">
            <thead>
              <tr>
                <th className="w-10">S. No.</th>
                <th>Part Name</th>
                <th className="w-12 text-center">Qty</th>
                <th className="w-24 text-right">Unit Price</th>
                <th className="w-28 text-right">Amount PKR</th>
              </tr>
            </thead>
            <tbody>
              {totals.parts.length === 0 && (
                <tr><td colSpan={5} className="text-center text-[var(--hp-silver-dark)] italic py-2">—</td></tr>
              )}
              {totals.parts.map((it, i) => (
                <tr key={`p-${i}`}>
                  <td className="text-center">{i + 1}</td>
                  <td>{it.productName}</td>
                  <td className="text-center">{it.quantity}</td>
                  <td className="text-right">{fmtPkr(it.unitPrice)}</td>
                  <td className="text-right font-bold">{fmtPkr(it.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="text-right font-black uppercase text-[10px]">Total Parts Value (in PKR)</td>
                <td className="text-right font-black text-[var(--hp-red)]">{fmtPkr(totals.partsTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </SectionTable>

        <SectionTable title="Service Details">
          <table className="estimate-table w-full">
            <thead>
              <tr>
                <th className="w-10">S. No.</th>
                <th>Description of Labor Operation</th>
                <th className="w-28 text-right">Amount PKR</th>
              </tr>
            </thead>
            <tbody>
              {(labourCharges || []).length === 0 && (
                <tr><td colSpan={3} className="text-center text-[var(--hp-silver-dark)] italic py-2">—</td></tr>
              )}
              {(labourCharges || []).map((lb, i) => (
                <tr key={`l-${i}`}>
                  <td className="text-center">{i + 1}</td>
                  <td className="whitespace-pre-wrap">{lb.labourName}</td>
                  <td className="text-right font-bold">{fmtPkr(lb.labourCost)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2} className="text-right font-black uppercase text-[10px]">Total Labor Value (in PKR)</td>
                <td className="text-right font-black text-[var(--hp-red)]">{fmtPkr(totals.labourTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </SectionTable>

        <SectionTable title="Lubricants / Local Parts / Other Expenses">
          <table className="estimate-table w-full">
            <thead>
              <tr>
                <th className="w-10">S. No.</th>
                <th>Part Name</th>
                <th className="w-12 text-center">Qty</th>
                <th className="w-24 text-right">Unit Price</th>
                <th className="w-28 text-right">Amount PKR</th>
              </tr>
            </thead>
            <tbody>
              {totals.lubricants.length === 0 && (
                <tr><td colSpan={5} className="text-center text-[var(--hp-silver-dark)] italic py-2">—</td></tr>
              )}
              {totals.lubricants.map((it, i) => (
                <tr key={`o-${i}`}>
                  <td className="text-center">{i + 1}</td>
                  <td>{it.productName}</td>
                  <td className="text-center">{it.quantity}</td>
                  <td className="text-right">{fmtPkr(it.unitPrice)}</td>
                  <td className="text-right font-bold">{fmtPkr(it.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="text-right font-black uppercase text-[10px]">Total Oil &amp; Lubricants Value (in PKR)</td>
                <td className="text-right font-black text-[var(--hp-red)]">{fmtPkr(totals.oilLubTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </SectionTable>

        {workRequired && (
          <div className="estimate-panel p-3 text-[10px]">
            <p className="font-black uppercase mb-1 text-[var(--hp-red)]">Work Order / Remarks</p>
            <p className="italic text-[var(--hp-charcoal)]">{workRequired}</p>
          </div>
        )}

        <div className="estimate-summary">
          <div className="estimate-summary-title">{title}</div>
          <table className="w-full text-[11px]">
            <tbody>
              <tr className="estimate-summary-row">
                <td className="p-2 font-black uppercase">Parts</td>
                <td className="p-2 text-right font-bold">{fmtPkr(totals.partsTotal)}</td>
              </tr>
              <tr className="estimate-summary-row">
                <td className="p-2 font-black uppercase">Oil &amp; Parts</td>
                <td className="p-2 text-right font-bold">{fmtPkr(totals.oilLubTotal)}</td>
              </tr>
              <tr className="estimate-summary-row">
                <td className="p-2 font-black uppercase">Labour</td>
                <td className="p-2 text-right font-bold">{fmtPkr(totals.labourTotal)}</td>
              </tr>
              {totals.tax > 0 && (
                <tr className="estimate-summary-row">
                  <td className="p-2 font-black uppercase">Tax</td>
                  <td className="p-2 text-right font-bold">{fmtPkr(totals.tax)}</td>
                </tr>
              )}
              {totals.discount > 0 && (
                <tr className="estimate-summary-row">
                  <td className="p-2 font-black uppercase">Discount</td>
                  <td className="p-2 text-right font-bold text-[var(--hp-red)]">-{fmtPkr(totals.discount)}</td>
                </tr>
              )}
              <tr className="estimate-summary-total">
                <td className="p-2 font-black uppercase text-sm">
                  {isInvoice ? 'Total Invoice (PKR)' : 'Total Estimate (PKR)'}
                </td>
                <td className="p-2 text-right font-black text-base">{fmtPkr(totals.grandTotal)}</td>
              </tr>
              {showPayment && (
                <>
                  <tr className="estimate-summary-row">
                    <td className="p-2 font-black uppercase text-emerald-700">Amount Paid (PKR)</td>
                    <td className="p-2 text-right font-bold text-emerald-700">{fmtPkr(paidAmount)}</td>
                  </tr>
                  {!isFullyPaid && (
                    <tr className="estimate-summary-row">
                      <td className="p-2 font-black uppercase text-amber-700">Pending Balance (PKR)</td>
                      <td className="p-2 text-right font-bold text-amber-700">{fmtPkr(pendingAmount)}</td>
                    </tr>
                  )}
                  {isFullyPaid && (
                    <tr className="estimate-summary-row">
                      <td colSpan={2} className="p-2 text-center font-black uppercase text-emerald-700 text-[10px]">
                        Payment Complete — Full Amount Received
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        <div className="estimate-panel p-3 text-[9px] space-y-1.5">
          <p className="font-black uppercase text-[10px] mb-1 text-[var(--hp-red)]">Terms and Conditions</p>
          <p>1. I fully understand that replaced / removed / defective parts from my vehicle are my responsibility and must be collected within one week of job completion.</p>
          <p>2. Payments accepted as Cash, Pay Order or Cheque in favour of {WORKSHOP.name}.</p>
          <p>3. 100% advance payment may be required to order parts. Prices are subject to exchange rate fluctuation at final invoicing.</p>
          <p>4. Additional parts found during diagnosis will be shared as a supplementary estimate for customer approval.</p>
          <p>5. This estimate is valid for 7 working days from date of customer approval.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-center text-[9px]">
          <div>
            <div className="estimate-sig-line" />
            <p className="font-black uppercase text-[var(--hp-charcoal)]">Customer Signature</p>
          </div>
          <div>
            <div className="estimate-sig-line" />
            <p className="font-black uppercase text-[var(--hp-charcoal)]">Manager / Technical Lead</p>
          </div>
          <div>
            <div className="estimate-sig-line" />
            <p className="font-black uppercase text-[var(--hp-charcoal)]">Advisor Signature</p>
          </div>
        </div>

        <p className="text-center text-[9px] text-[var(--hp-silver-dark)] pt-2">
          {showPayment ? (
            isFullyPaid ? (
              <>
                Total Received (PKR):{' '}
                <span className="font-black text-emerald-700 text-sm">{fmtPkr(paidAmount)}</span>
              </>
            ) : (
              <>
                Paid: <span className="font-black text-emerald-700">{fmtPkr(paidAmount)}</span>
                {' · '}
                Pending: <span className="font-black text-amber-700">{fmtPkr(pendingAmount)}</span>
                {' · '}
                Total Bill: <span className="font-black text-[var(--hp-red)]">{fmtPkr(totals.grandTotal)}</span>
              </>
            )
          ) : (
            <>
              Final Amount (PKR):{' '}
              <span className="font-black text-[var(--hp-red)] text-sm">{fmtPkr(totals.grandTotal)}</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
