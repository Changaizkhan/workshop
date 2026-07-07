import WorkshopEstimatePrint from './WorkshopEstimatePrint';

export default function JobInvoiceView({ job, onClose }) {
  if (!job) return null;

  return (
    <WorkshopEstimatePrint
      mode="invoice"
      docNumber={job.jobNumber}
      jobNumber={job.jobNumber}
      dateCreated={job.dateCreated}
      customerName={job.customerName}
      contactNo={job.mobileNumber}
      address={job.address}
      customerCnic={job.customerCnic}
      customerEmail={job.customerEmail}
      vehicleMake={job.vehicleMake}
      vehicleModel={job.vehicleModel}
      vehicleNumber={job.vehicleNumber}
      chassisNumber={job.chassisNumber}
      engineNumber={job.engineNumber}
      colour={job.colour}
      vehicleMileage={job.vehicleMileage}
      workRequired={job.workRequired}
      productsUsed={job.productsUsed || []}
      labourCharges={job.labourCharges || []}
      customCharges={job.customCharges || []}
      calculations={job.calculations || {}}
      workStatus={job.workStatus}
      paymentStatus={job.paymentStatus}
      amountPaid={job.amountPaid}
      amountPending={job.amountPending}
      onClose={onClose}
      backLabel="Back to Jobs"
    />
  );
}
