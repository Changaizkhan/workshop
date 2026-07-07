import { useState } from 'react';
import AuditInfo from './AuditInfo';
import ConfirmModal from './ConfirmModal';
import { useConfirmModal } from '../hooks/useConfirmModal';

export default function InvestorView({
  investors,
  products = [],
  user,
  onAddInvestor,
  onUpdateInvestor,
  onDeleteInvestor,
  onAddInvestorCar,
  onUpdateInvestorCar,
  onDeleteInvestorCar,
  onSellInvestorCar,
  onDeleteSoldItem,
}) {
  const isAdmin = user?.role === 'ADMIN';
  const [view, setView] = useState('cards');
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [search, setSearch] = useState('');
  const [partsSearch, setPartsSearch] = useState('');
  const [pickSearch, setPickSearch] = useState('');

  const [investorModal, setInvestorModal] = useState(false);
  const [investorEdit, setInvestorEdit] = useState(false);
  const [investorId, setInvestorId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [carModal, setCarModal] = useState(false);
  const [carEdit, setCarEdit] = useState(false);
  const [carId, setCarId] = useState('');
  const [carName, setCarName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [buyPrice, setBuyPrice] = useState(0);
  const [sellPrice, setSellPrice] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [carNotes, setCarNotes] = useState('');

  const [sellModal, setSellModal] = useState(false);
  const [sellCar, setSellCar] = useState(null);
  const [sellQty, setSellQty] = useState(1);
  const [sellPriceInput, setSellPriceInput] = useState(0);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { openConfirm, openAlert, modalProps } = useConfirmModal();

  const activeList = investors.filter((i) => !i.isDeleted);
  const filtered = activeList.filter((i) => {
    const q = search.toLowerCase();
    return i.investorName?.toLowerCase().includes(q) || i.mobileNumber?.toLowerCase().includes(q);
  });

  const liveInvestor = selectedInvestor
    ? investors.find((i) => i.id === selectedInvestor.id) || selectedInvestor
    : null;

  const matchPartQuery = (item, q) => {
    if (!q?.trim()) return true;
    const query = q.trim().toLowerCase();
    return (
      item.carName?.toLowerCase().includes(query) ||
      item.partNumber?.toLowerCase().includes(query)
    );
  };

  const cars = (liveInvestor?.cars || []).filter((c) => Number(c.quantity || 0) > 0);
  const filteredCars = cars.filter((c) => matchPartQuery(c, partsSearch));
  const soldItems = [...(liveInvestor?.soldItems || [])].sort(
    (a, b) => new Date(b.soldAt || 0) - new Date(a.soldAt || 0),
  );
  const filteredSoldItems = soldItems.filter((s) => matchPartQuery(s, partsSearch));
  const totalBuy = cars.reduce((a, c) => a + Number(c.buyPrice || 0) * Number(c.quantity || 1), 0);
  const totalSell = cars.reduce((a, c) => a + Number(c.sellPrice || 0) * Number(c.quantity || 1), 0);
  const totalProfit = totalSell - totalBuy;
  const totalSoldRevenue = soldItems.reduce((a, s) => a + Number(s.totalPrice || 0), 0);

  const resetInvestorForm = () => {
    setName('');
    setPhone('');
    setNotes('');
    setError('');
  };

  const resetCarForm = () => {
    setCarName('');
    setPartNumber('');
    setBuyPrice(0);
    setSellPrice(0);
    setQuantity(1);
    setCarNotes('');
    setPickSearch('');
    setError('');
  };

  const inventorySuggestions = pickSearch.trim()
    ? products
      .filter((p) => {
        const q = pickSearch.trim().toLowerCase();
        return (
          p.productName?.toLowerCase().includes(q) ||
          (p.partNumber || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q)
        );
      })
      .slice(0, 8)
    : [];

  const existingPartSuggestions = pickSearch.trim() && liveInvestor
    ? (liveInvestor.cars || []).filter((c) => matchPartQuery(c, pickSearch)).slice(0, 5)
    : [];

  const applyInventoryPick = (p) => {
    setCarName(p.productName || '');
    setPartNumber(p.partNumber || '');
    setBuyPrice(Number(p.costPrice || 0));
    setSellPrice(Number(p.sellingPrice || 0));
    setQuantity(1);
    setCarNotes('');
    setCarEdit(false);
    setCarId('');
    setPickSearch('');
    setError('');
    setCarModal(true);
  };

  const applyExistingPartPick = (c) => {
    setCarName(c.carName || '');
    setPartNumber(c.partNumber || '');
    setBuyPrice(Number(c.buyPrice || 0));
    setSellPrice(Number(c.sellPrice || 0));
    setQuantity(Number(c.quantity || 1));
    setCarNotes(c.notes || '');
    setCarEdit(false);
    setCarId('');
    setPickSearch('');
    setError('');
    setCarModal(true);
  };

  const openAddInvestor = () => {
    resetInvestorForm();
    setInvestorEdit(false);
    setInvestorModal(true);
  };

  const openEditInvestor = (inv, e) => {
    e?.stopPropagation();
    setInvestorId(inv.id);
    setName(inv.investorName || '');
    setPhone(inv.mobileNumber || '');
    setNotes(inv.notes || '');
    setInvestorEdit(true);
    setInvestorModal(true);
  };

  const openInvestorDetail = (inv) => {
    setSelectedInvestor(inv);
    setView('detail');
    setPartsSearch('');
    setSuccess('');
    setError('');
  };

  const openAddCar = () => {
    resetCarForm();
    setCarEdit(false);
    setCarModal(true);
  };

  const openSellCar = (car) => {
    setSellCar(car);
    setSellQty(1);
    setSellPriceInput(Number(car.sellPrice || 0));
    setError('');
    setSellModal(true);
  };

  const handleSellSubmit = async (e) => {
    e.preventDefault();
    if (!liveInvestor || !sellCar) return;
    const qty = Number(sellQty);
    const price = Number(sellPriceInput);
    if (!qty || qty < 1) {
      setError('Enter a valid quantity.');
      return;
    }
    if (qty > Number(sellCar.quantity || 1)) {
      setError(`Only ${sellCar.quantity || 1} unit(s) available.`);
      return;
    }
    if (price < 0) {
      setError('Sell price cannot be negative.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      await onSellInvestorCar(liveInvestor.id, sellCar.id, {
        quantity: qty,
        sellPrice: price,
      });
      setSuccess(`Sold ${qty} × ${sellCar.carName} for Rs. ${(qty * price).toLocaleString()}.`);
      setSellModal(false);
      setSellCar(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Sell failed.');
    }
  };

  const openEditCar = (car) => {
    setCarId(car.id);
    setCarName(car.carName || '');
    setPartNumber(car.partNumber || '');
    setBuyPrice(car.buyPrice || 0);
    setSellPrice(car.sellPrice || 0);
    setQuantity(car.quantity || 1);
    setCarNotes(car.notes || '');
    setCarEdit(true);
    setCarModal(true);
  };

  const handleInvestorSubmit = async (e) => {
    e.preventDefault();
    if (!name || !phone) {
      setError('Name and phone number are required.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      if (investorEdit) {
        await onUpdateInvestor(investorId, { investorName: name, mobileNumber: phone, notes });
        setSuccess('Investor updated.');
      } else {
        await onAddInvestor({ investorName: name, mobileNumber: phone, notes });
        setSuccess('Investor added.');
      }
      setTimeout(() => {
        setInvestorModal(false);
        resetInvestorForm();
        setSuccess('');
      }, 900);
    } catch (err) {
      setError(err.message || 'Failed.');
    }
  };

  const handleCarSubmit = async (e) => {
    e.preventDefault();
    if (!carName || !partNumber || buyPrice === '' || sellPrice === '') {
      setError('Car name, part number, buy price, and sell price are required.');
      return;
    }
    if (!liveInvestor) return;
    setError('');
    setSuccess('');
    const payload = {
      carName,
      partNumber,
      buyPrice: Number(buyPrice),
      sellPrice: Number(sellPrice),
      quantity: Number(quantity) || 1,
      notes: carNotes,
    };
    try {
      if (carEdit) {
        await onUpdateInvestorCar(liveInvestor.id, carId, payload);
        setSuccess('Car part updated.');
      } else {
        await onAddInvestorCar(liveInvestor.id, payload);
        setSuccess('Car part added for production/sell.');
      }
      setTimeout(() => {
        setCarModal(false);
        resetCarForm();
        setSuccess('');
      }, 900);
    } catch (err) {
      setError(err.message || 'Failed.');
    }
  };

  const handleDeleteInvestor = (id, e) => {
    e?.stopPropagation();
    openConfirm({
      title: isAdmin ? 'Delete investor?' : 'Remove investor?',
      message: isAdmin
        ? 'Delete this investor and all their car parts? This cannot be undone.'
        : 'Remove this investor from the list?',
      confirmLabel: isAdmin ? 'Delete permanently' : 'Remove',
      onConfirm: async () => {
        try {
          await onDeleteInvestor(id);
          if (selectedInvestor?.id === id) {
            setView('cards');
            setSelectedInvestor(null);
          }
        } catch (err) {
          openAlert({ title: 'Delete failed', message: err.message || 'Delete failed.', variant: 'danger' });
        }
      },
    });
  };

  const handleDeleteSoldItem = (saleId) => {
    if (!liveInvestor) return;
    openConfirm({
      title: 'Delete sold record?',
      message: 'Remove this sale from history? Quantity will return to stock if the part still exists.',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        try {
          await onDeleteSoldItem(liveInvestor.id, saleId);
          setSuccess('Sold record removed. Stock updated.');
          setTimeout(() => setSuccess(''), 4000);
        } catch (err) {
          openAlert({ title: 'Delete failed', message: err.message || 'Delete failed.', variant: 'danger' });
        }
      },
    });
  };

  const handleDeleteCar = (carItemId) => {
    if (!liveInvestor) return;
    openConfirm({
      title: 'Remove car part?',
      message: 'Remove this car part from the investor list?',
      confirmLabel: 'Remove',
      onConfirm: async () => {
        try {
          await onDeleteInvestorCar(liveInvestor.id, carItemId);
        } catch (err) {
          openAlert({ title: 'Delete failed', message: err.message || 'Delete failed.', variant: 'danger' });
        }
      },
    });
  };

  if (view === 'detail' && liveInvestor) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => { setView('cards'); setSelectedInvestor(null); }}
          className="text-xs font-bold text-blue-600 hover:text-blue-500 cursor-pointer"
        >
          ← Back to investor cards
        </button>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shrink-0">
              {(liveInvestor.investorName || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{liveInvestor.investorName}</h2>
              <p className="text-sm text-slate-500">📞 {liveInvestor.mobileNumber}</p>
              {liveInvestor.notes && <p className="text-xs text-slate-400 mt-1 italic">{liveInvestor.notes}</p>}
              {isAdmin && <AuditInfo record={liveInvestor} className="mt-2" />}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 w-full sm:w-auto shrink-0">
            <div className="relative flex-1 sm:min-w-[240px]">
              <input
                type="text"
                value={pickSearch}
                onChange={(e) => setPickSearch(e.target.value)}
                placeholder="Search part # or name to add..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs py-2.5 px-4 outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {pickSearch.trim() && (inventorySuggestions.length > 0 || existingPartSuggestions.length > 0) && (
                <div className="absolute z-20 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl">
                  {inventorySuggestions.length > 0 && (
                    <p className="px-3 py-1.5 text-[9px] font-black uppercase text-slate-400 bg-slate-50 dark:bg-slate-800">From inventory</p>
                  )}
                  {inventorySuggestions.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyInventoryPick(p)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer"
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{p.productName}</span>
                      <span className="text-[10px] font-mono text-blue-500 ml-2">{p.partNumber || '—'}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        Buy Rs. {Number(p.costPrice || 0).toLocaleString()} · Sell Rs. {Number(p.sellingPrice || 0).toLocaleString()}
                      </span>
                    </button>
                  ))}
                  {existingPartSuggestions.length > 0 && (
                    <p className="px-3 py-1.5 text-[9px] font-black uppercase text-slate-400 bg-slate-50 dark:bg-slate-800">Already with this investor</p>
                  )}
                  {existingPartSuggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => applyExistingPartPick(c)}
                      className="w-full text-left px-3 py-2 hover:bg-emerald-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer"
                    >
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{c.carName}</span>
                      <span className="text-[10px] font-mono text-emerald-500 ml-2">{c.partNumber}</span>
                      <span className="block text-[10px] text-slate-400 mt-0.5">Qty {c.quantity || 1} in stock</span>
                    </button>
                  ))}
                </div>
              )}
              {pickSearch.trim() && inventorySuggestions.length === 0 && existingPartSuggestions.length === 0 && (
                <p className="text-[10px] text-slate-400 mt-1 italic px-1">No match in inventory or this investor&apos;s parts.</p>
              )}
            </div>
            <button
              type="button"
              onClick={openAddCar}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer whitespace-nowrap"
            >
              ➕ Add Car / Part
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Stock parts</p>
            <p className="text-xl font-bold mt-1">{cars.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Stock buy value</p>
            <p className="text-xl font-bold text-rose-500 mt-1">Rs. {totalBuy.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Stock sell value</p>
            <p className="text-xl font-bold text-emerald-500 mt-1">Rs. {totalSell.toLocaleString()}</p>
            <p className="text-[10px] text-blue-500 font-bold mt-0.5">Est. profit: Rs. {totalProfit.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Sold revenue</p>
            <p className="text-xl font-bold text-indigo-500 mt-1">Rs. {totalSoldRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">{soldItems.length} sale(s)</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <input
            type="text"
            placeholder="Search part by name or part number..."
            value={partsSearch}
            onChange={(e) => setPartsSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs py-2.5 px-4 outline-none focus:ring-1 focus:ring-blue-500"
          />
          {partsSearch.trim() && (
            <p className="text-[10px] text-slate-400 mt-2">
              Showing {filteredCars.length} stock · {filteredSoldItems.length} sold
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden table-scroll">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Sold Items</h3>
            <p className="text-[10px] text-slate-400 mt-1">Items sold from this investor — with price</p>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Item</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Part number</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Qty</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Unit price</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Total</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Sold on</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredSoldItems.map((sale) => (
                <tr key={sale.id} className="hover:bg-indigo-50/10 transition-colors">
                  <td className="p-4 font-bold text-slate-900 dark:text-white">{sale.carName}</td>
                  <td className="p-4 font-mono text-blue-600 dark:text-blue-400">{sale.partNumber}</td>
                  <td className="p-4">{sale.quantity}</td>
                  <td className="p-4 text-emerald-600 font-bold">Rs. {Number(sale.unitPrice).toLocaleString()}</td>
                  <td className="p-4 font-black text-indigo-600">Rs. {Number(sale.totalPrice).toLocaleString()}</td>
                  <td className="p-4 text-slate-500">{new Date(sale.soldAt).toLocaleString()}</td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeleteSoldItem(sale.id)}
                      className="px-2 py-1 rounded-lg hover:bg-rose-500/10 text-rose-500 font-bold cursor-pointer"
                      title="Delete sold record"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
              {filteredSoldItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-slate-400 italic">
                    {partsSearch.trim()
                      ? 'No sold items match your search.'
                      : 'No sold items yet. Use the Sell button in stock list below.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {error && <div className="bg-rose-500/10 border border-rose-500/25 text-rose-600 p-3 rounded-xl text-xs">{error}</div>}
        {success && <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 p-3 rounded-xl text-xs">{success}</div>}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden table-scroll">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest">Stock — Production / Sell Items</h3>
          </div>
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60">
              <tr>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Car / Part</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Part number</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Qty</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Buy price</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Sell price</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400">Profit/unit</th>
                <th className="p-4 text-[10px] uppercase font-black text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredCars.map((car) => {
                const profit = Number(car.sellPrice || 0) - Number(car.buyPrice || 0);
                return (
                  <tr key={car.id} className="hover:bg-blue-50/10 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{car.carName}</td>
                    <td className="p-4 font-mono text-blue-600 dark:text-blue-400">{car.partNumber}</td>
                    <td className="p-4">{car.quantity || 1}</td>
                    <td className="p-4 text-rose-600 font-bold">Rs. {Number(car.buyPrice).toLocaleString()}</td>
                    <td className="p-4 text-emerald-600 font-bold">Rs. {Number(car.sellPrice).toLocaleString()}</td>
                    <td className={`p-4 font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      Rs. {profit.toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openSellCar(car)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black cursor-pointer"
                        >
                          Sell
                        </button>
                        <button type="button" onClick={() => openEditCar(car)} className="px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer">✏️</button>
                        <button type="button" onClick={() => handleDeleteCar(car.id)} className="px-2 py-1 rounded-lg hover:bg-rose-500/10 text-rose-500 font-bold cursor-pointer">🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredCars.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-12 text-slate-400 italic">
                    {partsSearch.trim()
                      ? 'No stock parts match your search.'
                      : 'No cars or parts yet. Click "Add Car / Part" to list production/sell items from this investor.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {sellModal && sellCar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6">
              <h3 className="text-sm font-black uppercase mb-2">Sell Item</h3>
              <p className="text-xs text-slate-400 mb-1">{sellCar.carName}</p>
              <p className="text-[10px] font-mono text-blue-500 mb-4">{sellCar.partNumber} · {sellCar.quantity || 1} in stock</p>
              {error && <div className="bg-rose-500/10 text-rose-600 p-3 rounded-xl text-xs mb-4">{error}</div>}
              <form onSubmit={handleSellSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      max={sellCar.quantity || 1}
                      value={sellQty}
                      onChange={(e) => setSellQty(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Sell price (Rs.)</label>
                    <input
                      type="number"
                      min="0"
                      value={sellPriceInput}
                      onChange={(e) => setSellPriceInput(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs"
                    />
                  </div>
                </div>
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-xs">
                  <span className="text-slate-500">Total sale: </span>
                  <span className="font-black text-indigo-600">Rs. {(Number(sellQty || 0) * Number(sellPriceInput || 0)).toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setSellModal(false); setSellCar(null); setError(''); }} className="flex-1 py-2.5 rounded-xl border text-xs font-bold cursor-pointer">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer">Confirm sell</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {carModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-sm font-black uppercase mb-2">{carEdit ? 'Edit Car / Part' : 'Add Car / Part for Sell'}</h3>
              <p className="text-xs text-slate-400 mb-4">Investor: {liveInvestor.investorName}</p>
              {error && <div className="bg-rose-500/10 text-rose-600 p-3 rounded-xl text-xs mb-4">{error}</div>}
              <form onSubmit={handleCarSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Car / part name</label>
                  <input type="text" value={carName} onChange={(e) => setCarName(e.target.value)} placeholder="Toyota Corolla Bumper" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Part number</label>
                  <input type="text" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="PN-45892" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs font-mono" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Buy price (Rs.)</label>
                    <input type="number" min="0" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Sell price (Rs.)</label>
                    <input type="number" min="0" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Quantity</label>
                    <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Notes</label>
                  <textarea value={carNotes} onChange={(e) => setCarNotes(e.target.value)} rows={2} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs resize-none" />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setCarModal(false); resetCarForm(); }} className="flex-1 py-2.5 rounded-xl border text-xs font-bold cursor-pointer">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer">{carEdit ? 'Save' : 'Add part'}</button>
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Investor Partners</h2>
          <p className="text-xs text-slate-400">Click investor card to see cars & parts for production / sell</p>
        </div>
        {isAdmin && (
          <button type="button" onClick={openAddInvestor} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer">
            ➕ Add Investor
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <input
          type="text"
          placeholder="Search investor by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs py-2.5 px-4 outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((inv) => {
          const partCount = (inv.cars || []).length;
          return (
            <div
              key={inv.id}
              role="button"
              tabIndex={0}
              onClick={() => openInvestorDetail(inv)}
              onKeyDown={(e) => e.key === 'Enter' && openInvestorDetail(inv)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-900/10 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-lg flex items-center justify-center shrink-0">
                  {(inv.investorName || '?').charAt(0).toUpperCase()}
                </div>
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={(e) => openEditInvestor(inv, e)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs cursor-pointer">✏️</button>
                    <button type="button" onClick={(e) => handleDeleteInvestor(inv.id, e)} className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 text-xs cursor-pointer">🗑️</button>
                  </div>
                )}
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">{inv.investorName}</h3>
              <p className="text-xs text-slate-500 mb-3">📞 {inv.mobileNumber}</p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Cars / parts</span>
                <span className="text-xs font-black text-blue-600 dark:text-blue-400">{partCount} items</span>
              </div>
              <p className="text-[10px] text-blue-500 font-bold mt-3 group-hover:underline">Click to view production & sell list →</p>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 italic text-xs">
            {isAdmin
              ? 'No investors yet. Add investor with name and phone number.'
              : 'No investors assigned to your account. Ask admin to assign investor partners.'}
          </div>
        )}
      </div>

      {investorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-sm font-black uppercase mb-2">{investorEdit ? 'Edit Investor' : 'Add Investor'}</h3>
            <p className="text-xs text-slate-400 mb-4">Name and phone number only</p>
            {error && <div className="bg-rose-500/10 text-rose-600 p-3 rounded-xl text-xs mb-4">{error}</div>}
            {success && <div className="bg-emerald-500/10 text-emerald-600 p-3 rounded-xl text-xs mb-4">{success}</div>}
            <form onSubmit={handleInvestorSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Full name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ahmed Khan" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Phone number</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92-300-1234567" className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Notes (optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs resize-none" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setInvestorModal(false); resetInvestorForm(); }} className="flex-1 py-2.5 rounded-xl border text-xs font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold cursor-pointer">{investorEdit ? 'Save' : 'Add investor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modalProps && <ConfirmModal {...modalProps} />}
    </div>
  );
}
