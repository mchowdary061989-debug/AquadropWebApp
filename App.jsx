import React, { useEffect, useState } from 'react'

const sampleCustomers = [
  { id: 'C1', name: 'Ramesh Kumar', phone: '9876543210', email: 'ramesh@example.com', address: 'MG Road, Bengaluru', install_date: '2025-06-01', interval_days: 90, last_service_date: '2025-08-01', lat: 12.9716, long: 77.5946, status: 'active' },
  { id: 'C2', name: 'Suma Devi', phone: '9123456780', email: 'suma@example.com', address: 'Koramangala, Bengaluru', install_date: '2025-07-15', interval_days: 60, last_service_date: '2025-09-01', lat: 12.9352, long: 77.6245, status: 'active' },
  { id: 'C3', name: 'Anil Babu', phone: '9988776655', email: 'anil@example.com', address: 'Jayanagar, Bengaluru', install_date: '2024-11-10', interval_days: 100, last_service_date: '2025-07-01', lat: 12.9279, long: 77.5837, status: 'inactive' },
]

const sampleInventory = [
  { id: 'P1', part_name: 'RO Membrane', quantity: 50, unit_cost: 500, last_updated: '2025-10-01' },
  { id: 'P2', part_name: 'Sediment Filter', quantity: 120, unit_cost: 80, last_updated: '2025-09-20' },
  { id: 'P3', part_name: 'Carbon Filter', quantity: 40, unit_cost: 120, last_updated: '2025-10-05' },
]

export default function App(){
  const [customers, setCustomers] = useState(()=> JSON.parse(localStorage.getItem('ad_customers') || 'null') || sampleCustomers)
  const [inventory, setInventory] = useState(()=> JSON.parse(localStorage.getItem('ad_inventory') || 'null') || sampleInventory)
  const [services, setServices] = useState(()=> JSON.parse(localStorage.getItem('ad_services') || 'null') || [])

  const [view, setView] = useState('dashboard') // dashboard | customers | inventory | reports
  const [filter, setFilter] = useState('All')

  // modal state
  const [customerModalOpen, setCustomerModalOpen] = useState(false)
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false)
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedInventory, setSelectedInventory] = useState(null)

  useEffect(()=>{
    localStorage.setItem('ad_customers', JSON.stringify(customers))
  }, [customers])
  useEffect(()=>{ localStorage.setItem('ad_inventory', JSON.stringify(inventory)) }, [inventory])
  useEffect(()=>{ localStorage.setItem('ad_services', JSON.stringify(services)) }, [services])

  function calcNextServiceDate(customer){
    const base = customer.last_service_date || customer.install_date
    if(!base) return '-'
    const d = new Date(base)
    d.setDate(d.getDate() + Number(customer.interval_days || 0))
    return d.toISOString().slice(0,10)
  }
  function daysUntil(dateStr){
    if(!dateStr) return 9999
    const now = new Date()
    const d = new Date(dateStr + 'T00:00:00')
    return Math.ceil((d - now)/(1000*60*60*24))
  }
  function statusOf(c){
    if(c.status === 'inactive') return 'inactive'
    const nxt = calcNextServiceDate(c)
    const days = daysUntil(nxt)
    if(days <= 7) return 'due'
    if(days <= 15) return 'upcoming'
    return 'good'
  }

  // CRUD - Customers
  function addCustomer(customer){ setCustomers(prev => [customer, ...prev]) }
  function updateCustomer(id, patch){ setCustomers(prev => prev.map(c => c.id === id ? {...c, ...patch} : c)) }
  function deleteCustomer(id){ setCustomers(prev => prev.filter(c => c.id !== id)) }

  // Inventory
  function addInventory(item){ setInventory(prev => [{ ...item, id: 'P' + Date.now(), last_updated: new Date().toISOString().slice(0,10) }, ...prev]) }
  function updateInventory(id, patch){ setInventory(prev => prev.map(i => i.id === id ? {...i, ...patch, last_updated: new Date().toISOString().slice(0,10)} : i)) }
  function deleteInventory(id){ setInventory(prev => prev.filter(i => i.id !== id)) }

  // Services
  function saveService(customerId, entry){
    const s = { id: 'S' + Date.now(), customer_id: customerId, ...entry, updated_at: new Date().toISOString() }
    setServices(prev => [s, ...prev])
    updateCustomer(customerId, { last_service_date: entry.service_date })
    // deduct parts
    const parts = entry.parts_replaced || []
    if(parts.length){
      setInventory(prev => prev.map(p => {
        const found = parts.find(x => x.id === p.id)
        if(!found) return p
        const newQty = Math.max(0, p.quantity - (found.qty || 1))
        return {...p, quantity: newQty, last_updated: new Date().toISOString().slice(0,10)}
      }))
    }
  }

  const counts = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
    due: customers.filter(c => statusOf(c) === 'due').length,
    upcoming: customers.filter(c => statusOf(c) === 'upcoming').length,
    good: customers.filter(c => statusOf(c) === 'good').length,
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AquaDrop</h1>
            <div className="text-sm text-gray-500">Service & Inventory</div>
          </div>
          <nav className="flex gap-2">
            <button className={`px-3 py-1 rounded ${view==='dashboard' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={()=>setView('dashboard')}>Dashboard</button>
            <button className={`px-3 py-1 rounded ${view==='customers' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={()=>setView('customers')}>Customers</button>
            <button className={`px-3 py-1 rounded ${view==='inventory' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={()=>setView('inventory')}>Inventory</button>
            <button className={`px-3 py-1 rounded ${view==='reports' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`} onClick={()=>setView('reports')}>Reports</button>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {view==='dashboard' && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <StatCard title="Total" value={counts.total} />
              <StatCard title="Active" value={counts.active} />
              <StatCard title="Upcoming" value={counts.upcoming} />
              <StatCard title="Due" value={counts.due} />
              <StatCard title="Good" value={counts.good} />
              <StatCard title="Inactive" value={counts.inactive} />
            </div>

            <div className="bg-white p-4 rounded shadow">
              <h3 className="font-semibold mb-2">Recent Services</h3>
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 text-left"><tr><th>Service</th><th>Customer</th><th>Date</th><th>Type</th></tr></thead>
                <tbody>{services.slice(0,8).map(s=>{
                  const cust = customers.find(c=>c.id===s.customer_id) || {name:'-'}
                  return <tr key={s.id} className="border-t"><td className="py-2">{s.id}</td><td>{cust.name}</td><td>{s.service_date}</td><td>{s.type}</td></tr>
                })}</tbody>
              </table>
            </div>
          </div>
        )}

        {view==='customers' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Customers</h2>
              <div className="flex items-center gap-2">
                <select value={filter} onChange={e=>setFilter(e.target.value)} className="border p-2 rounded">
                  <option>All</option><option>Upcoming</option><option>Due</option><option>Good</option><option>Inactive</option>
                </select>
                <button className="bg-green-600 text-white px-3 py-2 rounded" onClick={()=>{ setSelectedCustomer(null); setCustomerModalOpen(true) }}>+ Add Customer</button>
              </div>
            </div>

            <div className="grid gap-3">
              {customers.filter(c=>{
  if(filter==='All') return c.status === 'active'   // ✅ Only show active customers
  if(filter==='Inactive') return c.status === 'inactive'
  const s = statusOf(c)
  if(c.status !== 'active') return false            // ✅ Exclude inactive from other filters
  if(filter==='Due') return s==='due'
  if(filter==='Upcoming') return s==='upcoming'
  if(filter==='Good') return s==='good'
  return true
              }).map(c=>(
                <div key={c.id} className="bg-white p-3 rounded shadow flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${statusOf(c)==='due' ? 'bg-red-400' : statusOf(c)==='upcoming' ? 'bg-yellow-300' : statusOf(c)==='good' ? 'bg-green-400' : 'bg-gray-400'}`} />
                    <div>
                      <div className="font-semibold">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.phone} • {c.address}</div>
                      <div className="text-xs text-gray-500">Next: {calcNextServiceDate(c)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="px-2 py-1 border rounded text-sm" onClick={()=>{ setSelectedCustomer(c); setCustomerModalOpen(true) }}>View / Edit</button>
                    <button className="px-2 py-1 border rounded text-sm" onClick={()=>{ setSelectedCustomer(c); setServiceModalOpen(true) }}>Service</button>
                    <button className="px-2 py-1 border rounded text-sm" onClick={()=>updateCustomer(c.id, { status: c.status==='active' ? 'inactive' : 'active' })}>{c.status==='active' ? 'Deactivate' : 'Activate'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view==='inventory' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Inventory</h2>
              <div>
                <button className="bg-blue-600 text-white px-3 py-2 rounded" onClick={()=>{ setSelectedInventory(null); setInventoryModalOpen(true) }}>+ Add Part</button>
              </div>
            </div>

            <div className="bg-white rounded shadow p-3 overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 text-left"><tr><th>Part Name</th><th>Quantity</th><th>Unit Cost</th><th>Last Updated</th><th>Actions</th></tr></thead>
                <tbody>
                  {inventory.map(i=>(
                    <tr key={i.id} className="border-t">
                      <td className="py-2">{i.part_name}</td>
                      <td className="py-2">{i.quantity}</td>
                      <td className="py-2">₹{i.unit_cost}</td>
                      <td className="py-2">{i.last_updated}</td>
                      <td className="py-2">
                        <div className="flex gap-2">
                          <button className="px-2 py-1 border rounded text-sm" onClick={()=>{ setSelectedInventory(i); setInventoryModalOpen(true) }}>Edit</button>
                          <button className="px-2 py-1 border rounded text-sm" onClick={()=>{ if(confirm('Delete part?')) deleteInventory(i.id) }}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view==='reports' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Reports (placeholders)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded shadow">Service summary by month/customer</div>
              <div className="bg-white p-4 rounded shadow">Spare parts usage report</div>
              <div className="bg-white p-4 rounded shadow">Low stock & consumption tracking</div>
              <div className="bg-white p-4 rounded shadow">Pending / due services list</div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {customerModalOpen && <CustomerModal onClose={()=>{ setCustomerModalOpen(false); setSelectedCustomer(null) }} onSave={(data)=>{ if(data.id) updateCustomer(data.id, data); else addCustomer({...data, id: 'C' + Date.now()}); setCustomerModalOpen(false); setSelectedCustomer(null) }} customer={selectedCustomer} />}
      {inventoryModalOpen && <InventoryModal onClose={()=>{ setInventoryModalOpen(false); setSelectedInventory(null) }} onSave={(data)=>{ if(data.id) updateInventory(data.id, data); else addInventory(data); setInventoryModalOpen(false); setSelectedInventory(null) }} item={selectedInventory} />}
      {serviceModalOpen && <ServiceModal onClose={()=>{ setServiceModalOpen(false); setSelectedCustomer(null) }} customer={selectedCustomer} inventory={inventory} onSave={(entry)=>{ saveService(selectedCustomer.id, entry); setServiceModalOpen(false); setSelectedCustomer(null) }} services={services} />}
    </div>
  )
}

function StatCard({title, value}){ return <div className="bg-white p-4 rounded shadow"><div className="text-xs text-gray-500">{title}</div><div className="text-2xl font-bold">{value}</div></div> }

// Customer Modal
function CustomerModal({onClose, onSave, customer}){
  const [form, setForm] = useState(() => customer ? {...customer} : { name:'', phone:'', email:'', address:'', install_date: new Date().toISOString().slice(0,10), interval_days:90, last_service_date:'', lat:'', long:'', status:'active' })

  function handleChange(e){ const {name, value} = e.target; setForm(prev=>({...prev, [name]: value})) }
  function submit(){ onSave(form) }

  return (
    <div className="fixed inset-0 flex items-center justify-center modal-bg bg-black bg-opacity-30 z-50">
      <div className="bg-white rounded p-4 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">{customer ? 'Edit Customer' : 'Add Customer'}</h3><button onClick={onClose} className="text-sm">Close</button></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs">Name<input name="name" value={form.name} onChange={handleChange} className="w-full border rounded p-1" /></label>
          <label className="text-xs">Phone<input name="phone" value={form.phone} onChange={handleChange} className="w-full border rounded p-1" /></label>
          <label className="text-xs">Email<input name="email" value={form.email} onChange={handleChange} className="w-full border rounded p-1" /></label>
          <label className="text-xs">Address<input name="address" value={form.address} onChange={handleChange} className="w-full border rounded p-1" /></label>
          <label className="text-xs">Install Date<input type="date" name="install_date" value={form.install_date} onChange={handleChange} className="w-full border rounded p-1" /></label>
          <label className="text-xs">Interval (days)<input type="number" name="interval_days" value={form.interval_days} onChange={handleChange} className="w-full border rounded p-1" /></label>
          <label className="text-xs">Last Service Date<input type="date" name="last_service_date" value={form.last_service_date} onChange={handleChange} className="w-full border rounded p-1" /></label>
          <label className="text-xs">Latitude<input name="lat" value={form.lat} onChange={handleChange} className="w-full border rounded p-1" /></label>
          <label className="text-xs">Longitude<input name="long" value={form.long} onChange={handleChange} className="w-full border rounded p-1" /></label>
          <label className="text-xs">Status<select name="status" value={form.status} onChange={handleChange} className="w-full border rounded p-1"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
        </div>
        <div className="mt-4 flex justify-end gap-2"><button onClick={onClose} className="px-3 py-2 border rounded">Cancel</button><button onClick={submit} className="px-3 py-2 bg-green-600 text-white rounded">Save</button></div>
        <div className="mt-6">
          <h4 className="font-semibold mb-2">Service History</h4>
          <CustomerServiceHistory customerId={customer?.id} />
        </div>
      </div>
    </div>
  )
}

// Inventory Modal
function InventoryModal({onClose, onSave, item}){
  const [form, setForm] = useState(()=> item ? {...item} : { part_name:'', quantity:0, unit_cost:0 })

  function handleChange(e){ const {name, value} = e.target; setForm(prev=>({...prev, [name]: value})) }
  function submit(){ onSave(form) }

  return (
    <div className="fixed inset-0 flex items-center justify-center modal-bg bg-black bg-opacity-30 z-50">
      <div className="bg-white rounded p-4 w-full max-w-md">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">{item ? 'Edit Part' : 'Add Part'}</h3><button onClick={onClose} className="text-sm">Close</button></div>
        <div className="grid gap-3">
          <label className="text-xs">Part Name<input name="part_name" value={form.part_name} onChange={handleChange} className="w-full border rounded p-1" /></label>
          <label className="text-xs">Quantity<input type="number" name="quantity" value={form.quantity} onChange={handleChange} className="w-full border rounded p-1" /></label>
          <label className="text-xs">Unit Cost<input type="number" name="unit_cost" value={form.unit_cost} onChange={handleChange} className="w-full border rounded p-1" /></label>
        </div>
        <div className="mt-4 flex justify-end gap-2"><button onClick={onClose} className="px-3 py-2 border rounded">Cancel</button><button onClick={submit} className="px-3 py-2 bg-blue-600 text-white rounded">Save</button></div>
      </div>
    </div>
  )
}

// Service Modal
function ServiceModal({onClose, customer, inventory, onSave, services}){
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().slice(0,10))
  const [type, setType] = useState('Basic')
  const [parts, setParts] = useState([]) // {id, name, qty}
  const [remarks, setRemarks] = useState('')

  function togglePart(p){
    const found = parts.find(x=>x.id===p.id)
    if(found) setParts(parts.filter(x=>x.id!==p.id))
    else setParts([...parts, { id: p.id, name: p.part_name, qty: 1 }])
  }
  function updatePartQty(id, qty){ setParts(parts.map(x=> x.id===id ? {...x, qty: Number(qty)} : x)) }

  function submit(){
    onSave({ service_date: serviceDate, type, parts_replaced: parts, remarks, technician: 'Tech1' })
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center modal-bg bg-black bg-opacity-30 z-50">
      <div className="bg-white rounded p-4 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4"><h3 className="text-lg font-semibold">Service - {customer?.name}</h3><button onClick={onClose} className="text-sm">Close</button></div>
        <div className="grid gap-3">
          <label className="text-xs">Service Date<input type="date" value={serviceDate} onChange={e=>setServiceDate(e.target.value)} className="w-full border rounded p-1" /></label>
          <label className="text-xs">Type<select value={type} onChange={e=>setType(e.target.value)} className="w-full border rounded p-1"><option>Basic</option><option>Full</option></select></label>
          <div>
            <div className="text-sm font-semibold mb-2">Parts Replaced (click Add)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {inventory.map(p=>{
                const sel = parts.find(x=>x.id===p.id)
                return (
                  <div key={p.id} className="p-2 border rounded flex items-center justify-between">
                    <div><div className="font-semibold">{p.part_name}</div><div className="text-xs text-gray-500">Available: {p.quantity}</div></div>
                    <div className="flex items-center gap-2">
                      <button className={`px-2 py-1 border rounded ${sel ? 'bg-gray-200':''}`} onClick={()=>togglePart(p)}>{sel ? 'Added' : 'Add'}</button>
                      {sel && <input className="w-16 border rounded p-1" type="number" value={sel.qty} onChange={e=>updatePartQty(p.id, e.target.value)} />}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          <label className="text-xs">Remarks<textarea value={remarks} onChange={e=>setRemarks(e.target.value)} className="w-full border rounded p-1" /></label>
          <div className="flex justify-end gap-2"><button onClick={onClose} className="px-3 py-2 border rounded">Cancel</button><button onClick={submit} className="px-3 py-2 bg-green-600 text-white rounded">Save Service</button></div>
        </div>
      </div>
    </div>
  )
}

// Service history inside customer modal
function CustomerServiceHistory({customerId}){
  const services = JSON.parse(localStorage.getItem('ad_services') || '[]').filter(s=>s.customer_id === customerId)
  if(!services.length) return <div className="text-sm text-gray-500">No services yet.</div>
  return (
    <table className="w-full text-sm">
      <thead className="text-xs text-gray-500 text-left"><tr><th>Date</th><th>Type</th><th>Parts</th><th>Remarks</th></tr></thead>
      <tbody>{services.map(s=> <tr key={s.id} className="border-t"><td className="py-2">{s.service_date}</td><td>{s.type}</td><td>{(s.parts_replaced||[]).map(p=>p.name + ' x' + p.qty).join(', ')}</td><td>{s.remarks}</td></tr>)}</tbody>
    </table>
  )
}
