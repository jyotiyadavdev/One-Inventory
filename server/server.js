import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database (for demo purposes)
let assets = [
  {
    id: 1,
    asset_tag: 'AC-001',
    name: 'HVAC Unit - Building A',
    category: 'HVAC',
    location: 'Building A - Roof',
    status: 'active',
    purchase_date: '2023-01-15',
    purchase_cost: 12500.00,
    warranty_expiry: '2028-01-15',
    manufacturer: 'Carrier',
    model: '48TC-D07',
    serial_number: 'CR123456',
    qr_code: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    asset_tag: 'AC-002',
    name: 'HVAC Unit - Building B',
    category: 'HVAC',
    location: 'Building B - Roof',
    status: 'active',
    purchase_date: '2023-03-20',
    purchase_cost: 11800.00,
    warranty_expiry: '2028-03-20',
    manufacturer: 'Trane',
    model: 'YCD060',
    serial_number: 'TR789012',
    qr_code: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    asset_tag: 'EL-001',
    name: 'Main Electrical Panel',
    category: 'Electrical',
    location: 'Building A - Basement',
    status: 'active',
    purchase_date: '2022-06-10',
    purchase_cost: 3500.00,
    warranty_expiry: '2027-06-10',
    manufacturer: 'Siemens',
    model: 'P1-400A',
    serial_number: 'SM345678',
    qr_code: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    asset_tag: 'IT-001',
    name: 'Server Rack - Core Switch',
    category: 'IT',
    location: 'Server Room',
    status: 'active',
    purchase_date: '2024-01-05',
    purchase_cost: 4200.00,
    warranty_expiry: '2029-01-05',
    manufacturer: 'Cisco',
    model: 'Catalyst 9300',
    serial_number: 'CS901234',
    qr_code: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let tickets = [
  {
    id: 1,
    ticket_number: 'TKT-001',
    title: 'AC not cooling properly',
    description: 'Building A AC is blowing warm air',
    category: 'HVAC',
    priority: 'high',
    status: 'new',
    asset_id: 1,
    location: 'Building A',
    reported_by: 1,
    assigned_to: null,
    sla_response_due: new Date(Date.now() + 3600000).toISOString(),
    sla_resolution_due: new Date(Date.now() + 86400000).toISOString(),
    resolved_at: null,
    closed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    ticket_number: 'TKT-002',
    title: 'Flickering lights',
    description: 'Lights in corridor keep flickering',
    category: 'Electrical',
    priority: 'medium',
    status: 'in_progress',
    asset_id: 3,
    location: 'Building A - 2nd Floor',
    reported_by: 1,
    assigned_to: null,
    sla_response_due: new Date(Date.now() + 86400000).toISOString(),
    sla_resolution_due: new Date(Date.now() + 172800000).toISOString(),
    resolved_at: null,
    closed_at: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    ticket_number: 'TKT-003',
    title: 'Network outage',
    description: 'Unable to connect to internet',
    category: 'IT',
    priority: 'critical',
    status: 'assigned',
    asset_id: 4,
    location: 'Server Room',
    reported_by: 1,
    assigned_to: 2,
    sla_response_due: new Date(Date.now() + 3600000).toISOString(),
    sla_resolution_due: new Date(Date.now() + 14400000).toISOString(),
    resolved_at: null,
    closed_at: null,
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: new Date().toISOString()
  }
];

let ticketComments = [
  {
    id: 1,
    ticket_id: 2,
    user_id: 1,
    comment: 'Electrician has been notified',
    created_at: new Date(Date.now() - 43200000).toISOString()
  }
];

let nextAssetId = 5;
let nextTicketId = 4;
let nextCommentId = 2;

// Helper function to get asset with tickets
const getAssetWithTickets = (assetId) => {
  const asset = assets.find(a => a.id === parseInt(assetId));
  if (!asset) return null;
  const assetTickets = tickets.filter(t => t.asset_id === parseInt(assetId));
  return { ...asset, tickets: assetTickets };
};

// Assets Routes
app.get('/api/assets', (req, res) => {
  res.json(assets);
});

app.get('/api/assets/:id', (req, res) => {
  const asset = getAssetWithTickets(req.params.id);
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }
  res.json(asset);
});

app.post('/api/assets', (req, res) => {
  const newAsset = {
    id: nextAssetId++,
    ...req.body,
    qr_code: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  assets.push(newAsset);
  res.status(201).json(newAsset);
});

app.put('/api/assets/:id', (req, res) => {
  const index = assets.findIndex(a => a.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Asset not found' });
  }
  assets[index] = { ...assets[index], ...req.body, updated_at: new Date().toISOString() };
  res.json(assets[index]);
});

app.post('/api/assets/:id/generate-qr', (req, res) => {
  const asset = assets.find(a => a.id === parseInt(req.params.id));
  if (!asset) {
    return res.status(404).json({ error: 'Asset not found' });
  }
  const qrData = JSON.stringify({
    asset_id: asset.id,
    asset_tag: asset.asset_tag,
    name: asset.name,
    location: asset.location
  });
  const qrCode = `data:image/svg+xml,${encodeURIComponent(qrData)}`;
  res.json({ qr_code: qrCode });
});

// Tickets Routes
app.get('/api/tickets', (req, res) => {
  const ticketsWithDetails = tickets.map(ticket => ({
    ...ticket,
    asset_name: assets.find(a => a.id === ticket.asset_id)?.name
  }));
  res.json(ticketsWithDetails);
});

app.get('/api/tickets/:id', (req, res) => {
  const ticket = tickets.find(t => t.id === parseInt(req.params.id));
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  const comments = ticketComments.filter(c => c.ticket_id === ticket.id);
  res.json({
    ...ticket,
    asset_name: assets.find(a => a.id === ticket.asset_id)?.name,
    comments: comments
  });
});

app.post('/api/tickets', (req, res) => {
  const { title, description, category, priority, asset_id, location, reported_by } = req.body;
  
  const ticketNumber = `TKT-${Date.now()}`;
  
  const slaResponseHours = priority === 'critical' ? 1 : priority === 'high' ? 4 : priority === 'medium' ? 24 : 48;
  const slaResolutionHours = priority === 'critical' ? 4 : priority === 'high' ? 24 : priority === 'medium' ? 72 : 120;
  
  const slaResponseDue = new Date();
  slaResponseDue.setHours(slaResponseDue.getHours() + slaResponseHours);
  
  const slaResolutionDue = new Date();
  slaResolutionDue.setHours(slaResolutionDue.getHours() + slaResolutionHours);
  
  const newTicket = {
    id: nextTicketId++,
    ticket_number: ticketNumber,
    title,
    description: description || '',
    category: category || 'facilities',
    priority: priority || 'medium',
    status: 'new',
    asset_id: asset_id || null,
    location: location || '',
    reported_by: reported_by || 1,
    assigned_to: null,
    sla_response_due: slaResponseDue.toISOString(),
    sla_resolution_due: slaResolutionDue.toISOString(),
    resolved_at: null,
    closed_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  tickets.push(newTicket);
  res.status(201).json(newTicket);
});

app.patch('/api/tickets/:id/status', (req, res) => {
  const { status, assigned_to } = req.body;
  const index = tickets.findIndex(t => t.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  
  tickets[index].status = status;
  tickets[index].updated_at = new Date().toISOString();
  
  if (status === 'resolved') {
    tickets[index].resolved_at = new Date().toISOString();
  } else if (status === 'closed') {
    tickets[index].closed_at = new Date().toISOString();
  }
  
  if (assigned_to) {
    tickets[index].assigned_to = assigned_to;
  }
  
  res.json(tickets[index]);
});

app.post('/api/tickets/:id/comments', (req, res) => {
  const { comment, user_id } = req.body;
  const ticketId = parseInt(req.params.id);
  
  const newComment = {
    id: nextCommentId++,
    ticket_id: ticketId,
    user_id: user_id || 1,
    comment: comment,
    full_name: user_id === 1 ? 'System Admin' : 'Facilities Manager',
    created_at: new Date().toISOString()
  };
  
  ticketComments.push(newComment);
  
  // Update ticket updated_at
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);
  if (ticketIndex !== -1) {
    tickets[ticketIndex].updated_at = new Date().toISOString();
  }
  
  res.status(201).json(newComment);
});

// Auth Routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Demo users
  const users = [
    { id: 1, email: 'admin@pfg.com', full_name: 'System Admin', role: 'admin' },
    { id: 2, email: 'facilities@pfg.com', full_name: 'Facilities Manager', role: 'manager' },
    { id: 3, email: 'tech@pfg.com', full_name: 'Maintenance Tech', role: 'staff' }
  ];
  
  const user = users.find(u => u.email === email);
  
  if (user) {
    const token = 'demo-jwt-token-' + Date.now();
    res.json({
      token,
      user
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials. Use admin@pfg.com with any password.' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), assets: assets.length, tickets: tickets.length });
});



// ============ PURCHASE ORDER MODULE ============

let purchaseOrders = [
  {
    id: 1,
    po_number: 'PO-2024-001',
    title: 'HVAC Maintenance Contract',
    description: 'Annual maintenance contract for all HVAC units',
    vendor: 'Carrier Services',
    vendor_contact: 'john@carrier.com',
    order_date: '2024-01-15',
    delivery_date: '2024-01-30',
    status: 'approved',
    total_amount: 12500.00,
    currency: 'GBP',
    department: 'Facilities',
    budget_code: 'FAC-2024-01',
    requested_by: 1,
    approved_by: 1,
    approved_at: '2024-01-16T10:30:00Z',
    items: [
      {
        id: 1,
        description: 'HVAC filter replacement kit',
        quantity: 4,
        unit_price: 250.00,
        total: 1000.00
      },
      {
        id: 2,
        description: 'Labor - Annual service',
        quantity: 20,
        unit_price: 575.00,
        total: 11500.00
      }
    ],
    asset_id: 1,
    created_at: '2024-01-15T09:00:00Z',
    updated_at: '2024-01-16T10:30:00Z'
  },
  {
    id: 2,
    po_number: 'PO-2024-002',
    title: 'IT Network Equipment',
    description: 'Cisco network switches for server room upgrade',
    vendor: 'Cisco Systems',
    vendor_contact: 'sales@cisco.com',
    order_date: '2024-02-10',
    delivery_date: '2024-02-25',
    status: 'pending_approval',
    total_amount: 4200.00,
    currency: 'GBP',
    department: 'IT',
    budget_code: 'IT-2024-02',
    requested_by: 1,
    approved_by: null,
    approved_at: null,
    items: [
      {
        id: 1,
        description: 'Cisco Catalyst 9300 Switch',
        quantity: 1,
        unit_price: 3800.00,
        total: 3800.00
      },
      {
        id: 2,
        description: 'SFP+ Transceiver Modules',
        quantity: 4,
        unit_price: 100.00,
        total: 400.00
      }
    ],
    asset_id: 4,
    created_at: '2024-02-10T14:20:00Z',
    updated_at: '2024-02-10T14:20:00Z'
  },
  {
    id: 3,
    po_number: 'PO-2024-003',
    title: 'Electrical Panel Upgrade',
    description: 'Upgrade main electrical panel components',
    vendor: 'Siemens Electrical',
    vendor_contact: 'support@siemens.com',
    order_date: '2024-03-01',
    delivery_date: '2024-03-15',
    status: 'draft',
    total_amount: 3500.00,
    currency: 'GBP',
    department: 'Facilities',
    budget_code: 'FAC-2024-03',
    requested_by: 1,
    approved_by: null,
    approved_at: null,
    items: [
      {
        id: 1,
        description: 'Circuit breaker panel upgrade kit',
        quantity: 1,
        unit_price: 2500.00,
        total: 2500.00
      },
      {
        id: 2,
        description: 'Installation labor',
        quantity: 8,
        unit_price: 125.00,
        total: 1000.00
      }
    ],
    asset_id: 3,
    created_at: '2024-03-01T11:15:00Z',
    updated_at: '2024-03-01T11:15:00Z'
  }
];

let nextPoId = 4;

// Get all purchase orders
app.get('/api/purchase-orders', (req, res) => {
  const poWithDetails = purchaseOrders.map(po => ({
    ...po,
    asset_name: assets.find(a => a.id === po.asset_id)?.name,
    total_items: po.items.length
  }));
  res.json(poWithDetails);
});

// Get single purchase order
app.get('/api/purchase-orders/:id', (req, res) => {
  const po = purchaseOrders.find(p => p.id === parseInt(req.params.id));
  if (!po) {
    return res.status(404).json({ error: 'Purchase order not found' });
  }
  res.json(po);
});

// Create purchase order
app.post('/api/purchase-orders', (req, res) => {
  const {
    title,
    description,
    vendor,
    vendor_contact,
    delivery_date,
    total_amount,
    department,
    budget_code,
    items,
    asset_id
  } = req.body;

  const poNumber = `PO-${new Date().getFullYear()}-${String(purchaseOrders.length + 1).padStart(3, '0')}`;
  
  const newPO = {
    id: nextPoId++,
    po_number: poNumber,
    title,
    description: description || '',
    vendor,
    vendor_contact: vendor_contact || '',
    order_date: new Date().toISOString().split('T')[0],
    delivery_date: delivery_date || null,
    status: 'draft',
    total_amount: total_amount || 0,
    currency: 'GBP',
    department: department || 'General',
    budget_code: budget_code || '',
    requested_by: 1,
    approved_by: null,
    approved_at: null,
    items: items || [],
    asset_id: asset_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  purchaseOrders.push(newPO);
  res.status(201).json(newPO);
});

// Update PO status
app.patch('/api/purchase-orders/:id/status', (req, res) => {
  const { status } = req.body;
  const index = purchaseOrders.findIndex(p => p.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Purchase order not found' });
  }

  purchaseOrders[index].status = status;
  purchaseOrders[index].updated_at = new Date().toISOString();
  
  if (status === 'approved' && !purchaseOrders[index].approved_by) {
    purchaseOrders[index].approved_by = 1;
    purchaseOrders[index].approved_at = new Date().toISOString();
  }

  res.json(purchaseOrders[index]);
});

// Delete purchase order
app.delete('/api/purchase-orders/:id', (req, res) => {
  const index = purchaseOrders.findIndex(p => p.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Purchase order not found' });
  }
  
  if (purchaseOrders[index].status !== 'draft') {
    return res.status(400).json({ error: 'Only draft POs can be deleted' });
  }
  
  purchaseOrders.splice(index, 1);
  res.status(204).send();
});

// Get PO statistics
app.get('/api/purchase-orders/stats/summary', (req, res) => {
  const stats = {
    total: purchaseOrders.length,
    draft: purchaseOrders.filter(p => p.status === 'draft').length,
    pending_approval: purchaseOrders.filter(p => p.status === 'pending_approval').length,
    approved: purchaseOrders.filter(p => p.status === 'approved').length,
    total_value: purchaseOrders.reduce((sum, p) => sum + p.total_amount, 0),
    pending_value: purchaseOrders
      .filter(p => p.status === 'pending_approval')
      .reduce((sum, p) => sum + p.total_amount, 0)
  };
  res.json(stats);
});



// ============ VENDOR MANAGEMENT MODULE ============

let vendors = [
  {
    id: 1,
    vendor_code: 'VEN-001',
    name: 'Carrier Services',
    company_name: 'Carrier UK Ltd',
    contact_person: 'John Smith',
    email: 'john.smith@carrier.com',
    phone: '+44 20 1234 5678',
    mobile: '+44 77 1234 5678',
    address: '123 Industrial Park, London, UK',
    city: 'London',
    postcode: 'E1 6AN',
    country: 'UK',
    category: 'HVAC',
    tax_id: 'GB123456789',
    payment_terms: 'Net 30',
    bank_details: {
      bank_name: 'Barclays',
      account_name: 'Carrier Services',
      account_number: '12345678',
      sort_code: '20-00-00'
    },
    status: 'active',
    rating: 4.5,
    contracts: [1],
    notes: 'Preferred HVAC supplier',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    vendor_code: 'VEN-002',
    name: 'Cisco Systems',
    company_name: 'Cisco Systems UK',
    contact_person: 'Sarah Johnson',
    email: 'sarah.johnson@cisco.com',
    phone: '+44 20 8765 4321',
    mobile: '+44 78 8765 4321',
    address: '56 Technology Park, London, UK',
    city: 'London',
    postcode: 'EC2A 2FA',
    country: 'UK',
    category: 'IT',
    tax_id: 'GB987654321',
    payment_terms: 'Net 45',
    bank_details: {
      bank_name: 'HSBC',
      account_name: 'Cisco Systems UK',
      account_number: '87654321',
      sort_code: '40-00-00'
    },
    status: 'active',
    rating: 4.8,
    contracts: [2],
    notes: 'Network equipment supplier',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    vendor_code: 'VEN-003',
    name: 'Siemens Electrical',
    company_name: 'Siemens UK',
    contact_person: 'Michael Brown',
    email: 'michael.brown@siemens.com',
    phone: '+44 20 3456 7890',
    mobile: '+44 79 3456 7890',
    address: '45 Power House Road, Manchester, UK',
    city: 'Manchester',
    postcode: 'M1 2AB',
    country: 'UK',
    category: 'Electrical',
    tax_id: 'GB456789123',
    payment_terms: 'Net 30',
    bank_details: {
      bank_name: 'Lloyds',
      account_name: 'Siemens UK',
      account_number: '34567890',
      sort_code: '30-00-00'
    },
    status: 'active',
    rating: 4.2,
    contracts: [3],
    notes: 'Electrical components supplier',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let contracts = [
  {
    id: 1,
    contract_number: 'CT-2024-001',
    vendor_id: 1,
    title: 'HVAC Maintenance Contract',
    description: 'Annual maintenance and repair service for all HVAC units',
    type: 'Maintenance',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    value: 25000.00,
    currency: 'GBP',
    status: 'active',
    auto_renew: true,
    documents: ['contract_hvac_2024.pdf'],
    service_level: {
      response_time: '4 hours',
      resolution_time: '24 hours',
      uptime_guarantee: '99.5%'
    },
    terms: 'Standard terms and conditions apply',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    contract_number: 'CT-2024-002',
    vendor_id: 2,
    title: 'IT Hardware Supply Contract',
    description: 'Supply of network equipment and hardware',
    type: 'Supply',
    start_date: '2024-02-01',
    end_date: '2025-01-31',
    value: 75000.00,
    currency: 'GBP',
    status: 'active',
    auto_renew: false,
    documents: ['it_supply_contract.pdf'],
    service_level: {
      response_time: '24 hours',
      resolution_time: '5 days',
      uptime_guarantee: 'N/A'
    },
    terms: 'Payment within 45 days of invoice',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    contract_number: 'CT-2024-003',
    vendor_id: 3,
    title: 'Electrical Panel Maintenance',
    description: 'Preventive maintenance for electrical panels',
    type: 'Maintenance',
    start_date: '2024-03-01',
    end_date: '2025-02-28',
    value: 15000.00,
    currency: 'GBP',
    status: 'pending',
    auto_renew: true,
    documents: [],
    service_level: {
      response_time: '8 hours',
      resolution_time: '48 hours',
      uptime_guarantee: '98%'
    },
    terms: 'Monthly payment terms',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let nextVendorId = 4;
let nextContractId = 4;

// Get all vendors
app.get('/api/vendors', (req, res) => {
  const vendorsWithContracts = vendors.map(vendor => ({
    ...vendor,
    contract_count: contracts.filter(c => c.vendor_id === vendor.id).length,
    active_contracts: contracts.filter(c => c.vendor_id === vendor.id && c.status === 'active').length
  }));
  res.json(vendorsWithContracts);
});

// Get single vendor with contracts
app.get('/api/vendors/:id', (req, res) => {
  const vendor = vendors.find(v => v.id === parseInt(req.params.id));
  if (!vendor) {
    return res.status(404).json({ error: 'Vendor not found' });
  }
  const vendorContracts = contracts.filter(c => c.vendor_id === vendor.id);
  res.json({ ...vendor, contracts: vendorContracts });
});

// Create vendor
app.post('/api/vendors', (req, res) => {
  const {
    name,
    company_name,
    contact_person,
    email,
    phone,
    address,
    city,
    postcode,
    country,
    category,
    tax_id,
    payment_terms
  } = req.body;

  const vendorCode = `VEN-${String(vendors.length + 1).padStart(3, '0')}`;
  
  const newVendor = {
    id: nextVendorId++,
    vendor_code: vendorCode,
    name,
    company_name: company_name || name,
    contact_person: contact_person || '',
    email: email || '',
    phone: phone || '',
    mobile: '',
    address: address || '',
    city: city || '',
    postcode: postcode || '',
    country: country || 'UK',
    category: category || 'General',
    tax_id: tax_id || '',
    payment_terms: payment_terms || 'Net 30',
    bank_details: {},
    status: 'active',
    rating: 0,
    contracts: [],
    notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  vendors.push(newVendor);
  res.status(201).json(newVendor);
});

// Update vendor
app.put('/api/vendors/:id', (req, res) => {
  const index = vendors.findIndex(v => v.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Vendor not found' });
  }
  
  vendors[index] = {
    ...vendors[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  
  res.json(vendors[index]);
});

// Get all contracts
app.get('/api/contracts', (req, res) => {
  const contractsWithVendors = contracts.map(contract => ({
    ...contract,
    vendor_name: vendors.find(v => v.id === contract.vendor_id)?.name,
    days_remaining: contract.end_date ? Math.ceil((new Date(contract.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null
  }));
  res.json(contractsWithVendors);
});

// Get single contract
app.get('/api/contracts/:id', (req, res) => {
  const contract = contracts.find(c => c.id === parseInt(req.params.id));
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }
  const vendor = vendors.find(v => v.id === contract.vendor_id);
  res.json({ ...contract, vendor });
});

// Create contract
app.post('/api/contracts', (req, res) => {
  const {
    vendor_id,
    title,
    description,
    type,
    start_date,
    end_date,
    value,
    currency,
    auto_renew,
    service_level,
    terms
  } = req.body;

  const contractNumber = `CT-${new Date().getFullYear()}-${String(contracts.length + 1).padStart(3, '0')}`;
  
  const newContract = {
    id: nextContractId++,
    contract_number: contractNumber,
    vendor_id,
    title,
    description: description || '',
    type: type || 'Service',
    start_date: start_date || new Date().toISOString().split('T')[0],
    end_date: end_date || null,
    value: value || 0,
    currency: currency || 'GBP',
    status: 'active',
    auto_renew: auto_renew || false,
    documents: [],
    service_level: service_level || {},
    terms: terms || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  contracts.push(newContract);
  
  // Update vendor's contracts list
  const vendorIndex = vendors.findIndex(v => v.id === vendor_id);
  if (vendorIndex !== -1) {
    vendors[vendorIndex].contracts.push(newContract.id);
  }
  
  res.status(201).json(newContract);
});

// Update contract status
app.patch('/api/contracts/:id/status', (req, res) => {
  const { status } = req.body;
  const index = contracts.findIndex(c => c.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  contracts[index].status = status;
  contracts[index].updated_at = new Date().toISOString();
  res.json(contracts[index]);
});

// Get vendor statistics
app.get('/api/vendors/stats/summary', (req, res) => {
  const stats = {
    total_vendors: vendors.length,
    active_vendors: vendors.filter(v => v.status === 'active').length,
    total_contracts: contracts.length,
    active_contracts: contracts.filter(c => c.status === 'active').length,
    contracts_expiring_soon: contracts.filter(c => {
      if (!c.end_date || c.status !== 'active') return false;
      const daysRemaining = Math.ceil((new Date(c.end_date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysRemaining <= 30 && daysRemaining > 0;
    }).length,
    total_contract_value: contracts.reduce((sum, c) => sum + c.value, 0)
  };
  res.json(stats);
});




// ============ COMPLIANCE MANAGEMENT MODULE ============

let complianceRecords = [
  {
    id: 1,
    compliance_number: 'CMP-2024-001',
    title: 'Fire Safety Certificate - Building A',
    type: 'Certificate',
    category: 'Fire Safety',
    description: 'Annual fire safety inspection certificate',
    status: 'active',
    priority: 'high',
    issue_date: '2024-01-15',
    expiry_date: '2025-01-14',
    reminder_days: 30,
    issuing_authority: 'London Fire Brigade',
    document_url: '/documents/fire_cert_a.pdf',
    reference_number: 'FS-2024-001',
    asset_id: 1,
    vendor_id: null,
    assigned_to: 1,
    requirements: [
      'Smoke detectors tested',
      'Fire extinguishers inspected',
      'Emergency lighting checked'
    ],
    notes: 'All fire safety equipment in compliance',
    last_inspection_date: '2024-01-15',
    next_inspection_date: '2025-01-15',
    inspection_frequency: 'annual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    compliance_number: 'CMP-2024-002',
    title: 'Electrical Safety Certificate',
    type: 'Certificate',
    category: 'Electrical Safety',
    description: 'Periodic electrical inspection report',
    status: 'active',
    priority: 'high',
    issue_date: '2024-02-01',
    expiry_date: '2025-01-31',
    reminder_days: 45,
    issuing_authority: 'NICEIC',
    document_url: '/documents/electrical_cert.pdf',
    reference_number: 'EICR-2024-002',
    asset_id: 3,
    vendor_id: 3,
    assigned_to: 1,
    requirements: [
      'Circuit breakers tested',
      'Earthing verified',
      'Insulation resistance checked'
    ],
    notes: 'All electrical systems compliant',
    last_inspection_date: '2024-02-01',
    next_inspection_date: '2025-02-01',
    inspection_frequency: 'annual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    compliance_number: 'CMP-2024-003',
    title: 'HVAC Maintenance Permit',
    type: 'Permit',
    category: 'HVAC',
    description: 'Annual HVAC system operation permit',
    status: 'expiring_soon',
    priority: 'medium',
    issue_date: '2024-03-01',
    expiry_date: '2024-04-15',
    reminder_days: 15,
    issuing_authority: 'Environmental Agency',
    document_url: '/documents/hvac_permit.pdf',
    reference_number: 'HVAC-P-2024-003',
    asset_id: 1,
    vendor_id: 1,
    assigned_to: 2,
    requirements: [
      'Gas pressure test',
      'Refrigerant check',
      'Emissions test'
    ],
    notes: 'Renewal application in progress',
    last_inspection_date: '2024-03-01',
    next_inspection_date: '2024-04-15',
    inspection_frequency: 'annual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    compliance_number: 'CMP-2024-004',
    title: 'Lift Safety Inspection',
    type: 'Inspection',
    category: 'Lift Safety',
    description: 'Bi-annual lift safety inspection',
    status: 'expired',
    priority: 'critical',
    issue_date: '2023-10-01',
    expiry_date: '2024-03-30',
    reminder_days: 30,
    issuing_authority: 'Lift Safety Authority',
    document_url: '/documents/lift_inspection.pdf',
    reference_number: 'LIFT-2023-004',
    asset_id: null,
    vendor_id: null,
    assigned_to: 1,
    requirements: [
      'Load test completed',
      'Safety brakes checked',
      'Door sensors verified'
    ],
    notes: 'Inspection overdue - action required immediately',
    last_inspection_date: '2023-10-01',
    next_inspection_date: '2024-03-30',
    inspection_frequency: 'biannual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let complianceAudits = [
  {
    id: 1,
    compliance_id: 1,
    audit_date: '2024-01-15',
    auditor: 'Fire Safety Inspector',
    findings: 'All systems compliant',
    corrective_actions: [],
    status: 'passed',
    report_url: '/reports/audit_001.pdf'
  },
  {
    id: 2,
    compliance_id: 3,
    audit_date: '2024-03-01',
    auditor: 'HVAC Specialist',
    findings: 'Minor refrigerant leak detected',
    corrective_actions: ['Repair leak', 'Retest system'],
    status: 'action_required',
    report_url: '/reports/audit_003.pdf'
  }
];

let nextComplianceId = 5;
let nextAuditId = 3;

// Get all compliance records
app.get('/api/compliance', (req, res) => {
  const complianceWithDetails = complianceRecords.map(record => ({
    ...record,
    asset_name: assets.find(a => a.id === record.asset_id)?.name,
    vendor_name: vendors?.find(v => v.id === record.vendor_id)?.name,
    days_remaining: record.expiry_date ? Math.ceil((new Date(record.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) : null,
    is_expired: record.expiry_date ? new Date(record.expiry_date) < new Date() : false,
    is_expiring_soon: record.expiry_date ? 
      (Math.ceil((new Date(record.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) <= (record.reminder_days || 30) && 
       Math.ceil((new Date(record.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) > 0) : false
  }));
  res.json(complianceWithDetails);
});

// Get single compliance record
app.get('/api/compliance/:id', (req, res) => {
  const record = complianceRecords.find(r => r.id === parseInt(req.params.id));
  if (!record) {
    return res.status(404).json({ error: 'Compliance record not found' });
  }
  const audits = complianceAudits.filter(a => a.compliance_id === record.id);
  res.json({ ...record, audits });
});

// Create compliance record
app.post('/api/compliance', (req, res) => {
  const {
    title,
    type,
    category,
    description,
    priority,
    issue_date,
    expiry_date,
    reminder_days,
    issuing_authority,
    reference_number,
    asset_id,
    vendor_id,
    requirements,
    notes,
    inspection_frequency
  } = req.body;

  const complianceNumber = `CMP-${new Date().getFullYear()}-${String(complianceRecords.length + 1).padStart(3, '0')}`;
  
  const newRecord = {
    id: nextComplianceId++,
    compliance_number: complianceNumber,
    title,
    type: type || 'Certificate',
    category: category || 'General',
    description: description || '',
    status: 'active',
    priority: priority || 'medium',
    issue_date: issue_date || new Date().toISOString().split('T')[0],
    expiry_date: expiry_date || null,
    reminder_days: reminder_days || 30,
    issuing_authority: issuing_authority || '',
    document_url: null,
    reference_number: reference_number || '',
    asset_id: asset_id || null,
    vendor_id: vendor_id || null,
    assigned_to: 1,
    requirements: requirements || [],
    notes: notes || '',
    last_inspection_date: issue_date || new Date().toISOString().split('T')[0],
    next_inspection_date: expiry_date || null,
    inspection_frequency: inspection_frequency || 'annual',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  complianceRecords.push(newRecord);
  res.status(201).json(newRecord);
});

// Update compliance record
app.put('/api/compliance/:id', (req, res) => {
  const index = complianceRecords.findIndex(r => r.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'Compliance record not found' });
  }
  
  complianceRecords[index] = {
    ...complianceRecords[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  
  res.json(complianceRecords[index]);
});

// Update compliance status
app.patch('/api/compliance/:id/status', (req, res) => {
  const { status } = req.body;
  const index = complianceRecords.findIndex(r => r.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Compliance record not found' });
  }

  complianceRecords[index].status = status;
  complianceRecords[index].updated_at = new Date().toISOString();
  res.json(complianceRecords[index]);
});

// Add audit record
app.post('/api/compliance/:id/audits', (req, res) => {
  const { audit_date, auditor, findings, corrective_actions, status } = req.body;
  const complianceId = parseInt(req.params.id);
  
  const newAudit = {
    id: nextAuditId++,
    compliance_id: complianceId,
    audit_date: audit_date || new Date().toISOString().split('T')[0],
    auditor: auditor || 'System',
    findings: findings || '',
    corrective_actions: corrective_actions || [],
    status: status || 'pending',
    report_url: null
  };
  
  complianceAudits.push(newAudit);
  
  // Update last inspection date
  const recordIndex = complianceRecords.findIndex(r => r.id === complianceId);
  if (recordIndex !== -1) {
    complianceRecords[recordIndex].last_inspection_date = audit_date;
    complianceRecords[recordIndex].updated_at = new Date().toISOString();
  }
  
  res.status(201).json(newAudit);
});

// Get compliance statistics
app.get('/api/compliance/stats/summary', (req, res) => {
  const now = new Date();
  const stats = {
    total: complianceRecords.length,
    active: complianceRecords.filter(r => r.status === 'active').length,
    expired: complianceRecords.filter(r => r.expiry_date && new Date(r.expiry_date) < now).length,
    expiring_soon: complianceRecords.filter(r => {
      if (!r.expiry_date || r.status !== 'active') return false;
      const daysRemaining = Math.ceil((new Date(r.expiry_date) - now) / (1000 * 60 * 60 * 24));
      return daysRemaining <= (r.reminder_days || 30) && daysRemaining > 0;
    }).length,
    by_type: {
      certificates: complianceRecords.filter(r => r.type === 'Certificate').length,
      permits: complianceRecords.filter(r => r.type === 'Permit').length,
      inspections: complianceRecords.filter(r => r.type === 'Inspection').length
    },
    by_priority: {
      critical: complianceRecords.filter(r => r.priority === 'critical').length,
      high: complianceRecords.filter(r => r.priority === 'high').length,
      medium: complianceRecords.filter(r => r.priority === 'medium').length,
      low: complianceRecords.filter(r => r.priority === 'low').length
    }
  };
  res.json(stats);
});




// ============ BUDGET TRACKING & ANALYTICS MODULE ============

let budgets = [
  {
    id: 1,
    budget_code: 'BUD-FAC-2024',
    name: 'Facilities Operations Budget',
    department: 'Facilities',
    fiscal_year: 2024,
    total_budget: 250000.00,
    allocated: 125000.00,
    spent: 45678.50,
    committed: 12500.00,
    categories: [
      { name: 'Maintenance', allocated: 80000, spent: 28500, committed: 5000 },
      { name: 'Utilities', allocated: 60000, spent: 12500, committed: 0 },
      { name: 'Supplies', allocated: 40000, spent: 4678.50, committed: 2500 },
      { name: 'Contracts', allocated: 70000, spent: 0, committed: 5000 }
    ],
    status: 'active',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    budget_code: 'BUD-IT-2024',
    name: 'IT Operations Budget',
    department: 'IT',
    fiscal_year: 2024,
    total_budget: 180000.00,
    allocated: 95000.00,
    spent: 28750.00,
    committed: 4200.00,
    categories: [
      { name: 'Hardware', allocated: 60000, spent: 12500, committed: 4200 },
      { name: 'Software', allocated: 50000, spent: 11250, committed: 0 },
      { name: 'Services', allocated: 40000, spent: 5000, committed: 0 },
      { name: 'Infrastructure', allocated: 30000, spent: 0, committed: 0 }
    ],
    status: 'active',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    budget_code: 'BUD-OPS-2024',
    name: 'Operations Budget',
    department: 'Operations',
    fiscal_year: 2024,
    total_budget: 320000.00,
    allocated: 210000.00,
    spent: 98750.00,
    committed: 15000.00,
    categories: [
      { name: 'Labor', allocated: 150000, spent: 75000, committed: 0 },
      { name: 'Equipment', allocated: 80000, spent: 18750, committed: 15000 },
      { name: 'Training', allocated: 30000, spent: 5000, committed: 0 },
      { name: 'Miscellaneous', allocated: 60000, spent: 0, committed: 0 }
    ],
    status: 'active',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let budgetTransactions = [
  {
    id: 1,
    budget_id: 1,
    type: 'spent',
    amount: 12500.00,
    category: 'Maintenance',
    description: 'HVAC repair - Building A',
    reference_type: 'purchase_order',
    reference_id: 1,
    transaction_date: '2024-02-15',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    budget_id: 1,
    type: 'spent',
    amount: 8500.00,
    category: 'Maintenance',
    description: 'Electrical panel upgrade',
    reference_type: 'purchase_order',
    reference_id: 3,
    transaction_date: '2024-03-01',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    budget_id: 1,
    type: 'spent',
    amount: 4678.50,
    category: 'Supplies',
    description: 'Cleaning supplies and materials',
    reference_type: 'purchase_order',
    reference_id: null,
    transaction_date: '2024-02-28',
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    budget_id: 2,
    type: 'spent',
    amount: 12500.00,
    category: 'Hardware',
    description: 'Network switches',
    reference_type: 'purchase_order',
    reference_id: 2,
    transaction_date: '2024-02-20',
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    budget_id: 2,
    type: 'committed',
    amount: 4200.00,
    category: 'Hardware',
    description: 'Pending PO for servers',
    reference_type: 'purchase_order',
    reference_id: null,
    transaction_date: '2024-03-10',
    created_at: new Date().toISOString()
  }
];

let nextBudgetId = 4;
let nextTransactionId = 6;

// Get all budgets
app.get('/api/budgets', (req, res) => {
  const budgetsWithAnalytics = budgets.map(budget => ({
    ...budget,
    available: budget.allocated - budget.spent - budget.committed,
    utilization_percentage: (budget.spent / budget.allocated) * 100,
    remaining_percentage: ((budget.allocated - budget.spent - budget.committed) / budget.allocated) * 100
  }));
  res.json(budgetsWithAnalytics);
});

// Get single budget
app.get('/api/budgets/:id', (req, res) => {
  const budget = budgets.find(b => b.id === parseInt(req.params.id));
  if (!budget) {
    return res.status(404).json({ error: 'Budget not found' });
  }
  const transactions = budgetTransactions.filter(t => t.budget_id === budget.id);
  res.json({ ...budget, transactions });
});

// Create budget
app.post('/api/budgets', (req, res) => {
  const {
    name,
    department,
    fiscal_year,
    total_budget,
    categories
  } = req.body;

  const budgetCode = `BUD-${department.substring(0, 3).toUpperCase()}-${fiscal_year}`;
  
  const newBudget = {
    id: nextBudgetId++,
    budget_code: budgetCode,
    name,
    department,
    fiscal_year: fiscal_year || new Date().getFullYear(),
    total_budget: total_budget || 0,
    allocated: total_budget || 0,
    spent: 0,
    committed: 0,
    categories: categories || [],
    status: 'active',
    start_date: `${fiscal_year}-01-01`,
    end_date: `${fiscal_year}-12-31`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  budgets.push(newBudget);
  res.status(201).json(newBudget);
});

// Update budget allocation
app.patch('/api/budgets/:id/allocation', (req, res) => {
  const { allocated } = req.body;
  const index = budgets.findIndex(b => b.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Budget not found' });
  }

  budgets[index].allocated = allocated;
  budgets[index].updated_at = new Date().toISOString();
  res.json(budgets[index]);
});

// Add transaction
app.post('/api/budgets/:id/transactions', (req, res) => {
  const { type, amount, category, description, reference_type, reference_id } = req.body;
  const budgetId = parseInt(req.params.id);
  const budgetIndex = budgets.findIndex(b => b.id === budgetId);
  
  if (budgetIndex === -1) {
    return res.status(404).json({ error: 'Budget not found' });
  }

  const newTransaction = {
    id: nextTransactionId++,
    budget_id: budgetId,
    type: type || 'spent',
    amount: amount,
    category: category,
    description: description,
    reference_type: reference_type || 'manual',
    reference_id: reference_id || null,
    transaction_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString()
  };

  budgetTransactions.push(newTransaction);

  // Update budget totals
  if (type === 'spent') {
    budgets[budgetIndex].spent += amount;
  } else if (type === 'committed') {
    budgets[budgetIndex].committed += amount;
  }

  // Update category totals
  const categoryIndex = budgets[budgetIndex].categories.findIndex(c => c.name === category);
  if (categoryIndex !== -1) {
    if (type === 'spent') {
      budgets[budgetIndex].categories[categoryIndex].spent += amount;
    } else if (type === 'committed') {
      budgets[budgetIndex].categories[categoryIndex].committed += amount;
    }
  }

  budgets[budgetIndex].updated_at = new Date().toISOString();
  res.status(201).json(newTransaction);
});

// Get budget analytics
app.get('/api/budgets/analytics/overview', (req, res) => {
  const totalBudget = budgets.reduce((sum, b) => sum + b.total_budget, 0);
  const totalAllocated = budgets.reduce((sum, b) => sum + b.allocated, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalCommitted = budgets.reduce((sum, b) => sum + b.committed, 0);
  
  const byDepartment = budgets.map(b => ({
    department: b.department,
    total_budget: b.total_budget,
    allocated: b.allocated,
    spent: b.spent,
    committed: b.committed,
    available: b.allocated - b.spent - b.committed,
    utilization: (b.spent / b.allocated) * 100
  }));

  const monthlySpend = [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  months.forEach(month => {
    monthlySpend.push({
      month,
      amount: Math.floor(Math.random() * 20000) + 5000 // Simulated data
    });
  });

  res.json({
    summary: {
      total_budget: totalBudget,
      total_allocated: totalAllocated,
      total_spent: totalSpent,
      total_committed: totalCommitted,
      total_available: totalAllocated - totalSpent - totalCommitted,
      overall_utilization: (totalSpent / totalAllocated) * 100
    },
    by_department: byDepartment,
    monthly_spend: monthlySpend,
    top_categories: [
      { category: 'Maintenance', amount: 28500 },
      { category: 'Hardware', amount: 12500 },
      { category: 'Labor', amount: 75000 },
      { category: 'Utilities', amount: 12500 }
    ]
  });
});

// Get budget forecast
app.get('/api/budgets/analytics/forecast', (req, res) => {
  const currentSpend = budgets.reduce((sum, b) => sum + b.spent, 0);
  const currentMonth = new Date().getMonth();
  const monthsRemaining = 12 - currentMonth;
  const monthlyAvg = currentSpend / (currentMonth + 1);
  const forecastEnd = currentSpend + (monthlyAvg * monthsRemaining);
  
  res.json({
    current_spend: currentSpend,
    monthly_average: monthlyAvg,
    forecasted_year_end: forecastEnd,
    projected_variance: forecastEnd - budgets.reduce((sum, b) => sum + b.total_budget, 0),
    monthly_forecast: Array.from({ length: monthsRemaining }, (_, i) => ({
      month: new Date(new Date().setMonth(currentMonth + i + 1)).toLocaleString('default', { month: 'short' }),
      forecast: monthlyAvg * (i + 1)
    }))
  });
});



// ============ REPORTING DASHBOARD MODULE ============

// Get comprehensive dashboard data
app.get('/api/reports/dashboard', (req, res) => {
  // Asset statistics
  const assetStats = {
    total: assets.length,
    by_status: {
      active: assets.filter(a => a.status === 'active').length,
      maintenance: assets.filter(a => a.status === 'maintenance').length,
      retired: assets.filter(a => a.status === 'retired').length
    },
    by_category: assets.reduce((acc, asset) => {
      acc[asset.category] = (acc[asset.category] || 0) + 1;
      return acc;
    }, {}),
    total_value: assets.reduce((sum, a) => sum + (a.purchase_cost || 0), 0),
    warranty_expiring_soon: assets.filter(a => {
      if (!a.warranty_expiry) return false;
      const daysRemaining = Math.ceil((new Date(a.warranty_expiry) - new Date()) / (1000 * 60 * 60 * 24));
      return daysRemaining <= 90 && daysRemaining > 0;
    }).length
  };

  // Ticket statistics
  const ticketStats = {
    total: tickets.length,
    by_status: {
      new: tickets.filter(t => t.status === 'new').length,
      assigned: tickets.filter(t => t.status === 'assigned').length,
      in_progress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length
    },
    by_priority: {
      critical: tickets.filter(t => t.priority === 'critical').length,
      high: tickets.filter(t => t.priority === 'high').length,
      medium: tickets.filter(t => t.priority === 'medium').length,
      low: tickets.filter(t => t.priority === 'low').length
    },
    by_category: tickets.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {}),
    average_resolution_time: calculateAverageResolutionTime(tickets),
    sla_compliance: calculateSLACompliance(tickets)
  };

  // Purchase Order statistics
  const poStats = {
    total: purchaseOrders.length,
    total_value: purchaseOrders.reduce((sum, po) => sum + po.total_amount, 0),
    by_status: {
      draft: purchaseOrders.filter(p => p.status === 'draft').length,
      pending_approval: purchaseOrders.filter(p => p.status === 'pending_approval').length,
      approved: purchaseOrders.filter(p => p.status === 'approved').length,
      ordered: purchaseOrders.filter(p => p.status === 'ordered').length,
      delivered: purchaseOrders.filter(p => p.status === 'delivered').length
    },
    by_department: purchaseOrders.reduce((acc, po) => {
      acc[po.department] = (acc[po.department] || 0) + po.total_amount;
      return acc;
    }, {}),
    monthly_spend: calculateMonthlySpend(purchaseOrders)
  };

  // Vendor statistics
  const vendorStats = {
    total: vendors?.length || 0,
    active: vendors?.filter(v => v.status === 'active').length || 0,
    by_category: vendors?.reduce((acc, vendor) => {
      acc[vendor.category] = (acc[vendor.category] || 0) + 1;
      return acc;
    }, {}) || {},
    total_contract_value: contracts?.reduce((sum, c) => sum + c.value, 0) || 0
  };

  // Compliance statistics
  const complianceStats = {
    total: complianceRecords.length,
    expired: complianceRecords.filter(c => c.expiry_date && new Date(c.expiry_date) < new Date()).length,
    expiring_soon: complianceRecords.filter(c => {
      if (!c.expiry_date) return false;
      const daysRemaining = Math.ceil((new Date(c.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
      return daysRemaining <= 30 && daysRemaining > 0;
    }).length,
    by_type: {
      certificates: complianceRecords.filter(c => c.type === 'Certificate').length,
      permits: complianceRecords.filter(c => c.type === 'Permit').length,
      inspections: complianceRecords.filter(c => c.type === 'Inspection').length
    }
  };

  // Budget statistics
  const budgetStats = {
    total_budget: budgets.reduce((sum, b) => sum + b.total_budget, 0),
    total_allocated: budgets.reduce((sum, b) => sum + b.allocated, 0),
    total_spent: budgets.reduce((sum, b) => sum + b.spent, 0),
    total_committed: budgets.reduce((sum, b) => sum + b.committed, 0),
    overall_utilization: (budgets.reduce((sum, b) => sum + b.spent, 0) / budgets.reduce((sum, b) => sum + b.allocated, 0)) * 100
  };

  // Recent activity (combine recent items from all modules)
  const recentActivity = [
    ...tickets.slice(0, 5).map(t => ({
      type: 'ticket',
      id: t.id,
      title: t.title,
      status: t.status,
      date: t.created_at,
      priority: t.priority
    })),
    ...purchaseOrders.slice(0, 5).map(po => ({
      type: 'purchase_order',
      id: po.id,
      title: po.title,
      status: po.status,
      date: po.created_at,
      amount: po.total_amount
    })),
    ...assets.slice(0, 5).map(a => ({
      type: 'asset',
      id: a.id,
      title: a.name,
      status: a.status,
      date: a.created_at
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  res.json({
    assets: assetStats,
    tickets: ticketStats,
    purchase_orders: poStats,
    vendors: vendorStats,
    compliance: complianceStats,
    budgets: budgetStats,
    recent_activity: recentActivity,
    last_updated: new Date().toISOString()
  });
});

// Export report data
app.get('/api/reports/export/:type', (req, res) => {
  const { type } = req.params;
  const { format = 'json', start_date, end_date } = req.query;
  
  let data = [];
  let filename = '';
  
  switch(type) {
    case 'assets':
      data = assets;
      filename = 'assets_report';
      break;
    case 'tickets':
      data = tickets;
      filename = 'tickets_report';
      break;
    case 'purchase-orders':
      data = purchaseOrders;
      filename = 'purchase_orders_report';
      break;
    case 'vendors':
      data = vendors || [];
      filename = 'vendors_report';
      break;
    case 'compliance':
      data = complianceRecords;
      filename = 'compliance_report';
      break;
    case 'budgets':
      data = budgets;
      filename = 'budgets_report';
      break;
    default:
      return res.status(400).json({ error: 'Invalid report type' });
  }
  
  // Filter by date range if provided
  if (start_date && end_date) {
    data = data.filter(item => {
      const itemDate = new Date(item.created_at || item.order_date || item.issue_date);
      return itemDate >= new Date(start_date) && itemDate <= new Date(end_date);
    });
  }
  
  if (format === 'csv') {
    // Convert to CSV
    const headers = Object.keys(data[0] || {});
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
    ];
    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } else {
    res.json(data);
  }
});

// Helper functions
function calculateAverageResolutionTime(tickets) {
  const resolvedTickets = tickets.filter(t => t.resolved_at);
  if (resolvedTickets.length === 0) return 0;
  
  const totalHours = resolvedTickets.reduce((sum, t) => {
    const resolved = new Date(t.resolved_at);
    const created = new Date(t.created_at);
    return sum + (resolved - created) / (1000 * 60 * 60);
  }, 0);
  
  return totalHours / resolvedTickets.length;
}

function calculateSLACompliance(tickets) {
  const ticketsWithSLA = tickets.filter(t => t.sla_resolution_due);
  if (ticketsWithSLA.length === 0) return 100;
  
  const compliant = ticketsWithSLA.filter(t => {
    if (!t.resolved_at) return true;
    const resolved = new Date(t.resolved_at);
    const due = new Date(t.sla_resolution_due);
    return resolved <= due;
  }).length;
  
  return (compliant / ticketsWithSLA.length) * 100;
}

function calculateMonthlySpend(purchaseOrders) {
  const monthlyData = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  purchaseOrders.forEach(po => {
    if (po.status === 'approved' || po.status === 'ordered' || po.status === 'delivered') {
      const month = new Date(po.order_date).getMonth();
      monthlyData[months[month]] = (monthlyData[months[month]] || 0) + po.total_amount;
    }
  });
  
  return months.map(month => ({
    month,
    amount: monthlyData[month] || 0
  }));
}




// ============ USER MANAGEMENT MODULE ============

let users = [
  {
    id: 1,
    user_id: 'USR-001',
    email: 'admin@pfg.com',
    password_hash: '$2a$10$demo', // In production, use proper hashing
    full_name: 'System Admin',
    role: 'admin',
    department: 'IT',
    position: 'System Administrator',
    phone: '+44 20 1234 5678',
    mobile: '+44 77 1234 5678',
    avatar: null,
    status: 'active',
    last_login: new Date().toISOString(),
    permissions: ['all'],
    teams: ['management', 'it'],
    manager_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    user_id: 'USR-002',
    email: 'facilities@pfg.com',
    password_hash: '$2a$10$demo',
    full_name: 'Facilities Manager',
    role: 'manager',
    department: 'Facilities',
    position: 'Facilities Operations Manager',
    phone: '+44 20 8765 4321',
    mobile: '+44 78 8765 4321',
    avatar: null,
    status: 'active',
    last_login: new Date(Date.now() - 86400000).toISOString(),
    permissions: ['assets.view', 'assets.edit', 'tickets.view', 'tickets.manage', 'vendors.view'],
    teams: ['facilities', 'maintenance'],
    manager_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    user_id: 'USR-003',
    email: 'tech@pfg.com',
    password_hash: '$2a$10$demo',
    full_name: 'Maintenance Tech',
    role: 'staff',
    department: 'Facilities',
    position: 'Senior Maintenance Technician',
    phone: '+44 20 9876 5432',
    mobile: '+44 79 9876 5432',
    avatar: null,
    status: 'active',
    last_login: new Date(Date.now() - 172800000).toISOString(),
    permissions: ['tickets.view', 'tickets.update', 'assets.view'],
    teams: ['maintenance'],
    manager_id: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    user_id: 'USR-004',
    email: 'finance@pfg.com',
    password_hash: '$2a$10$demo',
    full_name: 'Finance Manager',
    role: 'finance',
    department: 'Finance',
    position: 'Finance Operations Manager',
    phone: '+44 20 5555 1234',
    mobile: '+44 77 5555 1234',
    avatar: null,
    status: 'active',
    last_login: new Date(Date.now() - 43200000).toISOString(),
    permissions: ['budgets.view', 'budgets.edit', 'purchase_orders.approve', 'reports.view'],
    teams: ['finance'],
    manager_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 5,
    user_id: 'USR-005',
    email: 'john.smith@pfg.com',
    password_hash: '$2a$10$demo',
    full_name: 'John Smith',
    role: 'staff',
    department: 'Operations',
    position: 'Operations Coordinator',
    phone: '+44 20 7777 8888',
    mobile: '+44 78 7777 8888',
    avatar: null,
    status: 'inactive',
    last_login: new Date(Date.now() - 259200000).toISOString(),
    permissions: ['tickets.view', 'assets.view'],
    teams: ['operations'],
    manager_id: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let userSessions = [
  {
    id: 1,
    user_id: 1,
    session_token: 'demo-token-1',
    login_time: new Date().toISOString(),
    ip_address: '127.0.0.1',
    user_agent: 'Chrome/120.0',
    is_active: true
  }
];

let userActivityLogs = [
  {
    id: 1,
    user_id: 1,
    action: 'login',
    details: 'User logged in',
    ip_address: '127.0.0.1',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    user_id: 1,
    action: 'asset_created',
    details: 'Created new asset: HVAC Unit',
    ip_address: '127.0.0.1',
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 3,
    user_id: 2,
    action: 'ticket_updated',
    details: 'Updated ticket TKT-002 status',
    ip_address: '127.0.0.1',
    created_at: new Date(Date.now() - 7200000).toISOString()
  }
];

let nextUserId = 6;
let nextSessionId = 2;
let nextActivityId = 4;

// Get all users
app.get('/api/users', (req, res) => {
  const usersWithStats = users.map(user => ({
    ...user,
    password_hash: undefined, // Remove password hash from response
    last_login_formatted: user.last_login ? new Date(user.last_login).toLocaleString() : 'Never',
    activity_count: userActivityLogs.filter(log => log.user_id === user.id).length
  }));
  res.json(usersWithStats);
});

// Get single user
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const activities = userActivityLogs.filter(log => log.user_id === user.id);
  const sessions = userSessions.filter(s => s.user_id === user.id && s.is_active);
  res.json({
    ...user,
    password_hash: undefined,
    activities,
    active_sessions: sessions.length
  });
});

// Create user
app.post('/api/users', (req, res) => {
  const {
    email,
    full_name,
    role,
    department,
    position,
    phone,
    mobile,
    manager_id
  } = req.body;

  // Check if email already exists
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const userId = `USR-${String(users.length + 1).padStart(3, '0')}`;
  
  const newUser = {
    id: nextUserId++,
    user_id: userId,
    email,
    password_hash: '$2a$10$demo', // Default password, should be changed on first login
    full_name,
    role: role || 'staff',
    department: department || 'General',
    position: position || '',
    phone: phone || '',
    mobile: mobile || '',
    avatar: null,
    status: 'active',
    last_login: null,
    permissions: getDefaultPermissions(role),
    teams: [],
    manager_id: manager_id || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  users.push(newUser);
  
  // Log activity
  logUserActivity(newUser.id, 'user_created', `User ${full_name} was created`);
  
  res.status(201).json({
    ...newUser,
    password_hash: undefined
  });
});

// Update user
app.put('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updatedUser = {
    ...users[index],
    ...req.body,
    password_hash: users[index].password_hash, // Preserve password hash
    updated_at: new Date().toISOString()
  };

  users[index] = updatedUser;
  
  logUserActivity(updatedUser.id, 'user_updated', `User ${updatedUser.full_name} was updated`);
  
  res.json({
    ...updatedUser,
    password_hash: undefined
  });
});

// Update user status
app.patch('/api/users/:id/status', (req, res) => {
  const { status } = req.body;
  const index = users.findIndex(u => u.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users[index].status = status;
  users[index].updated_at = new Date().toISOString();
  
  logUserActivity(users[index].id, 'status_changed', `User status changed to ${status}`);
  
  res.json({
    ...users[index],
    password_hash: undefined
  });
});

// Get current user profile
app.get('/api/users/profile/me', (req, res) => {
  // For demo, return the admin user
  const user = users.find(u => u.id === 1);
  res.json({
    ...user,
    password_hash: undefined
  });
});

// Update current user profile
app.put('/api/users/profile/me', (req, res) => {
  const index = users.findIndex(u => u.id === 1); // For demo, use admin user
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users[index] = {
    ...users[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };

  res.json({
    ...users[index],
    password_hash: undefined
  });
});

// Get user activity logs
app.get('/api/users/:id/activities', (req, res) => {
  const logs = userActivityLogs.filter(log => log.user_id === parseInt(req.params.id));
  res.json(logs);
});

// Get all user activity logs (for admin)
app.get('/api/users/activities/all', (req, res) => {
  const logsWithUser = userActivityLogs.map(log => ({
    ...log,
    user_name: users.find(u => u.id === log.user_id)?.full_name
  }));
  res.json(logsWithUser);
});

// Get user statistics
app.get('/api/users/stats/summary', (req, res) => {
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
    by_role: {
      admin: users.filter(u => u.role === 'admin').length,
      manager: users.filter(u => u.role === 'manager').length,
      finance: users.filter(u => u.role === 'finance').length,
      staff: users.filter(u => u.role === 'staff').length
    },
    by_department: users.reduce((acc, user) => {
      acc[user.department] = (acc[user.department] || 0) + 1;
      return acc;
    }, {}),
    active_sessions: userSessions.filter(s => s.is_active).length,
    recent_activity: userActivityLogs.slice(0, 10).map(log => ({
      ...log,
      user_name: users.find(u => u.id === log.user_id)?.full_name
    }))
  };
  res.json(stats);
});

// Get roles and permissions
app.get('/api/users/roles', (req, res) => {
  const roles = [
    {
      name: 'admin',
      label: 'System Administrator',
      description: 'Full system access',
      permissions: ['all']
    },
    {
      name: 'manager',
      label: 'Department Manager',
      description: 'Manage department operations',
      permissions: ['assets.view', 'assets.edit', 'tickets.view', 'tickets.manage', 'vendors.view', 'vendors.edit', 'reports.view']
    },
    {
      name: 'finance',
      label: 'Finance Manager',
      description: 'Manage budgets and approvals',
      permissions: ['budgets.view', 'budgets.edit', 'purchase_orders.approve', 'reports.view', 'vendors.view']
    },
    {
      name: 'staff',
      label: 'Staff Member',
      description: 'Basic operational access',
      permissions: ['tickets.view', 'tickets.create', 'assets.view']
    }
  ];
  res.json(roles);
});

// Helper functions
function getDefaultPermissions(role) {
  switch(role) {
    case 'admin':
      return ['all'];
    case 'manager':
      return ['assets.view', 'assets.edit', 'tickets.view', 'tickets.manage', 'vendors.view', 'vendors.edit', 'reports.view'];
    case 'finance':
      return ['budgets.view', 'budgets.edit', 'purchase_orders.approve', 'reports.view', 'vendors.view'];
    default:
      return ['tickets.view', 'tickets.create', 'assets.view'];
  }
}

function logUserActivity(userId, action, details) {
  userActivityLogs.push({
    id: nextActivityId++,
    user_id: userId,
    action,
    details,
    ip_address: '127.0.0.1',
    created_at: new Date().toISOString()
  });
}



app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log(`📊 API endpoints available:`);
  console.log(`   GET    /api/assets`);
  console.log(`   GET    /api/tickets`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/health`);
});