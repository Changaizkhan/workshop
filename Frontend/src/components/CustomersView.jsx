import { useState } from 'react';
import AuditInfo from './AuditInfo';
import ConfirmModal from './ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';
import { useCustomerProfile } from '../hooks/useGarageQueries';

const fmtPkr = (n) => Number(n || 0).toLocaleString('en-PK');

const carCount = (c) => {
  if (Array.isArray(c.cars) && c.cars.length) return c.cars.length;
  return c.vehicleNumber ? 1 : 0;
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
};

export default function CustomersView({
  customers,
  user,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onAddCustomerCar,
}) {
  const isAdmin = user?.role === 'ADMIN';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [vehicleNo, setVehicleNo] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');

  const [carModalOpen, setCarModalOpen] = useState(false);
  const [carPlate, setCarPlate] = useState('');
  const [carMake, setCarMake] = useState('');
  const [carModel, setCarModel] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { openConfirm, openAlert, modalProps } = useConfirmModal();

  const profileQuery = useCustomerProfile(selectedCustomer?.id, Boolean(selectedCustomer?.id));
  const profile = profileQuery.data;

  const activeList = customers.filter((c) => !c.isDeleted);
  const filtered = activeList.filter((c) => {
    const q = searchQuery.toLowerCase();
    const plates = (c.cars || []).map((car) => car.vehicleNumber).join(' ');
    return (
      c.customerName?.toLowerCase().includes(q) ||
      c.mobileNumber?.toLowerCase().includes(q) ||
      c.vehicleNumber?.toLowerCase().includes(q) ||
      c.vehicleMake?.toLowerCase().includes(q) ||
      c.vehicleModel?.toLowerCase().includes(q) ||
      plates.toLowerCase().includes(q)
    );
  });

  const resetForm = () => {
    setName('');
    setPhone('');
    setAddress('');
    setVehicleNo('');
    setMake('');
    setModel('');
    setError('');
  };

  const resetCarForm = () => {
    setCarPlate('');
    setCarMake('');
    setCarModel('');
    setError('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditMode(false);
    setModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setCurrentId(c.id);
    setName(c.customerName);
    setPhone(c.mobileNumber);
    setAddress(c.address || '');
    setVehicleNo('');
    setMake('');
    setModel('');
    setEditMode(true);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      setError('Name aur phone number zaroori hain.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      if (editMode) {
        await onEditCustomer(currentId, {
          customerName: name,
          mobileNumber: phone,
          address,
        });
        setSuccess('Customer profile update ho gaya.');
      } else {
        const payload = {
          customerName: name,
          mobileNumber: phone,
          address,
        };
        if (vehicleNo) {
          payload.vehicleNumber = vehicleNo;
          payload.vehicleMake = make;
          payload.vehicleModel = model;
        }
        await onAddCustomer(payload);
        setSuccess('Fleet customer register ho gaya.');
      }
      setTimeout(() => {
        setModalOpen(false);
        setSuccess('');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Operation failed.');
    }
  };

  const handleAddCar = async (e) => {
    e.preventDefault();
    if (!carPlate) {
      setError('Plate number zaroori hai.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await onAddCustomerCar(selectedCustomer.id, {
        vehicleNumber: carPlate,
        vehicleMake: carMake,
        vehicleModel: carModel,
      });
      setSuccess('Nayi gaari fleet mein add ho gayi.');
      setTimeout(() => {
        setCarModalOpen(false);
        setSuccess('');
        resetCarForm();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Car add nahi ho saki.');
    }
  };

  const handleDelete = (id) => {
    openConfirm({
      title: isAdmin ? 'Permanently delete customer?' : 'Remove this customer?',
      message: isAdmin
        ? 'This customer record will be permanently deleted.'
        : 'This customer will be removed. Admin will see who deleted it.',
      confirmLabel: isAdmin ? 'Delete permanently' : 'Remove',
      onConfirm: async () => {
        try {
          await onDeleteCustomer(id);
          if (selectedCustomer?.id === id) setSelectedCustomer(null);
        } catch (err) {
          openAlert({ title: 'Delete failed', message: err.message || 'Purge failed.', variant: 'danger' });
        }
      },
    });
  };

  if (selectedCustomer) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => setSelectedCustomer(null)}
              className="text-xs font-bold text-blue-600 hover:text-blue-500 mb-2 cursor-pointer"
            >
              ← Fleet list par wapas
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{profile?.customerName || selectedCustomer.customerName}</h2>
            <p className="text-xs text-slate-400 font-mono">{profile?.mobileNumber || selectedCustomer.mobileNumber}</p>
            {profile?.address && (
              <p className="text-[10px] text-slate-500 mt-1">{profile.address}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                resetCarForm();
                setCarModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
            >
              + Nayi Gaari
            </button>
            <button
              type="button"
              onClick={() => handleOpenEdit(profile || selectedCustomer)}
              className="border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => handleDelete(selectedCustomer.id)}
              className="hover:bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/25 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
            >
              🗑️ Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Cars</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{profile?.cars?.length ?? carCount(selectedCustomer)}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Visits</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{profile?.visitCount ?? '—'}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-4">
            <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider">Collected (Paid)</p>
            <p className="text-xl font-black text-emerald-700 dark:text-emerald-300">
              Rs. {profile ? fmtPkr(profile.totalPaid) : '—'}
            </p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4">
            <p className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">Pending (Udhar)</p>
            <p className="text-xl font-black text-amber-700 dark:text-amber-300">
              Rs. {profile ? fmtPkr(profile.totalPending) : '—'}
            </p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/25 rounded-2xl p-4">
            <p className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">Profit (collected)</p>
            <p className="text-xl font-black text-blue-700 dark:text-blue-300">
              Rs. {profile ? fmtPkr(profile.totalProfit) : '—'}
            </p>
            <p className="text-[10px] text-blue-600/70 mt-1">Delivered — jo pay hua</p>
          </div>
        </div>

        {profileQuery.isLoading && (
          <p className="text-xs text-slate-400 italic">Customer history load ho rahi hai...</p>
        )}

        {profileQuery.isError && (
          <p className="text-xs text-rose-500">Profile load nahi ho saki. Backend restart karein.</p>
        )}

        {(profile?.vehicles || []).map((v) => {
          const history = [
            ...(v.estimates || []),
            ...(v.jobs || []),
          ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

          return (
            <div
              key={v.car.vehicleNumber}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🚗</span>
                  <div>
                    <p className="font-mono font-black text-sm text-slate-900 dark:text-white uppercase">{v.car.vehicleNumber}</p>
                    <p className="text-xs text-slate-500">
                      {[v.car.vehicleMake, v.car.vehicleModel].filter(Boolean).join(' ') || 'Make/Model —'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Delivered profit</p>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">Rs. {fmtPkr(v.totalProfit)}</p>
                </div>
              </div>

              <div className="p-5">
                {history.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Abhi tak koi estimate ya job nahi — pehli visit estimate se save karein.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((visit) => (
                      <div
                        key={`${visit.type}-${visit.id}`}
                        className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex flex-col sm:flex-row sm:items-start justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              visit.type === 'JOB'
                                ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                            }`}>
                              {visit.type}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">{visit.docNumber}</span>
                            <span className="text-[10px] text-slate-400">{fmtDate(visit.date)}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-bold">Issue / Kaam: </span>
                            {visit.workRequired || '—'}
                          </p>
                          {visit.status && (
                            <p className="text-[10px] text-slate-400 mt-0.5">Status: {visit.status}</p>
                          )}
                          {visit.type === 'JOB' && visit.status === 'DELIVERED' && (
                            <div className="text-[10px] mt-1 space-y-0.5">
                              <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                                Paid: Rs. {fmtPkr(visit.amountPaid || 0)}
                              </p>
                              {(visit.amountPending || 0) > 0 && (
                                <p className="text-amber-600 dark:text-amber-400 font-bold">
                                  Pending: Rs. {fmtPkr(visit.amountPending)}
                                </p>
                              )}
                              {visit.paymentStatus === 'PAID' && (
                                <p className="text-emerald-600 font-bold">Payment: Done ✓</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          {visit.countsTowardProfit ? (
                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                              Rs. {fmtPkr(visit.profitAmount ?? visit.grandTotal)}
                            </p>
                          ) : visit.type === 'ESTIMATE' ? (
                            <p className="text-[10px] font-bold text-slate-400 italic">Profit pending</p>
                          ) : visit.status === 'DELIVERED' && visit.paymentStatus === 'PARTIAL' ? (
                            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 italic">
                              Partial payment
                            </p>
                          ) : (
                            <p className="text-[10px] font-bold text-slate-400 italic">
                              Delivered par profit
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {!profileQuery.isLoading && profile && profile.vehicles?.length === 0 && (
          <div className="text-center py-12 text-xs text-slate-400 italic">
            Is customer ki koi gaari register nahi. &quot;+ Nayi Gaari&quot; se add karein ya estimate banate waqt naam likhein.
          </div>
        )}

        {carModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                Fleet mein nayi gaari
              </h3>
              {error && <div className="bg-rose-500/10 border border-rose-500/25 text-rose-500 p-3 rounded-xl text-xs mb-4">{error}</div>}
              {success && <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 p-3 rounded-xl text-xs mb-4">{success}</div>}
              <form onSubmit={handleAddCar} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Plate Number *</label>
                  <input
                    type="text"
                    value={carPlate}
                    onChange={(e) => setCarPlate(e.target.value)}
                    placeholder="ABC-123"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Make</label>
                    <input
                      type="text"
                      value={carMake}
                      onChange={(e) => setCarMake(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Model</label>
                    <input
                      type="text"
                      value={carModel}
                      onChange={(e) => setCarModel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setCarModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer">
                    Add Car
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6">
              <h3 className="text-sm font-black uppercase mb-4">{editMode ? 'Edit Profile' : 'Add Fleet Customer'}</h3>
              {error && <div className="bg-rose-500/10 text-rose-500 p-3 rounded-xl text-xs mb-4">{error}</div>}
              {success && <div className="bg-emerald-500/10 text-emerald-600 p-3 rounded-xl text-xs mb-4">{success}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Name *</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Phone *</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3 text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Address</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3 text-xs" />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer">Cancel</button>
                  <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {modalProps && <ConfirmModal {...modalProps} />}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Fleet Clients</h2>
          <p className="text-xs text-slate-400">Ek customer — kai gaariyan. Click karein history aur profit dekhnay ke liye.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer"
        >
          <span>➕</span> Add Fleet Customer
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="relative">
          <input
            type="text"
            placeholder="Naam, phone ya plate se search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-blue-500 rounded-xl py-2.5 pr-4 pl-10 text-xs focus:outline-none"
          />
          <span className="absolute left-3.5 top-3 text-xs opacity-50">🔍</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const count = carCount(c);
          const plates = (c.cars || []).map((car) => car.vehicleNumber).filter(Boolean);
          const preview = plates.length ? plates.slice(0, 2).join(', ') : c.vehicleNumber || '—';

          return (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-400 dark:hover:border-blue-600 transition-all shadow-xs flex flex-col justify-between"
            >
              <button
                type="button"
                onClick={() => setSelectedCustomer(c)}
                className="text-left cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{c.customerName}</h4>
                    <p className="font-mono text-[10px] text-slate-500">{c.mobileNumber}</p>
                  </div>
                  <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black px-2.5 py-1 rounded-md">
                    {count} {count === 1 ? 'Car' : 'Cars'}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 mb-3">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Registered Plates</p>
                  <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">{preview}</p>
                  {plates.length > 2 && (
                    <p className="text-[10px] text-slate-400 mt-1">+{plates.length - 2} aur</p>
                  )}
                </div>
                {c.address && (
                  <p className="text-[10px] text-slate-500 truncate">{c.address}</p>
                )}
                <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-3">Click → full history & profit</p>
              </button>
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="hover:bg-rose-500/10 text-rose-500 dark:text-rose-400 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-slate-400 italic">
            Koi customer nahi mila.
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              {editMode ? 'Edit Customer' : 'Naya Fleet Customer'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {editMode ? 'Naam aur contact update karein.' : 'Pehli gaari optional hai — baad mein bhi add ho sakti hai.'}
            </p>
            {error && <div className="bg-rose-500/10 border border-rose-500/25 text-rose-500 p-3.5 rounded-xl text-xs mb-4">{error}</div>}
            {success && <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 p-3.5 rounded-xl text-xs mb-4">{success}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Client</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Full Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Mobile *</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3 text-xs" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3 text-xs" />
              </div>
              {!editMode && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">Pehli Gaari (optional)</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Plate</label>
                      <input type="text" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Make</label>
                      <input type="text" value={make} onChange={(e) => setMake(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3 text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Model</label>
                      <input type="text" value={model} onChange={(e) => setModel(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border rounded-xl py-2 px-3 text-xs" />
                    </div>
                  </div>
                </div>
              )}
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setModalOpen(false)} className="border px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer">
                  {editMode ? 'Save' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalProps && <ConfirmModal {...modalProps} />}
    </div>
  );
}
