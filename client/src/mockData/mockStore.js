// Shared prototype store for frontend-only mocking.
// Single source of truth, persisted to localStorage.

const STORAGE_KEY = "prototype_mock_state_v1";

const seedState = () => {
  const today = new Date();
  const isoDate = (d) => d.toISOString().split("T")[0];
  const getDate = (daysAgo) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - daysAgo);
    return dt;
  };

  // Suppliers (used by buyer quotation modules)
  const suppliers = [
    { id: 1, name: "London Fresh Produce Ltd", company_name: "London Fresh Produce Ltd", contact: "James Smith", contact_person: "James Smith", email: "james@londonfresh.co.uk", phone: "+44-20-7946-0001", address: "Plot 12, Park Royal, London", rating: 4.5 },
    { id: 2, name: "Birmingham Spice Merchants", company_name: "Birmingham Spice Merchants", contact: "Oliver Brown", contact_person: "Oliver Brown", email: "oliver@birminghamspices.co.uk", phone: "+44-121-496-0002", address: "45 Bullring Market, Birmingham", rating: 4.2 },
    { id: 3, name: "Manchester Packaging Hub", company_name: "Manchester Packaging Hub", contact: "Sarah Taylor", contact_person: "Sarah Taylor", email: "sarah@manpack.co.uk", phone: "+44-161-496-0003", address: "78 Trafford Park, Manchester", rating: 3.8 },
    { id: 4, name: "Liverpool Bulk Trading", company_name: "Liverpool Bulk Trading", contact: "Arthur Shelby", contact_person: "Arthur Shelby", email: "arthur@liverpoolbulk.co.uk", phone: "+44-151-496-0004", address: "101 Royal Albert Dock, Liverpool", rating: 4.0 },
    { id: 5, name: "Southampton Global Imports", company_name: "Southampton Global Imports", contact: "Sara Khan", contact_person: "Sara Khan", email: "sara@globalimports.co.uk", phone: "+44-23-8012-0005", address: "22 Port of Southampton, Southampton", rating: 3.9 },
  ];

  // Customers (used by admin CustomerManagement + CustomerOrders)
  const customers = [
    { id: 1, customer_name: "James Wilson", company_name: "London Metro Retail", email: "james@metroretail.co.uk", phone: "+44-20-7946-0011", address_line_1: "12 Oxford Street", address_line_2: "", country: "United Kingdom", state: "Greater London", city: "London", pincode: "W1D 1AN", latitude: 51.5145, longitude: -0.1444, delivery_priority: "normal", status: "active", credit_balance: 1250.00 },
    { id: 2, customer_name: "Emma Thompson", company_name: "Manchester Central Mart", email: "emma@citysupermarket.co.uk", phone: "+44-161-496-0022", address_line_1: "56 Deansgate", address_line_2: "", country: "United Kingdom", state: "Greater Manchester", city: "Manchester", pincode: "M3 2EL", latitude: 53.4830, longitude: -2.2441, delivery_priority: "urgent", status: "active", credit_balance: 850.50 },
    { id: 3, customer_name: "David Brown", company_name: "Greenwich FreshMart", email: "david@freshmart.co.uk", phone: "+44-20-7946-0033", address_line_1: "Greenwich High Road", address_line_2: "", country: "United Kingdom", state: "Greater London", city: "London", pincode: "SE10 8NN", latitude: 51.4826, longitude: -0.0077, delivery_priority: "scheduled", status: "active", credit_balance: 2400.00 },
    { id: 4, customer_name: "Sophie Evans", company_name: "Bristol Logistics Hub", email: "sophie@rdh.co.uk", phone: "+44-117-496-0044", address_line_1: "Cribbs Causeway", address_line_2: "Unit 3", country: "United Kingdom", state: "Bristol", city: "Bristol", pincode: "BS34 5DG", latitude: 51.5234, longitude: -2.5937, delivery_priority: "normal", status: "active", credit_balance: 0.00 },
    { id: 5, customer_name: "William Wright", company_name: "Leeds Quick Mart", email: "william@quickshop.co.uk", phone: "+44-113-496-0055", address_line_1: "City Square", address_line_2: "", country: "United Kingdom", state: "West Yorkshire", city: "Leeds", pincode: "LS1 2HT", latitude: 53.7963, longitude: -1.5478, delivery_priority: "urgent", status: "inactive", credit_balance: 100.00 },
    { id: 12, customer_name: "Rachel Patel", company_name: "Patel & Sons Wholesale", email: "customer@sword.com", phone: "+44-20-8000-0000", address_line_1: "100 Customer Way", address_line_2: "", country: "United Kingdom", state: "Greater London", city: "London", pincode: "SW1A 1AA", latitude: 51.5014, longitude: -0.1419, delivery_priority: "normal", status: "active", credit_balance: 350.00 },
  ];

  // Customer Orders (admin Logistics & Order Management)
  const customerOrders = [
    { id: 1, order_number: "ORD-2026-001", customer_id: 1, customer_name: "James Wilson", company_name: "London Metro Retail", required_delivery_date: isoDate(getDate(-5)), delivery_address: "12 Oxford Street, London", delivery_city: "London", delivery_state: "London", delivery_country: "UK", delivery_latitude: 51.5145, delivery_longitude: -0.1444, delivery_priority: "normal", status: "delivered", selected_warehouse_name: "London Distribution Center", warehouse_distance_km: 12.5, driver_name: "David Smith", vehicle_type: "Truck", vehicle_plate: "LX58 ABC", delivery_sequence: 1, items: [{ product_id: 1001, product_name: "Wheat Flour (Atta)", quantity: 200, weight_kg: 200 }], total_amount: 85000 },
    { id: 2, order_number: "ORD-2026-002", customer_id: 2, customer_name: "Emma Thompson", company_name: "Manchester Central Mart", required_delivery_date: isoDate(getDate(-3)), delivery_address: "56 Deansgate, Manchester", delivery_city: "Manchester", delivery_state: "Manchester", delivery_country: "UK", delivery_latitude: 53.4830, delivery_longitude: -2.2441, delivery_priority: "urgent", status: "delivered", selected_warehouse_name: "Manchester Logistics Hub", warehouse_distance_km: 8.3, driver_name: "David Smith", vehicle_type: "Truck", vehicle_plate: "LX58 ABC", delivery_sequence: 2, items: [{ product_id: 2001, product_name: "Red Chilli Powder", quantity: 50, weight_kg: 50 }], total_amount: 123000 },
    { id: 3, order_number: "ORD-2026-003", customer_id: 3, customer_name: "David Brown", company_name: "Greenwich FreshMart", required_delivery_date: isoDate(getDate(-1)), delivery_address: "Greenwich High Road, London", delivery_city: "London", delivery_state: "London", delivery_country: "UK", delivery_latitude: 51.4826, delivery_longitude: -0.0077, delivery_priority: "scheduled", status: "delivered", selected_warehouse_name: "London Distribution Center", warehouse_distance_km: 15.2, driver_name: "Michael Jones", vehicle_type: "Van", vehicle_plate: "BV62 XYZ", delivery_sequence: null, items: [{ product_id: 1101, product_name: "Rice (Basmati)", quantity: 100, weight_kg: 100 }], total_amount: 112000 },
    { id: 4, order_number: "ORD-2026-004", customer_id: 4, customer_name: "Sophie Evans", company_name: "Bristol Logistics Hub", required_delivery_date: isoDate(getDate(2)), delivery_address: "Cribbs Causeway, Bristol", delivery_city: "Bristol", delivery_state: "Bristol", delivery_country: "UK", delivery_latitude: 51.5234, longitude: -2.5937, delivery_priority: "normal", status: "approved", selected_warehouse_name: "Bristol Logistics Center", warehouse_distance_km: 5.2, driver_name: "Thomas Miller", vehicle_type: "Truck", vehicle_plate: "RE19 DEF", delivery_sequence: null, items: [{ product_id: 2101, product_name: "Turmeric Powder", quantity: 80, weight_kg: 80 }], total_amount: 45000 },
    { id: 5, order_number: "ORD-2026-005", customer_id: 5, customer_name: "William Wright", company_name: "Leeds Quick Mart", required_delivery_date: isoDate(getDate(4)), delivery_address: "City Square, Leeds", delivery_city: "Leeds", delivery_state: "Leeds", delivery_country: "UK", delivery_latitude: 53.7963, longitude: -1.5478, delivery_priority: "urgent", status: "pending", selected_warehouse_name: null, warehouse_distance_km: null, driver_name: null, vehicle_type: null, vehicle_plate: null, delivery_sequence: null, items: [{ product_id: 3001, product_name: "BOPP Bags (25kg)", quantity: 500, weight_kg: 500 }], total_amount: 32000 },
    { id: 6, order_number: "ORD-2026-006", customer_id: 12, customer_name: "Rachel Patel", company_name: "Patel & Sons Wholesale", required_delivery_date: isoDate(getDate(-2)), delivery_address: "100 Customer Way, London", delivery_city: "London", delivery_state: "London", delivery_country: "UK", delivery_latitude: 51.5014, delivery_longitude: -0.1419, delivery_priority: "normal", status: "delivered", selected_warehouse_name: "London Distribution Center", warehouse_distance_km: 10.5, driver_name: "David Smith", vehicle_type: "Truck", vehicle_plate: "LX58 ABC", delivery_sequence: 1, items: [{ product_id: 1001, product_name: "Wheat Flour (Atta)", quantity: 150, weight_kg: 150 }], total_amount: 63000 },
    { id: 7, order_number: "ORD-2026-007", customer_id: 12, customer_name: "Rachel Patel", company_name: "Patel & Sons Wholesale", required_delivery_date: isoDate(getDate(3)), delivery_address: "100 Customer Way, London", delivery_city: "London", delivery_state: "London", delivery_country: "UK", delivery_latitude: 51.5014, delivery_longitude: -0.1419, delivery_priority: "urgent", status: "pending", selected_warehouse_name: null, warehouse_distance_km: null, driver_name: null, vehicle_type: null, vehicle_plate: null, delivery_sequence: null, items: [{ product_id: 1101, product_name: "Rice (Basmati)", quantity: 80, weight_kg: 80 }], total_amount: 76000 },
    { id: 8, order_number: "ORD-2026-008", customer_id: 12, customer_name: "Rachel Patel", company_name: "Patel & Sons Wholesale", required_delivery_date: isoDate(getDate(5)), delivery_address: "100 Customer Way, London", delivery_city: "London", delivery_state: "London", delivery_country: "UK", delivery_latitude: 51.5014, delivery_longitude: -0.1419, delivery_priority: "normal", status: "approved", selected_warehouse_name: "London Distribution Center", warehouse_distance_km: 10.5, driver_name: "Thomas Miller", vehicle_type: "Truck", vehicle_plate: "RE19 DEF", delivery_sequence: null, items: [{ product_id: 2001, product_name: "Red Chilli Powder", quantity: 20, weight_kg: 20 }], total_amount: 5600 },
    { id: 9, order_number: "ORD-2026-009", customer_id: 12, customer_name: "Rachel Patel", company_name: "Patel & Sons Wholesale", required_delivery_date: isoDate(getDate(-10)), delivery_address: "100 Customer Way, London", delivery_city: "London", delivery_state: "London", delivery_country: "UK", delivery_latitude: 51.5014, delivery_longitude: -0.1419, delivery_priority: "normal", status: "delivered", selected_warehouse_name: "London Distribution Center", warehouse_distance_km: 10.5, driver_name: "David Smith", vehicle_type: "Truck", vehicle_plate: "LX58 ABC", delivery_sequence: 1, items: [{ product_id: 3001, product_name: "BOPP Bags (25kg)", quantity: 300, weight_kg: 300 }], total_amount: 5400 },
    { id: 10, order_number: "ORD-2026-010", customer_id: 12, customer_name: "Rachel Patel", company_name: "Patel & Sons Wholesale", required_delivery_date: isoDate(getDate(1)), delivery_address: "100 Customer Way, London", delivery_city: "London", delivery_state: "London", delivery_country: "UK", delivery_latitude: 51.5014, delivery_longitude: -0.1419, delivery_priority: "urgent", status: "warehouse_selected", selected_warehouse_name: "Manchester Logistics Hub", warehouse_distance_km: 260.5, driver_name: null, vehicle_type: null, vehicle_plate: null, delivery_sequence: null, items: [{ product_id: 2101, product_name: "Turmeric Powder", quantity: 50, weight_kg: 50 }], total_amount: 9000 },
    { id: 11, order_number: "ORD-2026-011", customer_id: 12, customer_name: "Rachel Patel", company_name: "Patel & Sons Wholesale", required_delivery_date: isoDate(getDate(-1)), delivery_address: "100 Customer Way, London", delivery_city: "London", delivery_state: "London", delivery_country: "UK", delivery_latitude: 51.5014, delivery_longitude: -0.1419, delivery_priority: "normal", status: "dispatched", selected_warehouse_name: "London Distribution Center", warehouse_distance_km: 10.5, driver_name: "Michael Jones", vehicle_type: "Van", vehicle_plate: "BV62 XYZ", delivery_sequence: 2, items: [{ product_id: 1201, product_name: "Soybean Oil", quantity: 15, weight_kg: 15 }], total_amount: 2175 },
    { id: 12, order_number: "ORD-2026-012", customer_id: 12, customer_name: "Rachel Patel", company_name: "Patel & Sons Wholesale", required_delivery_date: isoDate(getDate(10)), delivery_address: "100 Customer Way, London", delivery_city: "London", delivery_state: "London", delivery_country: "UK", delivery_latitude: 51.5014, delivery_longitude: -0.1419, delivery_priority: "normal", status: "pending", selected_warehouse_name: null, warehouse_distance_km: null, driver_name: null, vehicle_type: null, vehicle_plate: null, delivery_sequence: null, items: [{ product_id: 2201, product_name: "Cumin Seeds", quantity: 10, weight_kg: 10 }], total_amount: 4200 },
  ];

  // Transport: Vehicles & Shipments
  const transportVehicles = [
    { id: 1, vehicle_number: "LX58 ABC", vehicle_type: "Truck", capacity_kg: 5000, capacity_volume: 50, driver_name: "David Smith", driver_phone: "+44-7700-900123", assigned_warehouse_id: 1, warehouse_name: "London Distribution Center", current_latitude: 51.5284, current_longitude: -0.2662, status: "assigned" },
    { id: 2, vehicle_number: "BV62 XYZ", vehicle_type: "Van", capacity_kg: 2000, capacity_volume: 20, driver_name: "Michael Jones", driver_phone: "+44-7700-900456", assigned_warehouse_id: 2, warehouse_name: "Manchester Logistics Hub", current_latitude: 53.4684, current_longitude: -2.3304, status: "available" },
    { id: 3, vehicle_number: "RE19 DEF", vehicle_type: "Tempo", capacity_kg: 1000, capacity_volume: 10, driver_name: "Thomas Miller", driver_phone: "+44-7700-900789", assigned_warehouse_id: 1, warehouse_name: "London Distribution Center", current_latitude: 51.5284, current_longitude: -0.2662, status: "maintenance" },
    { id: 4, vehicle_number: "KW21 GHI", vehicle_type: "Lorry", capacity_kg: 10000, capacity_volume: 100, driver_name: "Arthur Shelby", driver_phone: "+44-7700-900111", assigned_warehouse_id: null, warehouse_name: null, current_latitude: 50.9097, current_longitude: -1.4044, status: "available" },
  ];

  const transportShipments = [
    { id: 1, vehicle_id: 1, vehicle_number: "LX58 ABC", driver_name: "David Smith", driver_phone: "+44-7700-900123", origin_id: 1, origin_name: "London Distribution Center", origin_lat: 51.5284, origin_lng: -0.2662, dest_name: "London Metro Retail, Oxford St", dest_lat: 51.5145, dest_lng: -0.1444, distance_km: 12.5, customer_order_id: 1, order_number: "ORD-2026-001", status: "Delivered", dispatched_at: isoDate(getDate(6)), delivered_at: isoDate(getDate(5)) },
    { id: 2, vehicle_id: 1, vehicle_number: "LX58 ABC", driver_name: "David Smith", driver_phone: "+44-7700-900123", origin_id: 2, origin_name: "Manchester Logistics Hub", origin_lat: 53.4684, origin_lng: -2.3304, dest_name: "Manchester Central Mart, Deansgate", dest_lat: 53.4830, dest_lng: -2.2441, distance_km: 8.3, customer_order_id: 2, order_number: "ORD-2026-002", status: "Pending", dispatched_at: isoDate(getDate(1)), delivered_at: null },
    { id: 3, vehicle_id: 2, vehicle_number: "BV62 XYZ", driver_name: "Michael Jones", driver_phone: "+44-7700-900456", origin_id: 1, origin_name: "London Distribution Center", origin_lat: 51.5284, origin_lng: -0.2662, dest_name: "Greenwich FreshMart", dest_lat: 51.4826, dest_lng: -0.0077, distance_km: 15.2, customer_order_id: 3, order_number: "ORD-2026-003", status: "Pending", dispatched_at: isoDate(getDate(0)), delivered_at: null },
  ];

  // Purchases: Admin POs, Quotations, PO Items
  const purchaseOrders = [
    { id: "PO-1", supplier_id: 1, supplier_name: "London Fresh Produce Ltd", order_date: isoDate(getDate(45)), expected_delivery: isoDate(getDate(35)), total_amount: 25600, status: "Received", item_count: 2 },
    { id: "PO-2", supplier_id: 5, supplier_name: "Southampton Global Imports", order_date: isoDate(getDate(30)), expected_delivery: isoDate(getDate(15)), total_amount: 18500, status: "Sent", item_count: 3 },
    { id: "PO-3", supplier_id: 3, supplier_name: "Manchester Packaging Hub", order_date: isoDate(getDate(20)), expected_delivery: isoDate(getDate(8)), total_amount: 30000, status: "Received", item_count: 2 },
    { id: "PO-4", supplier_id: 2, supplier_name: "Birmingham Spice Merchants", order_date: isoDate(getDate(10)), expected_delivery: isoDate(getDate(-2)), total_amount: 12000, status: "Sent", item_count: 2 },
    { id: "PO-5", supplier_id: 4, supplier_name: "Liverpool Bulk Trading", order_date: isoDate(getDate(5)), expected_delivery: isoDate(getDate(-10)), total_amount: 12100, status: "Draft", item_count: 1 },
  ];

  const purchaseOrderItems = {
    "PO-1": [
      { id: 101, purchase_order_id: "PO-1", product_id: 101, product_name: "Wheat Flour (Atta)", quantity: 1200, unit_price: 44, uom: "kg" },
      { id: 102, purchase_order_id: "PO-1", product_id: 102, product_name: "Rice (Basmati)", quantity: 400, unit_price: 98, uom: "kg" },
    ],
    "PO-2": [
      { id: 201, purchase_order_id: "PO-2", product_id: 103, product_name: "Soybean Oil", quantity: 100, unit_price: 145, uom: "ltr" },
      { id: 202, purchase_order_id: "PO-2", product_id: 201, product_name: "Red Chilli Powder", quantity: 50, unit_price: 285, uom: "kg" },
      { id: 203, purchase_order_id: "PO-2", product_id: 202, product_name: "Turmeric Powder", quantity: 80, unit_price: 178, uom: "kg" },
    ],
    "PO-3": [
      { id: 301, purchase_order_id: "PO-3", product_id: 301, product_name: "BOPP Bags (25kg)", quantity: 5000, unit_price: 18, uom: "pcs" },
    ],
    "PO-4": [
      { id: 401, purchase_order_id: "PO-4", product_id: 201, product_name: "Red Chilli Powder", quantity: 100, unit_price: 280, uom: "kg" },
      { id: 402, purchase_order_id: "PO-4", product_id: 203, product_name: "Cumin Seeds", quantity: 50, unit_price: 420, uom: "kg" },
    ],
    "PO-5": [
      { id: 501, purchase_order_id: "PO-5", product_id: 102, product_name: "Rice (Basmati)", quantity: 300, unit_price: 107, uom: "kg" },
    ],
  };

  // Admin/Purchases Quotations (supplier side — different from buyer RFQs)
  const adminQuotations = [
    { id: 1, supplier_id: 1, supplier_name: "London Fresh Produce Ltd", product_id: 101, product_name: "Wheat Flour (Atta)", quantity: 1200, unit_price: 44, total_amount: 52800, status: "Accepted", created_at: isoDate(getDate(30)), delivery_due_at: isoDate(getDate(20)), allocations: [{ warehouse_name: "London Distribution Center", rack_code: "R-A1", bin_code: "B-101", quantity: 1200, barcode_id: "SKU-WHEAT-ATTA" }] },
    { id: 2, supplier_id: 2, supplier_name: "Birmingham Spice Merchants", product_id: 201, product_name: "Red Chilli Powder", quantity: 500, unit_price: 290, total_amount: 145000, status: "Pending", created_at: isoDate(getDate(10)), delivery_due_at: isoDate(getDate(-5)), allocations: [] },
    { id: 3, supplier_id: 3, supplier_name: "Manchester Packaging Hub", product_id: 301, product_name: "BOPP Bags (25kg)", quantity: 5000, unit_price: 19, total_amount: 95000, status: "Accepted", created_at: isoDate(getDate(18)), delivery_due_at: isoDate(getDate(8)), allocations: [{ warehouse_name: "London Distribution Center", rack_code: "R-A1", bin_code: "B-101", quantity: 5000, barcode_id: "SKU-BOPP-25KG" }] },
    { id: 4, supplier_id: 5, supplier_name: "Southampton Global Imports", product_id: 102, product_name: "Rice (Basmati)", quantity: 800, unit_price: 98, total_amount: 78400, status: "Rejected", created_at: isoDate(getDate(25)), delivery_due_at: isoDate(getDate(15)), allocations: [] },
    { id: 5, supplier_id: 4, supplier_name: "Liverpool Bulk Trading", product_id: 103, product_name: "Soybean Oil", quantity: 200, unit_price: 148, total_amount: 29600, status: "Pending", created_at: isoDate(getDate(5)), delivery_due_at: isoDate(getDate(-2)), allocations: [] },
  ];

  // Products (used by inventory and buyer quotation dropdowns)
  // NOTE: Inventory module expects fields like id, name, price, stock/quantity, warehouse/bins.
  const products = [
    { id: 101, name: "Wheat Flour (Atta)", barcode: "SKU-WHEAT-ATTA", price: 42, type: "finished_good", uom: "kg" },
    { id: 102, name: "Rice (Basmati)", barcode: "SKU-RICE-BASM", price: 95, type: "finished_good", uom: "kg" },
    { id: 103, name: "Soybean Oil", barcode: "SKU-SOY-OIL", price: 145, type: "finished_good", uom: "ltr" },
    { id: 201, name: "Red Chilli Powder", barcode: "SKU-CHILLI-RED", price: 280, type: "finished_good", uom: "kg" },
    { id: 202, name: "Turmeric Powder", barcode: "SKU-TURMERIC", price: 180, type: "finished_good", uom: "kg" },
    { id: 203, name: "Cumin Seeds", barcode: "SKU-CUMIN", price: 420, type: "finished_good", uom: "kg" },
    { id: 301, name: "BOPP Bags (25kg)", barcode: "SKU-BOPP-25KG", price: 18, type: "packaging", uom: "pcs" },
    { id: 302, name: "Corrugated Boxes", barcode: "SKU-BOX-CORR", price: 35, type: "packaging", uom: "pcs" },
  ];

  // Geo-Presets for easy warehouse creation

  // Warehouse + bins (Inventory module uses these)
  const warehouses = [
    { id: 1, name: "London Distribution Center", lat: 51.5284, lng: -0.2662 }, // Park Royal, London
    { id: 2, name: "Manchester Logistics Hub", lat: 53.4684, lng: -2.3304 }, // Trafford Park, Manchester
  ];

  const bins = [];
  let binId = 1;
  const zones = ["A", "B", "C", "D"];
  const prodNames = ["Wheat Flour", "Rice (Basmati)", "Soybean Oil", "Red Chilli", "Cumin Seeds", "BOPP Bags", "Corrugated Boxes", "Turmeric"];
  
  [1, 2].forEach(whId => {
    zones.forEach(zone => {
      for (let i = 1; i <= 5; i++) {
        const rackCode = `R-${zone}${i}`;
        for (let j = 1; j <= 8; j++) {
          const binCode = `B-${zone}${i}-${j}`;
          
          let stock = 0;
          let pName = null;
          const r = Math.random();
          
          // 100% Occupied for demo
          if (r < 0.05) { // 5% Low (Orange)
            stock = Math.floor(Math.random() * 1000 + 1500); // 1500 to 2500
            pName = prodNames[Math.floor(Math.random() * prodNames.length)];
          } else { // 95% Full (Green)
            stock = Math.floor(Math.random() * 800 + 4000); // 4000 to 4800
            pName = prodNames[Math.floor(Math.random() * prodNames.length)];
          }

          bins.push({
            id: binId++,
            warehouse_id: whId,
            rack_code: rackCode,
            bin_code: binCode,
            status: "Occupied",
            barcode: `BIN-${zone}${i}-${j}`,
            capacity: 5000,
            stock: stock,
            product_name: pName
          });
        }
      }
    });
  });


  // Inventory products entries (what /inventory/products returns)
  // Inventory.js expects to receive array with fields used in grouping:
  // { id, name, type, uom, barcode, price, supplier_name, stock, warehouse_name, locations, locations?, ... }
  const inventory = [
    // Wheat
    { id: 1001, name: "Wheat Flour (Atta)", type: "finished_good", uom: "kg", barcode: "SKU-WHEAT-ATTA", price: 42, supplier_name: "London Fresh Produce Ltd", stock: 1800, warehouse_id: 1, warehouse_name: "London Distribution Center", bin_id: 1, locations: "R-A1/B-101" },
    { id: 1002, name: "Wheat Flour (Atta)", type: "finished_good", uom: "kg", barcode: "SKU-WHEAT-ATTA", price: 42, supplier_name: "London Fresh Produce Ltd", stock: 400, warehouse_id: 2, warehouse_name: "Manchester Logistics Hub", bin_id: 3, locations: "R-B1/B-201" },

    // Rice
    { id: 1101, name: "Rice (Basmati)", type: "finished_good", uom: "kg", barcode: "SKU-RICE-BASM", price: 95, supplier_name: "London Fresh Produce Ltd", stock: 620, warehouse_id: 1, warehouse_name: "London Distribution Center", bin_id: 2, locations: "R-A1/B-102" },
    { id: 1102, name: "Rice (Basmati)", type: "finished_good", uom: "kg", barcode: "SKU-RICE-BASM", price: 95, supplier_name: "London Fresh Produce Ltd", stock: 120, warehouse_id: 2, warehouse_name: "Manchester Logistics Hub", bin_id: 4, locations: "R-B2/B-202" },

    // Oil
    { id: 1201, name: "Soybean Oil", type: "finished_good", uom: "ltr", barcode: "SKU-SOY-OIL", price: 145, supplier_name: "London Fresh Produce Ltd", stock: 48, warehouse_id: 1, warehouse_name: "London Distribution Center", bin_id: 1, locations: "R-A1/B-101" },

    // Chilli
    { id: 2001, name: "Red Chilli Powder", type: "finished_good", uom: "kg", barcode: "SKU-CHILLI-RED", price: 280, supplier_name: "Birmingham Spice Merchants", stock: 240, warehouse_id: 2, warehouse_name: "Manchester Logistics Hub", bin_id: 3, locations: "R-B1/B-201" },

    // Turmeric
    { id: 2101, name: "Turmeric Powder", type: "finished_good", uom: "kg", barcode: "SKU-TURMERIC", price: 180, supplier_name: "Birmingham Spice Merchants", stock: 80, warehouse_id: 1, warehouse_name: "London Distribution Center", bin_id: 2, locations: "R-A1/B-102" },

    // Cumin
    { id: 2201, name: "Cumin Seeds", type: "finished_good", uom: "kg", barcode: "SKU-CUMIN", price: 420, supplier_name: "Birmingham Spice Merchants", stock: 0, warehouse_id: 2, warehouse_name: "Manchester Logistics Hub", bin_id: 4, locations: "R-B2/B-202" },

    // Bags
    { id: 3001, name: "BOPP Bags (25kg)", type: "packaging", uom: "pcs", barcode: "SKU-BOPP-25KG", price: 18, supplier_name: "Manchester Packaging Hub", stock: 950, warehouse_id: 1, warehouse_name: "London Distribution Center", bin_id: 1, locations: "R-A1/B-101" },

    // Boxes
    { id: 3101, name: "Corrugated Boxes", type: "packaging", uom: "pcs", barcode: "SKU-BOX-CORR", price: 35, supplier_name: "Manchester Packaging Hub", stock: 140, warehouse_id: 2, warehouse_name: "Manchester Logistics Hub", bin_id: 3, locations: "R-B1/B-201" },
  ];

  // Buyer quotations (shared across BuyerDashboard + BuyerQuotations)
  let buyerQuotations = [
    { id: "RFQ-2001", buyer_id: 1, supplier_id: 1, supplier_name: "London Fresh Produce Ltd", product_id: 101, product_name: "Wheat Flour (Atta)", quantity: 1200, unit_price: 44, total: 52800, status: "Accepted", created_at: "2026-04-28", valid_until: "2026-05-28", expected_delivery: "2026-05-05", notes: "Urgent stock", supplier_notes: "Will deliver on time", credit_days: 30 },
    { id: "RFQ-2002", buyer_id: 1, supplier_id: 2, supplier_name: "Birmingham Spice Merchants", product_id: 201, product_name: "Red Chilli Powder", quantity: 500, unit_price: 290, total: 145000, status: "Pending", created_at: "2026-04-30", valid_until: "2026-05-30", expected_delivery: "2026-05-10", notes: "Fine grind only", supplier_notes: "", credit_days: 15 },
    { id: "RFQ-2003", buyer_id: 1, supplier_id: 3, supplier_name: "Manchester Packaging Hub", product_id: 301, product_name: "BOPP Bags (25kg)", quantity: 5000, unit_price: 19, total: 95000, status: "Pending", created_at: "2026-04-20", valid_until: "2026-05-20", expected_delivery: "2026-04-30", notes: "", supplier_notes: "", credit_days: 45 },
    { id: "RFQ-2004", buyer_id: 1, supplier_id: 1, supplier_name: "London Fresh Produce Ltd", product_id: 102, product_name: "Rice (Basmati)", quantity: 800, unit_price: 98, total: 78400, status: "Confirmed", created_at: "2026-04-25", valid_until: "2026-05-25", expected_delivery: "2026-05-08", notes: "Premium grade", supplier_notes: "Premium basmati confirmed", credit_days: 30 },
    { id: "RFQ-2005", buyer_id: 1, supplier_id: 2, supplier_name: "Birmingham Spice Merchants", product_id: 202, product_name: "Turmeric Powder", quantity: 350, unit_price: 175, total: 61250, status: "Rejected", created_at: "2026-04-15", valid_until: "2026-05-15", expected_delivery: "2026-04-22", notes: "", supplier_notes: "Out of stock", credit_days: 30 },
  ];

  // Buyer reorder history (used by BuyerReorders)
  const reorderHistory = [
    {
      id: 1,
      product_id: 101,
      product_name: "Wheat Flour (Atta)",
      supplier_id: 1,
      supplier_name: "London Fresh Produce Ltd",
      quantity: 1200,
      unit_price: 42,
      total_amount: 50400,
      status: "Received",
      last_order_date: "2026-04-28",
      notes: "Good quality, delivered on time",
      consumption_per_day: 60,
      days_in_stock: 40,
      price_trend: -5,
      reorder_point: 500,
      lead_time_days: 5,
    },
    {
      id: 2,
      product_id: 102,
      product_name: "Rice (Basmati)",
      supplier_id: 1,
      supplier_name: "London Fresh Produce Ltd",
      quantity: 800,
      unit_price: 95,
      total_amount: 76000,
      status: "Received",
      last_order_date: "2026-04-25",
      notes: "Premium quality basmati",
      consumption_per_day: 32,
      days_in_stock: 50,
      price_trend: 3,
      reorder_point: 350,
      lead_time_days: 7,
    },
    {
      id: 3,
      product_id: 103,
      product_name: "Soybean Oil",
      supplier_id: 1,
      supplier_name: "London Fresh Produce Ltd",
      quantity: 300,
      unit_price: 145,
      total_amount: 43500,
      status: "Accepted",
      last_order_date: "2026-04-20",
      notes: "Cold pressed oil",
      consumption_per_day: 5,
      days_in_stock: 9,
      price_trend: 8,
      reorder_point: 100,
      lead_time_days: 5,
    },
    {
      id: 4,
      product_id: 104,
      product_name: "Red Chilli Powder",
      supplier_id: 2,
      supplier_name: "Birmingham Spice Merchants",
      quantity: 500,
      unit_price: 280,
      total_amount: 140000,
      status: "Received",
      last_order_date: "2026-04-30",
      notes: "Fine grind, excellent quality",
      consumption_per_day: 20,
      days_in_stock: 42,
      price_trend: -2,
      reorder_point: 200,
      lead_time_days: 6,
    },
    {
      id: 5,
      product_id: 105,
      product_name: "Turmeric Powder",
      supplier_id: 2,
      supplier_name: "Birmingham Spice Merchants",
      quantity: 350,
      unit_price: 180,
      total_amount: 63000,
      status: "Received",
      last_order_date: "2026-04-22",
      notes: "",
      consumption_per_day: 10,
      days_in_stock: 62,
      price_trend: 0,
      reorder_point: 150,
      lead_time_days: 6,
    },
    {
      id: 6,
      product_id: 106,
      product_name: "Cumin Seeds",
      supplier_id: 2,
      supplier_name: "Birmingham Spice Merchants",
      quantity: 200,
      unit_price: 420,
      total_amount: 84000,
      status: "Confirmed",
      last_order_date: "2026-04-18",
      notes: "Fresh crop seeds",
      consumption_per_day: 4,
      days_in_stock: 70,
      price_trend: 5,
      reorder_point: 100,
      lead_time_days: 8,
    },
    {
      id: 7,
      product_id: 107,
      product_name: "BOPP Bags (25kg)",
      supplier_id: 3,
      supplier_name: "Manchester Packaging Hub",
      quantity: 5000,
      unit_price: 18,
      total_amount: 90000,
      status: "Received",
      last_order_date: "2026-04-10",
      notes: "Durable bags, 50 micron thickness",
      consumption_per_day: 200,
      days_in_stock: 42,
      price_trend: -3,
      reorder_point: 2000,
      lead_time_days: 4,
    },
    {
      id: 8,
      product_id: 108,
      product_name: "Corrugated Boxes",
      supplier_id: 3,
      supplier_name: "Manchester Packaging Hub",
      quantity: 2000,
      unit_price: 35,
      total_amount: 70000,
      status: "Received",
      last_order_date: "2026-03-28",
      notes: "Standard brown corrugated boxes",
      consumption_per_day: 80,
      days_in_stock: 40,
      price_trend: 2,
      reorder_point: 800,
      lead_time_days: 5,
    },
  ];

  const salesOrders = [
    { id: "SO-1", customer_id: 1, customer_name: "London Metro Retail", order_number: "SO-2026-001", created_at: getDate(60).toISOString(), total_amount: 8500, status: "delivered", delivery_date: isoDate(getDate(50)) },
    { id: "SO-2", customer_id: 2, customer_name: "Manchester Central Mart", order_number: "SO-2026-002", created_at: getDate(50).toISOString(), total_amount: 12300, status: "delivered", delivery_date: isoDate(getDate(42)) },
  ];

  const ledgerEntries = [
    { id: 1000001, date: isoDate(getDate(50)), description: "Sales Revenue - ORD-2026-001", type: "Credit", amount: 85000, status: "Completed", category: "Sales Revenue", source: "auto", reference: "ORD-2026-001" },
    { id: 1000002, date: isoDate(getDate(42)), description: "Sales Revenue - ORD-2026-002", type: "Credit", amount: 123000, status: "Completed", category: "Sales Revenue", source: "auto", reference: "ORD-2026-002" },
    { id: 1000003, date: isoDate(getDate(28)), description: "Sales Revenue - ORD-2026-003", type: "Credit", amount: 112000, status: "Completed", category: "Sales Revenue", source: "auto", reference: "ORD-2026-003" },
    { id: 2000001, date: isoDate(getDate(45)), description: "Cost of Goods - PO-1", type: "Debit", amount: 25600, status: "Completed", category: "Cost of Goods", source: "auto", reference: "PO-1" },
    { id: 2000002, date: isoDate(getDate(20)), description: "Cost of Goods - PO-3", type: "Debit", amount: 30000, status: "Completed", category: "Cost of Goods", source: "auto", reference: "PO-3" },
  ];

  // ── Advanced Inventory seed data ──────────────────────────────────────────
  const advBatches = [
    { id: 1, product_id: 1001, product_name: "Wheat Flour (Atta)", batch_number: "BATCH-2026-001", lot_number: "LOT-WH-A01", warehouse_id: 1, warehouse_name: "London Distribution Center", bin_id: 1, bin_location: "R-A1/B-101", quantity_received: 500, quantity_available: 420, quantity_consumed: 80, best_before_date: isoDate(getDate(-5)), manufacture_date: "2026-01-15", supplier_id: 1, supplier_name: "London Fresh Produce Ltd", status: "active", created_at: "2026-01-20", notes: "Premium grade wheat flour" },
    { id: 2, product_id: 1001, product_name: "Wheat Flour (Atta)", batch_number: "BATCH-2026-002", lot_number: "LOT-WH-A02", warehouse_id: 1, warehouse_name: "London Distribution Center", bin_id: 1, bin_location: "R-A1/B-101", quantity_received: 600, quantity_available: 580, quantity_consumed: 20, best_before_date: "2026-09-15", manufacture_date: "2026-03-15", supplier_id: 1, supplier_name: "London Fresh Produce Ltd", status: "active", created_at: "2026-03-20", notes: "" },
    { id: 3, product_id: 1101, product_name: "Rice (Basmati)", batch_number: "BATCH-2026-003", lot_number: "LOT-RC-B01", warehouse_id: 1, warehouse_name: "London Distribution Center", bin_id: 2, bin_location: "R-A1/B-102", quantity_received: 400, quantity_available: 310, quantity_consumed: 90, best_before_date: "2026-12-01", manufacture_date: "2026-02-01", supplier_id: 1, supplier_name: "London Fresh Produce Ltd", status: "active", created_at: "2026-02-05", notes: "Aged basmati, premium" },
    { id: 4, product_id: 1102, product_name: "Rice (Basmati)", batch_number: "BATCH-2026-004", lot_number: "LOT-RC-B02", warehouse_id: 2, warehouse_name: "Manchester Logistics Hub", bin_id: 4, bin_location: "R-B2/B-202", quantity_received: 200, quantity_available: 120, quantity_consumed: 80, best_before_date: isoDate(getDate(12)), manufacture_date: "2025-12-10", supplier_id: 1, supplier_name: "London Fresh Produce Ltd", status: "active", created_at: "2025-12-15", notes: "" },
    { id: 5, product_id: 1201, product_name: "Soybean Oil", batch_number: "BATCH-2026-005", lot_number: "LOT-OIL-01", warehouse_id: 1, warehouse_name: "London Distribution Center", bin_id: 1, bin_location: "R-A1/B-101", quantity_received: 100, quantity_available: 48, quantity_consumed: 52, best_before_date: isoDate(getDate(3)), manufacture_date: "2025-11-01", supplier_id: 1, supplier_name: "London Fresh Produce Ltd", status: "active", created_at: "2025-11-05", notes: "Cold pressed" },
    { id: 6, product_id: 2001, product_name: "Red Chilli Powder", batch_number: "BATCH-2026-006", lot_number: "LOT-SP-C01", warehouse_id: 2, warehouse_name: "Manchester Logistics Hub", bin_id: 3, bin_location: "R-B1/B-201", quantity_received: 250, quantity_available: 240, quantity_consumed: 10, best_before_date: "2027-04-30", manufacture_date: "2026-04-01", supplier_id: 2, supplier_name: "Birmingham Spice Merchants", status: "active", created_at: "2026-04-05", notes: "Fine grind, Grade A" },
    { id: 7, product_id: 2101, product_name: "Turmeric Powder", batch_number: "BATCH-2026-007", lot_number: "LOT-SP-T01", warehouse_id: 1, warehouse_name: "London Distribution Center", bin_id: 2, bin_location: "R-A1/B-102", quantity_received: 150, quantity_available: 80, quantity_consumed: 70, best_before_date: isoDate(getDate(25)), manufacture_date: "2025-10-01", supplier_id: 2, supplier_name: "Birmingham Spice Merchants", status: "active", created_at: "2025-10-05", notes: "" },
    { id: 8, product_id: 3001, product_name: "BOPP Bags (25kg)", batch_number: "BATCH-2026-008", lot_number: "LOT-PK-B01", warehouse_id: 1, warehouse_name: "London Distribution Center", bin_id: 1, bin_location: "R-A1/B-101", quantity_received: 3000, quantity_available: 950, quantity_consumed: 2050, best_before_date: null, manufacture_date: "2026-01-10", supplier_id: 3, supplier_name: "Manchester Packaging Hub", status: "active", created_at: "2026-01-15", notes: "50 micron thickness" },
    { id: 9, product_id: 2201, product_name: "Cumin Seeds", batch_number: "BATCH-2026-009", lot_number: "LOT-SP-CU1", warehouse_id: 2, warehouse_name: "Manchester Logistics Hub", bin_id: 4, bin_location: "R-B2/B-202", quantity_received: 200, quantity_available: 0, quantity_consumed: 200, best_before_date: isoDate(getDate(-30)), manufacture_date: "2025-06-01", supplier_id: 2, supplier_name: "Birmingham Spice Merchants", status: "depleted", created_at: "2025-06-05", notes: "Fully consumed" },
    { id: 10, product_id: 3101, product_name: "Corrugated Boxes", batch_number: "BATCH-2026-010", lot_number: "LOT-PK-CB1", warehouse_id: 2, warehouse_name: "Manchester Logistics Hub", bin_id: 3, bin_location: "R-B1/B-201", quantity_received: 1000, quantity_available: 140, quantity_consumed: 860, best_before_date: null, manufacture_date: "2026-02-15", supplier_id: 3, supplier_name: "Manchester Packaging Hub", status: "active", created_at: "2026-02-20", notes: "" },
  ];

  const advCycleCounts = [
    { id: 1, cycle_code: "CC-2026-001", warehouse_id: 1, warehouse_name: "London Distribution Center", cycle_type: "full", zone_name: "", planned_date: isoDate(getDate(2)), started_at: isoDate(getDate(2)), completed_at: isoDate(getDate(1)), status: "completed", items_counted: 5, items_total: 5, variance_count: 1, notes: "Annual full count" },
    { id: 2, cycle_code: "CC-2026-002", warehouse_id: 2, warehouse_name: "Manchester Logistics Hub", cycle_type: "zone", zone_name: "Zone B1 - Spices", planned_date: isoDate(getDate(0)), started_at: isoDate(getDate(0)), completed_at: null, status: "in_progress", items_counted: 2, items_total: 4, variance_count: 0, notes: "Zone B1 spot check" },
    { id: 3, cycle_code: "CC-2026-003", warehouse_id: 1, warehouse_name: "London Distribution Center", cycle_type: "partial", zone_name: "", planned_date: isoDate(getDate(-3)), started_at: null, completed_at: null, status: "planned", items_counted: 0, items_total: 3, variance_count: 0, notes: "Quarterly partial count - oils" },
    { id: 4, cycle_code: "CC-2026-004", warehouse_id: 2, warehouse_name: "Manchester Logistics Hub", cycle_type: "full", zone_name: "", planned_date: isoDate(getDate(-7)), started_at: null, completed_at: null, status: "planned", items_counted: 0, items_total: 6, variance_count: 0, notes: "Scheduled full count Manchester" },
    { id: 5, cycle_code: "CC-2026-005", warehouse_id: 1, warehouse_name: "London Distribution Center", cycle_type: "zone", zone_name: "Zone A1 - Grains", planned_date: isoDate(getDate(10)), started_at: isoDate(getDate(10)), completed_at: isoDate(getDate(9)), status: "completed", items_counted: 3, items_total: 3, variance_count: 2, notes: "Grains zone recount due to variance" },
  ];

  const advScanHistory = [
    { id: 1, barcode: "SKU-WHEAT-ATTA", product_name: "Wheat Flour (Atta)", scan_type: "inbound", warehouse_name: "London Distribution Center", bin_location: "R-A1/B-101", quantity_scanned: 500, timestamp: getDate(1).toISOString(), valid: true, error_message: null, session_id: "SESS-001" },
    { id: 2, barcode: "SKU-RICE-BASM", product_name: "Rice (Basmati)", scan_type: "outbound", warehouse_name: "London Distribution Center", bin_location: "R-A1/B-102", quantity_scanned: 50, timestamp: getDate(1).toISOString(), valid: true, error_message: null, session_id: "SESS-001" },
    { id: 3, barcode: "BIN-A1-101", product_name: null, scan_type: "cycle_count", warehouse_name: "London Distribution Center", bin_location: "R-A1/B-101", quantity_scanned: 1, timestamp: getDate(2).toISOString(), valid: true, error_message: null, session_id: "SESS-002" },
    { id: 4, barcode: "INVALID-CODE", product_name: null, scan_type: "inbound", warehouse_name: "Manchester Logistics Hub", bin_location: null, quantity_scanned: 0, timestamp: getDate(2).toISOString(), valid: false, error_message: "Barcode not found in system", session_id: "SESS-002" },
    { id: 5, barcode: "SKU-CHILLI-RED", product_name: "Red Chilli Powder", scan_type: "transfer", warehouse_name: "Manchester Logistics Hub", bin_location: "R-B1/B-201", quantity_scanned: 100, timestamp: getDate(3).toISOString(), valid: true, error_message: null, session_id: "SESS-003" },
    { id: 6, barcode: "SKU-SOY-OIL", product_name: "Soybean Oil", scan_type: "adjustment", warehouse_name: "London Distribution Center", bin_location: "R-A1/B-101", quantity_scanned: 5, timestamp: getDate(4).toISOString(), valid: true, error_message: null, session_id: "SESS-003" },
    { id: 7, barcode: "SKU-BOPP-25KG", product_name: "BOPP Bags (25kg)", scan_type: "outbound", warehouse_name: "London Distribution Center", bin_location: "R-A1/B-101", quantity_scanned: 200, timestamp: getDate(5).toISOString(), valid: true, error_message: null, session_id: "SESS-004" },
    { id: 8, barcode: "SKU-TURMERIC", product_name: "Turmeric Powder", scan_type: "inbound", warehouse_name: "London Distribution Center", bin_location: "R-A1/B-102", quantity_scanned: 150, timestamp: getDate(6).toISOString(), valid: true, error_message: null, session_id: "SESS-004" },
  ];

  const computeExpiryAlerts = () => {
    const alerts = [];
    let alertId = 1;
    for (const b of advBatches) {
      if (!b.best_before_date || b.status === "depleted") continue;
      const bbDate = new Date(b.best_before_date);
      const daysRemaining = Math.ceil((bbDate - today) / (1000 * 60 * 60 * 24));
      let alert_type = null;
      if (daysRemaining <= 0) alert_type = "expired";
      else if (daysRemaining <= 7) alert_type = "critical";
      else if (daysRemaining <= 30) alert_type = "warning";
      if (alert_type) {
        alerts.push({
          id: alertId++,
          batch_id: b.id,
          batch_number: b.batch_number,
          product_id: b.product_id,
          product_name: b.product_name,
          warehouse_name: b.warehouse_name,
          best_before_date: b.best_before_date,
          days_remaining: daysRemaining,
          alert_type,
          quantity_at_risk: b.quantity_available,
          acknowledged: false,
          acknowledged_at: null,
          action_taken: null,
        });
      }
    }
    return alerts;
  };

  const advExpiryAlerts = computeExpiryAlerts();

  return {
    meta: { seededAt: Date.now(), version: 1 },
    auth: {
      erp_token: null,
      erp_user: null,
      token: null,
    },
    suppliers,
    products,
    customers,
    customerOrders,
    transport: { vehicles: transportVehicles, shipments: transportShipments },
    purchases: { orders: purchaseOrders, orderItems: purchaseOrderItems, quotations: adminQuotations },
    warehouse: { 
      warehouses, 
      bins,
      rack_positions: {
        "R-A1": [0, 0, 0],
        "R-B1": [15, 0, 0],
        "R-B2": [15, 0, 10]
      }
    },
    inventory: { products: inventory },
    buyer: { quotations: buyerQuotations, purchaseOrders, reorderHistory },
    finance: { purchaseOrders, salesOrders, ledgerEntries },
    advancedInventory: {
      batches: advBatches,
      cycleCounts: advCycleCounts,
      scanHistory: advScanHistory,
      expiryAlerts: advExpiryAlerts,
    },
    dispatcher: {
      assignments: [
        {
          id: 1, shipment_id: "SHP-2026-001", driver_id: 10, driver_name: "David Smith", vehicle_number: "LX58 ABC",
          status: "assigned", assigned_at: isoDate(getDate(0)),
          warehouse_id: 1, warehouse_name: "London Distribution Center", warehouse_lat: 51.5284, warehouse_lng: -0.2662,
          delivery_address: "12 Oxford Street, London", delivery_lat: 51.5145, delivery_lng: -0.1444,
          route_details: "London Distribution Center → Oxford Street", total_distance_km: 12.5,
          delivery_date: isoDate(getDate(-1)), estimated_time: "14:30 PM", navigation_url: "https://maps.google.com/?q=51.5145,-0.1444",
          items: [
            { product_id: 1001, product_name: "Wheat Flour (Atta)", quantity: 200, unit: "kg", bin_id: 1, rack_code: "R-A1", bin_code: "B-101", bin_location: "R-A1/B-101", picked: false },
            { product_id: 1201, product_name: "Soybean Oil", quantity: 20, unit: "ltr", bin_id: 1, rack_code: "R-A1", bin_code: "B-101", bin_location: "R-A1/B-101", picked: false },
            { product_id: 1101, product_name: "Rice (Basmati)", quantity: 100, unit: "kg", bin_id: 2, rack_code: "R-A1", bin_code: "B-102", bin_location: "R-A1/B-102", picked: false },
          ],
        },
        {
          id: 2, shipment_id: "SHP-2026-002", driver_id: 10, driver_name: "David Smith", vehicle_number: "LX58 ABC",
          status: "picking", assigned_at: isoDate(getDate(1)),
          warehouse_id: 2, warehouse_name: "Manchester Logistics Hub", warehouse_lat: 53.4684, warehouse_lng: -2.3304,
          delivery_address: "56 Deansgate, Manchester", delivery_lat: 53.4830, delivery_lng: -2.2441,
          route_details: "Manchester Logistics Hub → Deansgate", total_distance_km: 8.3,
          delivery_date: isoDate(getDate(-2)), estimated_time: "11:00 AM", navigation_url: "https://maps.google.com/?q=53.4830,-2.2441",
          items: [
            { product_id: 2001, product_name: "Red Chilli Powder", quantity: 50, unit: "kg", bin_id: 3, rack_code: "R-B1", bin_code: "B-201", bin_location: "R-B1/B-201", picked: true },
            { product_id: 3101, product_name: "Corrugated Boxes", quantity: 200, unit: "pcs", bin_id: 3, rack_code: "R-B1", bin_code: "B-201", bin_location: "R-B1/B-201", picked: false },
            { product_id: 1102, product_name: "Rice (Basmati)", quantity: 60, unit: "kg", bin_id: 4, rack_code: "R-B2", bin_code: "B-202", bin_location: "R-B2/B-202", picked: false },
          ],
        },
        {
          id: 3, shipment_id: "SHP-2026-003", driver_id: 10, driver_name: "David Smith", vehicle_number: "LX58 ABC",
          status: "delivered", assigned_at: isoDate(getDate(5)),
          warehouse_id: 1, warehouse_name: "London Distribution Center", warehouse_lat: 51.5284, warehouse_lng: -0.2662,
          delivery_address: "Greenwich High Road, London", delivery_lat: 51.4826, delivery_lng: -0.0077,
          route_details: "London Distribution Center → Greenwich", total_distance_km: 15.2,
          delivery_date: isoDate(getDate(5)), estimated_time: "10:15 AM", navigation_url: "https://maps.google.com/?q=51.4826,-0.0077",
          items: [
            { product_id: 1001, product_name: "Wheat Flour (Atta)", quantity: 300, unit: "kg", bin_id: 1, rack_code: "R-A1", bin_code: "B-101", bin_location: "R-A1/B-101", picked: true },
            { product_id: 2101, product_name: "Turmeric Powder", quantity: 30, unit: "kg", bin_id: 2, rack_code: "R-A1", bin_code: "B-102", bin_location: "R-A1/B-102", picked: true },
          ],
        },
      ],
      notifications: [
        { id: 1, driver_id: 10, title: "New Assignment", message: "You have been assigned Shipment SHP-2026-001 at London Distribution Center. 3 items to pick.", type: "assignment", related_id: 1, is_read: false, created_at: getDate(0).toISOString() },
        { id: 2, driver_id: 10, title: "Picking In Progress", message: "Shipment SHP-2026-002 at Manchester Logistics Hub — 1 of 3 items picked.", type: "update", related_id: 2, is_read: false, created_at: getDate(1).toISOString() },
        { id: 3, driver_id: 10, title: "Delivery Completed", message: "Shipment SHP-2026-003 delivered to Greenwich High Road, London.", type: "update", related_id: 3, is_read: true, created_at: getDate(5).toISOString() },
        { id: 4, driver_id: 10, title: "Reminder", message: "Delivery for SHP-2026-001 is due today. Please proceed to London Distribution Center.", type: "reminder", related_id: 1, is_read: false, created_at: getDate(0).toISOString() },
      ],
    },
    supportTickets: [
      // ── Active / Open tickets ─────────────────────────────────────────
      { id: 1, ticket_number: "TKT-1001", customer_id: 12, customer_name: "Rachel Patel", category: "delivery", subject: "Shipment delay for ORD-2026-011", description: "My shipment ORD-2026-011 was dispatched 3 days ago but hasn't arrived. Tracking shows no movement since yesterday.", status: "open", priority: "high", order_number: "ORD-2026-011", assigned_to: "Agent Sarah", created_at: isoDate(getDate(1)), updated_at: isoDate(getDate(0)), sla_due_at: new Date(getDate(1).getTime() + 1000 * 60 * 60 * 48).toISOString(), messages: [
        { id: 1, user_id: 12, username: "Rachel Patel", message: "My shipment ORD-2026-011 was dispatched but it hasn't arrived yet. The SLA timer shows a potential delay. Can you check what is happening with the driver?", created_at: new Date(getDate(1).getTime() + 1000 * 60 * 30).toISOString() },
        { id: 2, user_id: 99, username: "Agent Sarah", message: "Hello! I've checked with the logistics team. David Smith is currently en route. The truck was held up briefly at the M25 junction due to roadworks, but he is back on track. Expected arrival is within 45 minutes.", created_at: new Date(getDate(1).getTime() + 1000 * 60 * 45).toISOString() },
        { id: 3, user_id: 12, username: "Rachel Patel", message: "It's been over an hour now and still no delivery. Can you provide a live ETA?", created_at: new Date(getDate(0).getTime() + 1000 * 60 * 10).toISOString() }
      ] },

      { id: 2, ticket_number: "TKT-1002", customer_id: 12, customer_name: "Rachel Patel", category: "product", subject: "Damaged packaging on Atta bags - ORD-2026-006", description: "Two bags of Wheat Flour (Atta) were torn upon delivery. Flour was leaking from the packaging. We require credit or replacement.", status: "resolved", priority: "medium", order_number: "ORD-2026-006", assigned_to: "Dispatcher Admin", created_at: isoDate(getDate(12)), updated_at: isoDate(getDate(10)), resolved_at: isoDate(getDate(10)), resolution_summary: "Credit note of £84.00 approved for 2 damaged units.", sla_due_at: new Date(getDate(12).getTime() + 1000 * 60 * 60 * 72).toISOString(), messages: [
        { id: 4, user_id: 12, username: "Rachel Patel", message: "Two bags of Wheat Flour (Atta) were torn upon delivery. We require credit or replacement.", created_at: isoDate(getDate(12)) },
        { id: 5, user_id: 99, username: "Dispatcher Admin", message: "Apologies for the inconvenience. I've raised this with the warehouse team. Could you please share a photo of the damaged bags?", created_at: new Date(getDate(12).getTime() + 1000 * 60 * 60 * 1).toISOString() },
        { id: 6, user_id: 12, username: "Rachel Patel", message: "Photos attached to the ticket. Both bags have tears along the seam.", created_at: new Date(getDate(12).getTime() + 1000 * 60 * 60 * 2).toISOString() },
        { id: 7, user_id: 99, username: "Dispatcher Admin", message: "We have verified this with the delivery driver's scan logs and warehouse CCTV. Approved a credit note of £84.00 (2 units x £42.00) to your account balance. The credit will appear within 24 hours.", created_at: new Date(getDate(11).getTime()).toISOString() },
        { id: 8, user_id: 12, username: "Rachel Patel", message: "Thank you, that is perfect. Credit received.", created_at: new Date(getDate(10).getTime()).toISOString() }
      ] },

      { id: 3, ticket_number: "TKT-1003", customer_id: 12, customer_name: "Rachel Patel", category: "order", subject: "Modify item quantity for ORD-2026-012", description: "I would like to increase the quantity of Cumin Seeds from 10 to 25 units since the order is still pending.", status: "open", priority: "low", order_number: "ORD-2026-012", assigned_to: "Unassigned", created_at: isoDate(getDate(0)), updated_at: isoDate(getDate(0)), sla_due_at: new Date(getDate(0).getTime() + 1000 * 60 * 60 * 96).toISOString(), messages: [
        { id: 9, user_id: 12, username: "Rachel Patel", message: "I would like to increase the quantity of Cumin Seeds from 10 to 25 units for ORD-2026-012 since it is still in pending status. Is that possible?", created_at: new Date().toISOString() }
      ] },

      // ── In-progress tickets ──────────────────────────────────────────
      { id: 4, ticket_number: "TKT-1004", customer_id: 12, customer_name: "Rachel Patel", category: "billing", subject: "Invoice discrepancy on ORD-2026-008", description: "The invoice shows £1,250 but the agreed B2B price was £1,100. Please review the pricing applied.", status: "in-progress", priority: "high", order_number: "ORD-2026-008", assigned_to: "Finance Team", created_at: isoDate(getDate(3)), updated_at: isoDate(getDate(1)), sla_due_at: new Date(getDate(3).getTime() + 1000 * 60 * 60 * 48).toISOString(), messages: [
        { id: 10, user_id: 12, username: "Rachel Patel", message: "The invoice for ORD-2026-008 shows £1,250 but the agreed negotiated B2B price was £1,100. There's a £150 overcharge. Please review the pricing applied to this order.", created_at: isoDate(getDate(3)) },
        { id: 11, user_id: 99, username: "Agent Sarah", message: "Thank you for flagging this. I'm escalating to the Finance Team to review the pricing structure applied. We'll get back to you within 24 hours.", created_at: new Date(getDate(3).getTime() + 1000 * 60 * 60 * 2).toISOString() },
        { id: 12, user_id: 98, username: "Finance Team", message: "We've identified the issue -- the system applied standard pricing instead of your negotiated contract rate. A corrected invoice will be issued today, and the difference of £150 will be credited to your account.", created_at: isoDate(getDate(1)) }
      ] },

      { id: 5, ticket_number: "TKT-1005", customer_id: 12, customer_name: "Rachel Patel", category: "product", subject: "Wrong item received - ordered Basmati Rice, got Sona Masoori", description: "Order ORD-2026-009 was supposed to contain 50 units of Basmati Rice Premium but we received Sona Masoori Rice instead.", status: "in-progress", priority: "urgent", order_number: "ORD-2026-009", assigned_to: "Warehouse Manager", created_at: isoDate(getDate(2)), updated_at: isoDate(getDate(1)), sla_due_at: new Date(getDate(2).getTime() + 1000 * 60 * 60 * 24).toISOString(), messages: [
        { id: 13, user_id: 12, username: "Rachel Patel", message: "We received 50 units of Sona Masoori Rice instead of Basmati Rice Premium. This is for a client order and we need the correct stock urgently.", created_at: isoDate(getDate(2)) },
        { id: 14, user_id: 99, username: "Agent Sarah", message: "I sincerely apologize for this mix-up. I've flagged this as urgent and escalated to the Warehouse Manager. We'll arrange a swap delivery within 24 hours.", created_at: new Date(getDate(2).getTime() + 1000 * 60 * 30).toISOString() },
        { id: 15, user_id: 97, username: "Warehouse Manager", message: "Confirmed -- the picking error has been traced to Bin A3-02. Correct stock (Basmati Rice Premium x50) is being picked now. A replacement vehicle will be dispatched tomorrow morning. Please keep the Sona Masoori for now, our driver will collect it during the swap.", created_at: isoDate(getDate(1)) }
      ] },

      // ── On-hold ticket ───────────────────────────────────────────────
      { id: 6, ticket_number: "TKT-1006", customer_id: 12, customer_name: "Rachel Patel", category: "general", subject: "Request for monthly statement of account", description: "We need a detailed monthly statement showing all orders, payments, credits, and outstanding balance for the last 3 months for our audit.", status: "on-hold", priority: "low", order_number: null, assigned_to: "Finance Team", created_at: isoDate(getDate(7)), updated_at: isoDate(getDate(4)), sla_due_at: new Date(getDate(7).getTime() + 1000 * 60 * 60 * 120).toISOString(), messages: [
        { id: 16, user_id: 12, username: "Rachel Patel", message: "Our finance department requires a detailed statement of account covering the last 3 months. This should include all orders, payments received, credit notes, and outstanding balance.", created_at: isoDate(getDate(7)) },
        { id: 17, user_id: 98, username: "Finance Team", message: "We can prepare this. The statement is being compiled and will include order-level detail. Placing this on hold until the report is generated -- estimated 2 business days.", created_at: isoDate(getDate(5)) },
        { id: 18, user_id: 0, username: "System", message: "Ticket placed on hold. Reason: Awaiting report generation by Finance Team.", created_at: isoDate(getDate(4)) }
      ] },

      // ── Closed tickets ───────────────────────────────────────────────
      { id: 7, ticket_number: "TKT-1007", customer_id: 12, customer_name: "Rachel Patel", category: "delivery", subject: "Delivery time window request for ORD-2026-005", description: "We need all deliveries to arrive between 6 AM and 9 AM due to our warehouse receiving hours. Please update our delivery preferences.", status: "closed", priority: "medium", order_number: "ORD-2026-005", assigned_to: "Agent Sarah", created_at: isoDate(getDate(20)), updated_at: isoDate(getDate(18)), resolved_at: isoDate(getDate(18)), resolution_summary: "Delivery time preference updated in customer profile. All future orders will be scheduled for 6-9 AM window.", sla_due_at: new Date(getDate(20).getTime() + 1000 * 60 * 60 * 72).toISOString(), messages: [
        { id: 19, user_id: 12, username: "Rachel Patel", message: "Can you set our preferred delivery window to 6 AM - 9 AM? Our receiving dock closes after 9 AM and we've had drivers arrive at noon.", created_at: isoDate(getDate(20)) },
        { id: 20, user_id: 99, username: "Agent Sarah", message: "Absolutely. I've updated your customer profile with the preferred delivery window of 06:00-09:00. All future dispatch planning will respect this constraint. Is there anything else?", created_at: isoDate(getDate(19)) },
        { id: 21, user_id: 12, username: "Rachel Patel", message: "That's all, thank you!", created_at: isoDate(getDate(18)) },
        { id: 22, user_id: 0, username: "System", message: "Ticket resolved and closed. Delivery time preference updated in customer profile.", created_at: isoDate(getDate(18)) }
      ] },

      { id: 8, ticket_number: "TKT-1008", customer_id: 12, customer_name: "Rachel Patel", category: "billing", subject: "Payment confirmation for INV-2026-041", description: "We made a bank transfer of £3,450 on May 10th for invoice INV-2026-041. Please confirm receipt and update our outstanding balance.", status: "closed", priority: "low", order_number: null, assigned_to: "Finance Team", created_at: isoDate(getDate(15)), updated_at: isoDate(getDate(13)), resolved_at: isoDate(getDate(13)), resolution_summary: "Payment of £3,450 confirmed and applied to invoice INV-2026-041. Outstanding balance updated.", sla_due_at: new Date(getDate(15).getTime() + 1000 * 60 * 60 * 96).toISOString(), messages: [
        { id: 23, user_id: 12, username: "Rachel Patel", message: "We made a BACS transfer of £3,450.00 on May 10th for invoice INV-2026-041 (ref: SWD-PAY-0510). Please confirm receipt.", created_at: isoDate(getDate(15)) },
        { id: 24, user_id: 98, username: "Finance Team", message: "Payment of £3,450.00 has been received and matched to invoice INV-2026-041. Your outstanding balance is now £0.00. Thank you for the prompt payment.", created_at: isoDate(getDate(13)) },
        { id: 25, user_id: 0, username: "System", message: "Ticket resolved and closed. Payment confirmed.", created_at: isoDate(getDate(13)) }
      ] },

      // ── Tickets from other customers (admin visibility) ──────────────
      { id: 9, ticket_number: "TKT-1009", customer_id: 1, customer_name: "James Wilson", category: "delivery", subject: "Partial delivery received - missing 20 units", description: "Order ORD-2026-001 was supposed to have 50 units of Sugar but only 30 arrived. Driver confirmed he couldn't fit all boxes.", status: "open", priority: "high", order_number: "ORD-2026-001", assigned_to: "Warehouse Manager", created_at: isoDate(getDate(1)), updated_at: isoDate(getDate(0)), sla_due_at: new Date(getDate(1).getTime() + 1000 * 60 * 60 * 48).toISOString(), messages: [
        { id: 26, user_id: 1, username: "James Wilson", message: "Only received 30 out of 50 units of Sugar. The driver said the remaining 20 units wouldn't fit in the vehicle. When will the rest be delivered?", created_at: isoDate(getDate(1)) },
        { id: 27, user_id: 97, username: "Warehouse Manager", message: "Apologies, this was a vehicle capacity issue. The remaining 20 units have been loaded onto tomorrow's route. Expected delivery by 8 AM.", created_at: new Date(getDate(1).getTime() + 1000 * 60 * 60 * 3).toISOString() }
      ] },

      { id: 10, ticket_number: "TKT-1010", customer_id: 2, customer_name: "Emma Thompson", category: "order", subject: "Cancel order ORD-2026-003 - duplicate submission", description: "I accidentally submitted ORD-2026-003 twice. Please cancel the duplicate order.", status: "resolved", priority: "medium", order_number: "ORD-2026-003", assigned_to: "Agent Sarah", created_at: isoDate(getDate(8)), updated_at: isoDate(getDate(7)), resolved_at: isoDate(getDate(7)), resolution_summary: "Duplicate order cancelled. No charges applied.", sla_due_at: new Date(getDate(8).getTime() + 1000 * 60 * 60 * 72).toISOString(), messages: [
        { id: 28, user_id: 2, username: "Emma Thompson", message: "I accidentally submitted order ORD-2026-003 twice due to a browser refresh. Please cancel the duplicate.", created_at: isoDate(getDate(8)) },
        { id: 29, user_id: 99, username: "Agent Sarah", message: "No worries! I've cancelled the duplicate order. The original order remains active and will be processed as normal. No charges will be applied for the cancelled order.", created_at: isoDate(getDate(7)) }
      ] },

      { id: 11, ticket_number: "TKT-1011", customer_id: 3, customer_name: "Oliver Brown", category: "product", subject: "Received expired batch of Turmeric Powder", description: "The batch of Turmeric Powder received in our last order has an expiry date of March 2026 which has already passed. This is a food safety concern.", status: "in-progress", priority: "urgent", order_number: "ORD-2026-004", assigned_to: "Quality Assurance", created_at: isoDate(getDate(1)), updated_at: isoDate(getDate(0)), sla_due_at: new Date(getDate(1).getTime() + 1000 * 60 * 60 * 24).toISOString(), messages: [
        { id: 30, user_id: 3, username: "Oliver Brown", message: "The batch of Turmeric Powder (Batch #TUR-2025-112) has an expiry date of March 2026 which has already passed. This is a food safety violation and we need an immediate replacement and full credit.", created_at: isoDate(getDate(1)) },
        { id: 31, user_id: 99, username: "Agent Sarah", message: "This is very concerning and I've escalated this immediately to our Quality Assurance team. Please do not sell or use this batch. A full replacement and credit will be arranged.", created_at: new Date(getDate(1).getTime() + 1000 * 60 * 15).toISOString() },
        { id: 32, user_id: 96, username: "Quality Assurance", message: "We've initiated a batch recall for TUR-2025-112. This affects 3 shipments. A collection will be arranged and a full credit note issued. We're also conducting an internal investigation into how expired stock was dispatched.", created_at: isoDate(getDate(0)) }
      ] },

      { id: 12, ticket_number: "TKT-1012", customer_id: 4, customer_name: "Sophie Davis", category: "general", subject: "Request for bulk pricing catalogue", description: "We're expanding operations and need the latest bulk pricing catalogue for quantities above 500 units per SKU.", status: "closed", priority: "low", order_number: null, assigned_to: "Sales Team", created_at: isoDate(getDate(25)), updated_at: isoDate(getDate(22)), resolved_at: isoDate(getDate(22)), resolution_summary: "Bulk pricing catalogue sent via email. Account upgraded to Tier 2 pricing.", sla_due_at: new Date(getDate(25).getTime() + 1000 * 60 * 60 * 120).toISOString(), messages: [
        { id: 33, user_id: 4, username: "Sophie Davis", message: "We're expanding our retail operations and would like the latest bulk pricing catalogue for quantities above 500 units per SKU. Can you also tell us about volume discount tiers?", created_at: isoDate(getDate(25)) },
        { id: 34, user_id: 95, username: "Sales Team", message: "Great to hear about your expansion! I've attached our latest bulk pricing catalogue. For 500+ units, you qualify for Tier 2 pricing which offers 12-18% discount depending on the product category. I've also upgraded your account to reflect this. Want to schedule a call to discuss further?", created_at: isoDate(getDate(23)) },
        { id: 35, user_id: 4, username: "Sophie Davis", message: "Perfect, catalogue received. No call needed for now, we'll review and place orders through the portal. Thank you!", created_at: isoDate(getDate(22)) }
      ] },
    ],
    supportChats: [
      { id: "chat-12", customer_id: 12, messages: [
        { sender: "agent", sender_name: "Virtual Dispatcher", text: "Welcome to Sword B2B Live Support Portal. How can I assist you with your orders, pricing negotiation, or claims today?", timestamp: new Date().toISOString() }
      ] }
    ]
  };
};

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw);

    if (!parsed?.suppliers || !parsed?.inventory?.products) return seedState();
    
    // Ensure warehouse data exists in migrated states
    if (!parsed.warehouse) parsed.warehouse = seedState().warehouse;
    if (!parsed.inventory) parsed.inventory = seedState().inventory;

    // Migration: Add barcodes to bins if missing
    if (parsed.warehouse.bins) {
      parsed.warehouse.bins = parsed.warehouse.bins.map(b => ({
        ...b,
        barcode: b.barcode || `BIN-${b.rack_code}-${b.bin_code}`,
        capacity: b.capacity || 5000
      }));
    }

    if (!parsed?.buyer?.reorderHistory) parsed.buyer = { ...(parsed.buyer || {}), reorderHistory: seedState().buyer.reorderHistory };

    // Migration: ensure advancedInventory exists
    if (!parsed.advancedInventory) parsed.advancedInventory = seedState().advancedInventory;

    // Migration: rename driver to dispatcher
    if (parsed.driver && !parsed.dispatcher) {
      parsed.dispatcher = parsed.driver;
      delete parsed.driver;
    }

    // Migration: ensure dispatcher data exists
    if (!parsed.dispatcher) parsed.dispatcher = seedState().dispatcher;

    // Migration: ensure supportTickets exist with new schema (description, sla_due_at, message.id fields)
    const fresh = seedState();
    if (!parsed.supportTickets || !Array.isArray(parsed.supportTickets) || parsed.supportTickets.length === 0 ||
        !parsed.supportTickets[0].description || !parsed.supportTickets[0].sla_due_at)
      parsed.supportTickets = fresh.supportTickets;
    if (!parsed.supportChats || !Array.isArray(parsed.supportChats) || parsed.supportChats.length === 0)
      parsed.supportChats = fresh.supportChats;

    // Migration: ensure new modules exist and have actual data (not empty stubs)
    if (!parsed.customers || !Array.isArray(parsed.customers) || parsed.customers.length === 0) {
      parsed.customers = fresh.customers;
    } else {
      // Ensure existing customers have a credit balance field
      parsed.customers = parsed.customers.map(c => ({
        ...c,
        credit_balance: c.credit_balance !== undefined ? c.credit_balance : (fresh.customers.find(fc => fc.id === c.id)?.credit_balance || 0)
      }));
    }
    if (!parsed.customerOrders || !Array.isArray(parsed.customerOrders) || parsed.customerOrders.length === 0)
      parsed.customerOrders = fresh.customerOrders;
    if (!parsed.transport || !parsed.transport.vehicles || parsed.transport.vehicles.length === 0)
      parsed.transport = fresh.transport;
    if (!parsed.purchases || !parsed.purchases.orders || parsed.purchases.orders.length === 0)
      parsed.purchases = fresh.purchases;

    return parsed;
  } catch {
    return seedState();
  }
};

let state = loadFromStorage();

const listeners = new Set();

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};

export const getMockState = () => state;

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const resetMockState = () => {
  state = seedState();
  persist();
  listeners.forEach((l) => l());
};

export const actions = {
  // Buyer quotations
  getBuyerQuotations: () => state.buyer.quotations,

  sendBuyerQuotation: (payload) => {
    const nextIdNum = 2006 + (state.buyer.quotations.length || 0);
    const id = `RFQ-${nextIdNum}`;

    const supplier = state.suppliers.find((s) => String(s.id) === String(payload.supplier_id));
    const product = state.products.find((p) => String(p.id) === String(payload.product_id));

    const total = Number(payload.quantity) * Number(payload.target_price || payload.unit_price || 0);

    const newQ = {
      id,
      buyer_id: payload.buyer_id ?? 1,
      supplier_id: Number(payload.supplier_id),
      supplier_name: supplier?.name || supplier?.company_name || "",
      product_id: Number(payload.product_id),
      product_name: product?.name || payload.product_name || "",
      quantity: Number(payload.quantity),
      unit_price: Number(payload.target_price || payload.unit_price || 0),
      total,
      status: "Pending",
      created_at: new Date().toISOString().split("T")[0],
      valid_until: payload.valid_until || payload.required_delivery_date || "",
      expected_delivery: payload.required_delivery_date || "",
      notes: payload.notes || "",
      supplier_notes: "",
      credit_days: Number(payload.credit_days ?? 30),
    };

    state.buyer.quotations = [newQ, ...(state.buyer.quotations || [])];
    persist();
    listeners.forEach((l) => l());
    return newQ;
  },

  updateBuyerQuotationStatus: (id, status, supplier_notes = "") => {
    state.buyer.quotations = (state.buyer.quotations || []).map((q) =>
      q.id === id ? { ...q, status, supplier_notes: supplier_notes ?? q.supplier_notes } : q
    );
    persist();
    listeners.forEach((l) => l());
    return state.buyer.quotations.find((q) => q.id === id);
  },

  // Buyer purchase orders
  getBuyerPurchaseOrders: () => state.buyer.purchaseOrders,

  upsertBuyerPurchaseOrder: (payload) => {
    const orders = state.buyer.purchaseOrders || [];
    const nextNum = 1043 + orders.length;
    const id = payload.id || `PO-${nextNum}`;

    const quantity = Number(payload.quantity || 0);
    const unit_price = Number(payload.unit_price || 0);

    const newPO = {
      id,
      supplier_id: Number(payload.supplier_id),
      supplier_name: payload.supplier_name || "",
      product: payload.product || "",
      quantity,
      unit_price,
      total: quantity * unit_price,
      status: payload.status || "Pending",
      order_date: new Date().toISOString().split("T")[0],
      expected_delivery: payload.expected_delivery || "",
      notes: payload.notes || "",
      delivery_address: payload.delivery_address || "",
      payment_terms: payload.payment_terms || "Net 30",
      is_reorder: Boolean(payload.is_reorder),
      reorder_of: payload.reorder_of || "",
    };

    state.buyer.purchaseOrders = [newPO, ...orders];
    persist();
    listeners.forEach((l) => l());
    return newPO;
  },

  updateBuyerPurchaseOrderStatus: (id, status) => {
    state.buyer.purchaseOrders = (state.buyer.purchaseOrders || []).map((p) =>
      p.id === id ? { ...p, status } : p
    );
    persist();
    listeners.forEach((l) => l());
    return state.buyer.purchaseOrders.find((p) => p.id === id);
  },

  // Buyer reorder history
  getBuyerReorderHistory: () => state.buyer.reorderHistory,

  createBuyerReorderEntry: (payload) => {
    const nextId = Math.max(0, ...(state.buyer.reorderHistory || []).map((r) => Number(r.id) || 0)) + 1;
    const qty = Number(payload.quantity || 0);
    const unitPrice = Number(payload.unit_price || 0);
    const todayIso = new Date().toISOString().split("T")[0];

    const newReorder = {
      id: nextId,
      product_id: Number(payload.product_id),
      product_name: payload.product_name || "",
      supplier_id: Number(payload.supplier_id),
      supplier_name: payload.supplier_name || "",
      quantity: qty,
      unit_price: unitPrice,
      total_amount: qty * unitPrice,
      status: payload.status || "Pending",
      last_order_date: payload.last_order_date || todayIso,
      notes: payload.notes || "",
      consumption_per_day: Number(payload.consumption_per_day || 0),
      days_in_stock: Number(payload.days_in_stock || 0),
      price_trend: Number(payload.price_trend || 0),
      reorder_point: Number(payload.reorder_point || 0),
      lead_time_days: Number(payload.lead_time_days || 0),
    };

    state.buyer.reorderHistory = [newReorder, ...(state.buyer.reorderHistory || [])];
    persist();
    listeners.forEach((l) => l());
    return newReorder;
  },

  bulkCreateBuyerReorders: (items) => {
    if (!Array.isArray(items) || items.length === 0) return [];

    const created = [];
    for (const it of items) created.push(actions.createBuyerReorderEntry(it));
    return created;
  },

  // Suppliers/products/inventory
  getSuppliers: () => state.suppliers,
  getInventoryProducts: () => state.inventory.products,

  // Inventory CRUD used by Inventory.js
  upsertInventoryProduct: (payload, editId = null) => {
    const warehouse = state.warehouse.warehouses.find((w) => String(w.id) === String(payload.warehouse_id));
    const bin = state.warehouse.bins.find((b) => String(b.id) === String(payload.bin_id));
    const supplier = state.suppliers.find((s) => String(s.id) === String(payload.supplier_id));

    const nextId = editId ?? (Math.max(0, ...(state.inventory.products || []).map((p) => Number(p.id) || 0)) + 1);

    const existing = (state.inventory.products || []).find((p) => p.id === nextId);
    const newEntry = {
      id: nextId,
      name: payload.name,
      type: payload.type,
      uom: payload.uom,
      barcode: payload.barcode,
      price: Number(payload.price),
      supplier_name: supplier?.name || "",
      stock: Number(payload.stock),
      warehouse_id: Number(payload.warehouse_id),
      warehouse_name: warehouse?.name || "Unassigned",
      bin_id: Number(payload.bin_id),
      locations: bin ? `${bin.rack_code}/${bin.bin_code}` : "Floor",
      weight_kg: Number(payload.weight_kg ?? 0),
    };

    state.inventory.products = existing
      ? state.inventory.products.map((p) => (p.id === nextId ? { ...p, ...newEntry } : p))
      : [newEntry, ...(state.inventory.products || [])];

    persist();
    listeners.forEach((l) => l());
    return newEntry;
  },

  deleteInventoryProduct: (id) => {
    state.inventory.products = (state.inventory.products || []).filter((p) => String(p.id) !== String(id));
    persist();
    listeners.forEach((l) => l());
    return true;
  },

  // Warehouse endpoints
  getWarehouses: () => state.warehouse.warehouses,
  getCityPresets: () => state.warehouse.cityPresets || {
    "London": { lat: 51.5074, lng: -0.1278 },
    "Manchester": { lat: 53.4808, lng: -2.2426 },
    "Birmingham": { lat: 52.4862, lng: -1.8904 },
    "Leeds": { lat: 53.8008, lng: -1.5491 },
    "Glasgow": { lat: 55.8642, lng: -4.2518 },
    "Bristol": { lat: 51.4545, lng: -2.5879 },
    "Liverpool": { lat: 53.4084, lng: -2.9916 },
    "Edinburgh": { lat: 55.9533, lng: -3.1883 }
  },
  createWarehouse: (payload) => {
    const newId = Math.max(0, ...(state.warehouse.warehouses || []).map(w => w.id)) + 1;
    let lat = Number(payload.lat);
    let lng = Number(payload.lng);

    // Lookup from preset if city is provided
    if (payload.city) {
      const presets = {
        "London": { lat: 51.5074, lng: -0.1278 },
        "Manchester": { lat: 53.4808, lng: -2.2426 },
        "Birmingham": { lat: 52.4862, lng: -1.8904 },
        "Leeds": { lat: 53.8008, lng: -1.5491 },
        "Glasgow": { lat: 55.8642, lng: -4.2518 },
        "Bristol": { lat: 51.4545, lng: -2.5879 },
        "Liverpool": { lat: 53.4084, lng: -2.9916 },
        "Edinburgh": { lat: 55.9533, lng: -3.1883 }
      };
      if (presets[payload.city]) {
        lat = presets[payload.city].lat;
        lng = presets[payload.city].lng;
      }
    }

    const newWarehouse = {
      id: newId,
      name: payload.name || `Warehouse ${newId}`,
      lat: lat || 18.5204,
      lng: lng || 73.8567
    };
    state.warehouse.warehouses = [...(state.warehouse.warehouses || []), newWarehouse];
    persist();
    listeners.forEach((l) => l());
    return newWarehouse;
  },
  getBins: () => state.warehouse.bins,
  createRack: (payload) => {
    const warehouse_id = Number(payload.warehouse_id);
    const rack_code = payload.rack_code;
    const bin_count = Number(payload.bin_count || 4);
    
    const warehouse = state.warehouse.warehouses.find(w => w.id === warehouse_id);
    const baseLat = warehouse?.lat || 18.5089;
    const baseLng = warehouse?.lng || 73.9259;

    const newBins = [];
    const baseId = Math.max(0, ...(state.warehouse.bins || []).map(b => b.id)) + 1;
    
    // Logic for geolocation offset (approximate)

    for (let i = 1; i <= bin_count; i++) {
      // Default offset for new racks is [0, 0, 0] in 3D
      const binLat = baseLat; 
      const binLng = baseLng;

      newBins.push({
        id: baseId + i - 1,
        warehouse_id: warehouse_id,
        rack_code: rack_code,
        bin_code: `B-${String(i).padStart(2, '0')}`,
        status: "Available",
        lat: binLat,
        lng: binLng
      });
    }
    
    state.warehouse.bins = [...(state.warehouse.bins || []), ...newBins];
    
    // Initialize position and geo
    if (!state.warehouse.rack_positions) state.warehouse.rack_positions = {};
    state.warehouse.rack_positions[rack_code] = [0, 0, 0];

    persist();
    listeners.forEach((l) => l());
    return newBins;
  },
  updateRackPosition: (rackCode, position) => {
    if (!state.warehouse.rack_positions) state.warehouse.rack_positions = {};
    state.warehouse.rack_positions[rackCode] = position;

    // Also update the geo-coordinates of all bins in this rack
    const bins = state.warehouse.bins || [];
    const rackBins = bins.filter(b => b.rack_code === rackCode);
    if (rackBins.length > 0) {
      const warehouse = state.warehouse.warehouses.find(w => w.id === rackBins[0].warehouse_id);
      if (warehouse) {
        const latMeters = 111111;
        const lngMeters = 111111 * Math.cos(warehouse.lat * Math.PI / 180);
        
        state.warehouse.bins = bins.map(b => {
          if (b.rack_code === rackCode) {
            return {
              ...b,
              lat: (warehouse.lat - (position[2] / latMeters)).toFixed(7),
              lng: (warehouse.lng + (position[0] / lngMeters)).toFixed(7)
            };
          }
          return b;
        });
      }
    }

    persist();
    listeners.forEach((l) => l());
    return true;
  },
  lookupByBarcode: (barcode) => {
    if (!barcode) return null;
    const search = String(barcode).toUpperCase();
    
    // Search in bins (Rack lookup)
    const bin = (state.warehouse.bins || []).find(b => String(b.barcode).toUpperCase() === search);
    if (bin) {
      const warehouse = (state.warehouse.warehouses || []).find(w => w.id === bin.warehouse_id);
      const product = (state.inventory.products || []).find(p => p.bin_id === bin.id);
      return {
        type: "bin",
        id: bin.id,
        warehouse_id: bin.warehouse_id,
        warehouse_name: warehouse?.name,
        rack_code: bin.rack_code,
        bin_code: bin.bin_code,
        barcode: bin.barcode,
        product: product || null
      };
    }

    // Search in products (Item lookup)
    const product = (state.inventory.products || []).find(p => String(p.barcode).toUpperCase() === search);
    if (product) {
      const bin = (state.warehouse.bins || []).find(b => b.id === product.bin_id);
      const warehouse = (state.warehouse.warehouses || []).find(w => w.id === product.warehouse_id);
      return {
        type: "product",
        id: product.id,
        name: product.name,
        barcode: product.barcode,
        stock: product.stock,
        warehouse_name: warehouse?.name,
        location: bin ? `${bin.rack_code}/${bin.bin_code}` : "Unassigned"
      };
    }

    return null;
  },
  getPurchasesSuppliers: () => state.suppliers,

  // ── Advanced Inventory actions ───────────────────────────────────────────
  getAdvBatches: () => state.advancedInventory?.batches || [],

  createAdvBatch: (payload) => {
    const batches = state.advancedInventory?.batches || [];
    const nextId = Math.max(0, ...batches.map((b) => b.id)) + 1;
    const warehouse = (state.warehouse.warehouses || []).find((w) => String(w.id) === String(payload.warehouse_id));
    const bin = (state.warehouse.bins || []).find((b) => String(b.id) === String(payload.bin_id));
    const supplier = (state.suppliers || []).find((s) => String(s.id) === String(payload.supplier_id));
    const product = (state.inventory.products || []).find((p) => String(p.id) === String(payload.product_id));
    const qty = Number(payload.quantity_received || 0);

    const newBatch = {
      id: nextId,
      product_id: Number(payload.product_id),
      product_name: product?.name || payload.product_name || "",
      batch_number: payload.batch_number || `BATCH-${Date.now()}`,
      lot_number: payload.lot_number || "",
      warehouse_id: Number(payload.warehouse_id),
      warehouse_name: warehouse?.name || "",
      bin_id: Number(payload.bin_id),
      bin_location: bin ? `${bin.rack_code}/${bin.bin_code}` : "",
      quantity_received: qty,
      quantity_available: qty,
      quantity_consumed: 0,
      best_before_date: payload.best_before_date || null,
      manufacture_date: payload.manufacture_date || "",
      supplier_id: Number(payload.supplier_id),
      supplier_name: supplier?.name || "",
      status: "active",
      created_at: new Date().toISOString().split("T")[0],
      notes: payload.notes || "",
    };

    if (!state.advancedInventory) state.advancedInventory = { batches: [], cycleCounts: [], scanHistory: [], expiryAlerts: [] };
    state.advancedInventory.batches = [newBatch, ...batches];
    persist();
    listeners.forEach((l) => l());
    return newBatch;
  },

  updateAdvBatchStatus: (id, status) => {
    if (!state.advancedInventory?.batches) return null;
    state.advancedInventory.batches = state.advancedInventory.batches.map((b) =>
      b.id === Number(id) ? { ...b, status } : b
    );
    persist();
    listeners.forEach((l) => l());
    return state.advancedInventory.batches.find((b) => b.id === Number(id));
  },

  getAdvCycleCounts: () => state.advancedInventory?.cycleCounts || [],

  createAdvCycleCount: (payload) => {
    const counts = state.advancedInventory?.cycleCounts || [];
    const nextId = Math.max(0, ...counts.map((c) => c.id)) + 1;
    const warehouse = (state.warehouse.warehouses || []).find((w) => String(w.id) === String(payload.warehouse_id));

    const newCC = {
      id: nextId,
      cycle_code: `CC-2026-${String(nextId).padStart(3, "0")}`,
      warehouse_id: Number(payload.warehouse_id),
      warehouse_name: warehouse?.name || "",
      cycle_type: payload.cycle_type || "partial",
      zone_name: payload.zone_name || "",
      planned_date: payload.planned_date || new Date().toISOString().split("T")[0],
      started_at: null,
      completed_at: null,
      status: "planned",
      items_counted: 0,
      items_total: Number(payload.items_total || 5),
      variance_count: 0,
      notes: payload.notes || "",
    };

    if (!state.advancedInventory) state.advancedInventory = { batches: [], cycleCounts: [], scanHistory: [], expiryAlerts: [] };
    state.advancedInventory.cycleCounts = [newCC, ...counts];
    persist();
    listeners.forEach((l) => l());
    return newCC;
  },

  startAdvCycleCount: (id) => {
    if (!state.advancedInventory?.cycleCounts) return null;
    state.advancedInventory.cycleCounts = state.advancedInventory.cycleCounts.map((c) =>
      c.id === Number(id) ? { ...c, status: "in_progress", started_at: new Date().toISOString().split("T")[0] } : c
    );
    persist();
    listeners.forEach((l) => l());
    return state.advancedInventory.cycleCounts.find((c) => c.id === Number(id));
  },

  completeAdvCycleCount: (id) => {
    if (!state.advancedInventory?.cycleCounts) return null;
    state.advancedInventory.cycleCounts = state.advancedInventory.cycleCounts.map((c) => {
      if (c.id !== Number(id)) return c;
      // Simulate variance on completion
      const variance = Math.floor(Math.random() * 3);
      return { ...c, status: "completed", completed_at: new Date().toISOString().split("T")[0], items_counted: c.items_total, variance_count: variance };
    });
    persist();
    listeners.forEach((l) => l());
    return state.advancedInventory.cycleCounts.find((c) => c.id === Number(id));
  },

  getAdvScanHistory: () => state.advancedInventory?.scanHistory || [],

  processAdvScan: (payload) => {
    const scans = state.advancedInventory?.scanHistory || [];
    const nextId = Math.max(0, ...scans.map((s) => s.id)) + 1;
    const lookup = actions.lookupByBarcode(payload.barcode);
    const warehouse = (state.warehouse.warehouses || []).find((w) => String(w.id) === String(payload.warehouse_id));

    const newScan = {
      id: nextId,
      barcode: payload.barcode || "",
      product_name: lookup?.name || lookup?.product?.name || null,
      scan_type: payload.scan_type || "inbound",
      warehouse_name: warehouse?.name || payload.warehouse_name || "",
      bin_location: lookup?.location || (lookup?.rack_code ? `${lookup.rack_code}/${lookup.bin_code}` : null),
      quantity_scanned: Number(payload.quantity_scanned || 1),
      timestamp: new Date().toISOString(),
      valid: !!lookup,
      error_message: lookup ? null : "Barcode not found in system",
      session_id: payload.session_id || `SESS-${Date.now()}`,
    };

    if (!state.advancedInventory) state.advancedInventory = { batches: [], cycleCounts: [], scanHistory: [], expiryAlerts: [] };
    state.advancedInventory.scanHistory = [newScan, ...scans];
    persist();
    listeners.forEach((l) => l());
    return newScan;
  },

  getAdvExpiryAlerts: () => state.advancedInventory?.expiryAlerts || [],

  acknowledgeAdvExpiryAlert: (id, actionTaken) => {
    if (!state.advancedInventory?.expiryAlerts) return null;
    state.advancedInventory.expiryAlerts = state.advancedInventory.expiryAlerts.map((a) =>
      a.id === Number(id)
        ? { ...a, acknowledged: true, acknowledged_at: new Date().toISOString(), action_taken: actionTaken || "reviewed" }
        : a
    );
    persist();
    listeners.forEach((l) => l());
    return state.advancedInventory.expiryAlerts.find((a) => a.id === Number(id));
  },

  // ── Dispatcher actions ────────────────────────────────────────────────────────
  getDispatcherAssignments: () => state.dispatcher?.assignments || [],

  getDispatcherNotifications: () => state.dispatcher?.notifications || [],

  markDispatcherNotificationRead: (id) => {
    if (!state.dispatcher?.notifications) return;
    state.dispatcher.notifications = state.dispatcher.notifications.map((n) =>
      n.id === Number(id) ? { ...n, is_read: true } : n
    );
    persist();
    listeners.forEach((l) => l());
  },

  markAllDispatcherNotificationsRead: () => {
    if (!state.dispatcher?.notifications) return;
    state.dispatcher.notifications = state.dispatcher.notifications.map((n) => ({ ...n, is_read: true }));
    persist();
    listeners.forEach((l) => l());
  },

  updateDispatcherAssignmentStatus: (id, status) => {
    if (!state.dispatcher?.assignments) return null;
    state.dispatcher.assignments = state.dispatcher.assignments.map((a) =>
      a.id === Number(id) ? { ...a, status } : a
    );
    persist();
    listeners.forEach((l) => l());
    return state.dispatcher.assignments.find((a) => a.id === Number(id));
  },

  markDispatcherItemPicked: (assignmentId, productId) => {
    if (!state.dispatcher?.assignments) return null;
    let pickedItem = null;
    state.dispatcher.assignments = state.dispatcher.assignments.map((a) => {
      if (a.id !== Number(assignmentId)) return a;
      const items = a.items.map((it) => {
        if (it.product_id === Number(productId)) {
          pickedItem = it;
          return { ...it, picked: true };
        }
        return it;
      });
      const allPicked = items.every((it) => it.picked);
      return { ...a, items, status: allPicked ? "in_transit" : "picking" };
    });

    // Create a notification for the picking update
    if (pickedItem) {
      const assignment = state.dispatcher.assignments.find(a => a.id === Number(assignmentId));
      const pickedCount = assignment.items.filter(it => it.picked).length;
      const totalCount = assignment.items.length;
      
      const newNotif = {
        id: Math.max(0, ...(state.dispatcher.notifications || []).map(n => n.id)) + 1,
        driver_id: 10, // Assuming fixed driver for prototype
        title: "Item Picked",
        message: `Picked ${pickedItem.product_name} for Shipment ${assignment.shipment_id}. (${pickedCount}/${totalCount})`,
        type: "update",
        related_id: assignment.id,
        is_read: false,
        created_at: new Date().toISOString()
      };
      state.dispatcher.notifications = [newNotif, ...(state.dispatcher.notifications || [])];
    }

    persist();
    listeners.forEach((l) => l());
    return state.dispatcher.assignments.find((a) => a.id === Number(assignmentId));
  },

  assignOrderToDispatcher: (payload) => {
    const nextId = Math.max(0, ...(state.dispatcher.assignments || []).map(a => a.id)) + 1;
    const newAssignment = {
      id: nextId,
      shipment_id: `SHP-2026-${String(nextId).padStart(3, "0")}`,
      driver_id: payload.driver_id || 10,
      driver_name: payload.driver_name || "David Smith",
      vehicle_number: payload.vehicle_number || "LX58 ABC",
      status: "assigned",
      assigned_at: new Date().toISOString(),
      warehouse_id: payload.warehouse_id,
      warehouse_name: payload.warehouse_name,
      warehouse_lat: payload.warehouse_lat,
      warehouse_lng: payload.warehouse_lng,
      delivery_address: payload.delivery_address,
      delivery_lat: payload.delivery_lat,
      delivery_lng: payload.delivery_lng,
      route_details: `${payload.warehouse_name} → ${payload.delivery_address}`,
      total_distance_km: payload.total_distance_km || 10,
      delivery_date: payload.delivery_date || new Date().toISOString().split("T")[0],
      estimated_time: payload.estimated_time || "12:00 PM",
      navigation_url: `https://maps.google.com/?q=${payload.delivery_lat},${payload.delivery_lng}`,
      items: payload.items.map(it => ({ ...it, picked: false }))
    };

    state.dispatcher.assignments = [newAssignment, ...(state.dispatcher.assignments || [])];
    
    // Create notification
    const newNotif = {
      id: Math.max(0, ...(state.dispatcher.notifications || []).map(n => n.id)) + 1,
      driver_id: newAssignment.driver_id,
      title: "New Order Assigned",
      message: `Shipment ${newAssignment.shipment_id} assigned. Delivery to ${newAssignment.delivery_address} on ${newAssignment.delivery_date} at ${newAssignment.estimated_time}.`,
      type: "assignment",
      related_id: newAssignment.id,
      is_read: false,
      created_at: new Date().toISOString()
    };
    state.dispatcher.notifications = [newNotif, ...(state.dispatcher.notifications || [])];

    persist();
    listeners.forEach((l) => l());
    return newAssignment;
  },

  assignDriverAfterScan: (shipmentId, driverDetails) => {
    if (!state.dispatcher?.assignments) return null;
    
    let targetAssignment = state.dispatcher.assignments.find(a => a.shipment_id === shipmentId || String(a.id) === String(shipmentId));
    
    if (!targetAssignment) return null;

    targetAssignment.driver_id = driverDetails.driver_id || 12;
    targetAssignment.driver_name = driverDetails.driver_name || "Thomas Wilson";
    targetAssignment.vehicle_number = driverDetails.vehicle_number || "BV62 XYZ";
    targetAssignment.delivery_date = driverDetails.delivery_date || new Date().toISOString().split("T")[0];
    targetAssignment.estimated_time = driverDetails.estimated_time || "04:00 PM";
    targetAssignment.status = "assigned"; // Reset or update status if needed

    // Create notification for the driver
    const newNotif = {
      id: Math.max(0, ...(state.dispatcher.notifications || []).map(n => n.id)) + 1,
      driver_id: targetAssignment.driver_id,
      title: "🚛 New Route Assigned",
      message: `New shipment ${targetAssignment.shipment_id} assigned. Route: ${targetAssignment.route_details}. Delivery Date: ${targetAssignment.delivery_date}. Est. Time: ${targetAssignment.estimated_time}.`,
      type: "assignment",
      related_id: targetAssignment.id,
      is_read: false,
      created_at: new Date().toISOString(),
      details: {
        route: targetAssignment.route_details,
        navigation_url: targetAssignment.navigation_url,
        delivery_date: targetAssignment.delivery_date,
        estimated_time: targetAssignment.estimated_time
      }
    };

    state.dispatcher.notifications = [newNotif, ...(state.dispatcher.notifications || [])];
    
    persist();
    listeners.forEach((l) => l());
    return targetAssignment;
  },

  // tokens passthrough
  setTokensFromLocalStorage: () => {
    try {
      state.auth.erp_token = localStorage.getItem("erp_token") || null;
      const u = localStorage.getItem("erp_user");
      state.auth.erp_user = u ? JSON.parse(u) : null;
      persist();
    } catch {}
  },

  // ── CUSTOMERS ────────────────────────────────────────────────────────────
  getCustomers: () => state.customers || [],

  createCustomer: (payload) => {
    const nextId = Math.max(0, ...(state.customers || []).map(c => c.id)) + 1;
    const newC = {
      id: nextId,
      customer_name: payload.customer_name || "",
      company_name: payload.company_name || "",
      email: payload.email || "",
      phone: payload.phone || "",
      address_line_1: payload.address_line_1 || "",
      address_line_2: payload.address_line_2 || "",
      country: payload.country || "United Kingdom",
      state: payload.state || "",
      city: payload.city || "",
      pincode: payload.pincode || "",
      delivery_priority: payload.delivery_priority || "normal",
      status: payload.status || "active",
      // Auto-assign approximate coords from city lookup (prototype)
      latitude: payload.latitude || 18.5204,
      longitude: payload.longitude || 73.8567,
    };
    state.customers = [newC, ...(state.customers || [])];
    persist(); listeners.forEach(l => l());
    return newC;
  },

  updateCustomer: (id, payload) => {
    state.customers = (state.customers || []).map(c =>
      c.id === Number(id) ? { ...c, ...payload } : c
    );
    persist(); listeners.forEach(l => l());
    return (state.customers || []).find(c => c.id === Number(id));
  },

  deleteCustomer: (id) => {
    state.customers = (state.customers || []).filter(c => c.id !== Number(id));
    persist(); listeners.forEach(l => l());
    return { success: true };
  },

  // ── CUSTOMER ORDERS ───────────────────────────────────────────────────────
  getCustomerOrders: () => state.customerOrders || [],

  createCustomerOrder: (payload) => {
    const nextId = Math.max(0, ...(state.customerOrders || []).map(o => o.id)) + 1;
    const customer = (state.customers || []).find(c => String(c.id) === String(payload.customer_id));
    const newOrder = {
      id: nextId,
      order_number: payload.order_number || `ORD-${Date.now()}`,
      customer_id: Number(payload.customer_id),
      customer_name: customer?.customer_name || payload.customer_name || "",
      company_name: customer?.company_name || "",
      required_delivery_date: payload.required_delivery_date || "",
      delivery_address: payload.delivery_address || "",
      delivery_city: payload.delivery_city || "",
      delivery_state: payload.delivery_state || "",
      delivery_country: payload.delivery_country || "",
      delivery_latitude: payload.delivery_latitude || customer?.latitude || 0,
      delivery_longitude: payload.delivery_longitude || customer?.longitude || 0,
      delivery_priority: payload.delivery_priority || "normal",
      status: "pending",
      selected_warehouse_name: null,
      warehouse_distance_km: null,
      driver_name: null,
      vehicle_type: null,
      vehicle_plate: null,
      delivery_sequence: null,
      items: payload.items || [],
      total_amount: payload.total_amount || 0,
    };
    state.customerOrders = [newOrder, ...(state.customerOrders || [])];
    persist(); listeners.forEach(l => l());
    return newOrder;
  },

  approveCustomerOrder: (id) => {
    // Simulate auto-logistics: assign nearest warehouse + vehicle
    const warehouses = state.warehouse?.warehouses || [];
    const vehicles = state.transport?.vehicles || [];
    const wh = warehouses[0] || { name: "Warehouse A", id: 1 };
    const vehicle = vehicles.find(v => v.status === "available") || vehicles[0];
    state.customerOrders = (state.customerOrders || []).map(o => {
      if (o.id !== Number(id)) return o;
      return {
        ...o,
        status: "approved",
        selected_warehouse_name: wh.name,
        warehouse_distance_km: (Math.random() * 20 + 5).toFixed(1),
        driver_name: vehicle?.driver_name || "David Smith",
        vehicle_type: vehicle?.vehicle_type || "Truck",
        vehicle_plate: vehicle?.vehicle_number || "LX58 ABC",
      };
    });
    persist(); listeners.forEach(l => l());
    const order = (state.customerOrders || []).find(o => o.id === Number(id));
    return { warehouse: order?.selected_warehouse_name, vehicle: order?.vehicle_plate };
  },

  reoptimizeCustomerOrder: (id) => {
    return actions.approveCustomerOrder(id);
  },

  deleteCustomerOrder: (id) => {
    if (!state.customerOrders) return { success: false };
    state.customerOrders = state.customerOrders.filter((o) => o.id !== Number(id));
    persist();
    listeners.forEach((l) => l());
    return { success: true };
  },

  // ── TRANSPORT ─────────────────────────────────────────────────────────────
  getTransportVehicles: () => state.transport?.vehicles || [],
  getTransportShipments: () => state.transport?.shipments || [],

  createTransportVehicle: (payload) => {
    const vehicles = state.transport?.vehicles || [];
    const nextId = Math.max(0, ...vehicles.map(v => v.id)) + 1;
    const wh = (state.warehouse?.warehouses || []).find(w => String(w.id) === String(payload.assigned_warehouse_id));
    const newV = {
      id: nextId,
      vehicle_number: payload.vehicle_number || "",
      vehicle_type: payload.vehicle_type || "Truck",
      capacity_kg: Number(payload.capacity_kg || 0),
      capacity_volume: Number(payload.capacity_volume || 0),
      driver_name: payload.driver_name || "",
      driver_phone: payload.driver_phone || "",
      assigned_warehouse_id: payload.assigned_warehouse_id ? Number(payload.assigned_warehouse_id) : null,
      warehouse_name: wh?.name || null,
      current_latitude: Number(payload.current_latitude || 0),
      current_longitude: Number(payload.current_longitude || 0),
      status: payload.status || "available",
    };
    if (!state.transport) state.transport = { vehicles: [], shipments: [] };
    state.transport.vehicles = [...vehicles, newV];
    persist(); listeners.forEach(l => l());
    return newV;
  },

  updateTransportVehicle: (id, payload) => {
    if (!state.transport) return null;
    const wh = (state.warehouse?.warehouses || []).find(w => String(w.id) === String(payload.assigned_warehouse_id));
    state.transport.vehicles = (state.transport.vehicles || []).map(v =>
      v.id === Number(id)
        ? { ...v, ...payload, warehouse_name: wh?.name ?? v.warehouse_name }
        : v
    );
    persist(); listeners.forEach(l => l());
    return (state.transport.vehicles || []).find(v => v.id === Number(id));
  },

  updateTransportShipmentStatus: (id, status) => {
    if (!state.transport) return null;
    state.transport.shipments = (state.transport.shipments || []).map(s =>
      s.id === Number(id)
        ? { ...s, status, delivered_at: status === "Delivered" ? new Date().toISOString().split("T")[0] : s.delivered_at }
        : s
    );
    persist(); listeners.forEach(l => l());
    return (state.transport.shipments || []).find(s => s.id === Number(id));
  },

  // ── PURCHASES (Admin) ─────────────────────────────────────────────────────
  getPurchaseOrders: () => state.purchases?.orders || [],
  getPurchaseOrderItems: (id) => (state.purchases?.orderItems || {})[String(id)] || [],
  getAdminQuotations: () => state.purchases?.quotations || [],

  createPurchaseOrder: (payload) => {
    if (!state.purchases) state.purchases = { orders: [], orderItems: {}, quotations: [] };
    const orders = state.purchases.orders || [];
    // Derive next numeric suffix from existing string IDs like "PO-5"
    const maxNum = orders.reduce((max, o) => {
      const n = parseInt(String(o.id).replace(/[^\d]/g, "")) || 0;
      return n > max ? n : max;
    }, 0);
    const newId = `PO-${maxNum + 1}`;
    const total = (payload.items || []).reduce((s, it) => s + (Number(it.quantity) * Number(it.unit_price)), 0);
    const newPO = {
      id: newId,
      supplier_id: Number(payload.supplier_id),
      supplier_name: (state.suppliers || []).find(s => String(s.id) === String(payload.supplier_id))?.name || payload.supplier_name || "",
      order_date: payload.order_date || new Date().toISOString().split("T")[0],
      expected_delivery: payload.expected_delivery || "",
      total_amount: total,
      status: "Draft",
      item_count: (payload.items || []).length,
    };
    state.purchases.orders = [newPO, ...orders];
    state.purchases.orderItems[newId] = (payload.items || []).map((it, i) => ({
      id: (maxNum + 1) * 100 + i,
      purchase_order_id: newId,
      product_id: Number(it.product_id),
      product_name: it.product_name || (state.products || []).find(p => String(p.id) === String(it.product_id))?.name || "",
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
      uom: it.uom || "units",
    }));
    persist(); listeners.forEach(l => l());
    return newPO;
  },

  updatePurchaseOrderStatus: (id, status) => {
    if (!state.purchases) return null;
    state.purchases.orders = (state.purchases.orders || []).map(o =>
      String(o.id) === String(id) ? { ...o, status } : o
    );
    persist(); listeners.forEach(l => l());
    return (state.purchases.orders || []).find(o => String(o.id) === String(id));
  },

  createAdminSupplier: (payload) => {
    const nextId = Math.max(0, ...(state.suppliers || []).map(s => s.id)) + 1;
    const newS = {
      id: nextId,
      name: payload.name || "",
      company_name: payload.name || "",
      contact: payload.contact_person || "",
      contact_person: payload.contact_person || "",
      email: payload.email || "",
      phone: payload.phone || "",
      address: payload.address || "",
      rating: 4.0,
    };
    state.suppliers = [...(state.suppliers || []), newS];
    persist(); listeners.forEach(l => l());
    return newS;
  },

  updateAdminSupplier: (id, payload) => {
    state.suppliers = (state.suppliers || []).map(s =>
      s.id === Number(id) ? { ...s, ...payload, name: payload.name || s.name, company_name: payload.name || s.company_name } : s
    );
    persist(); listeners.forEach(l => l());
    return (state.suppliers || []).find(s => s.id === Number(id));
  },

  deleteAdminSupplier: (id) => {
    state.suppliers = (state.suppliers || []).filter(s => s.id !== Number(id));
    persist(); listeners.forEach(l => l());
    return { success: true };
  },

  updateAdminQuotationStatus: (id, status) => {
    if (!state.purchases) return null;
    state.purchases.quotations = (state.purchases.quotations || []).map(q =>
      q.id === Number(id) ? { ...q, status } : q
    );
    persist(); listeners.forEach(l => l());
    return (state.purchases.quotations || []).find(q => q.id === Number(id));
  },

  // ── FINANCE LEDGER (manual add/update) ──────────────────────────────────
  addFinanceLedgerEntry: (payload) => {
    const entries = state.finance?.ledgerEntries || [];
    const nextId = Math.max(0, ...entries.map(e => e.id)) + 1;
    const newEntry = {
      id: nextId,
      date: payload.date || new Date().toISOString().split("T")[0],
      description: payload.description || "",
      type: payload.type || "Debit",
      amount: Number(payload.amount || 0),
      status: payload.status || "Completed",
      category: payload.category || "Other",
      source: "manual",
      reference: payload.reference_id || "",
    };
    if (!state.finance) state.finance = { purchaseOrders: [], salesOrders: [], ledgerEntries: [] };
    state.finance.ledgerEntries = [newEntry, ...entries];
    persist(); listeners.forEach(l => l());
    return newEntry;
  },

  markFinanceLedgerCompleted: (id) => {
    if (!state.finance) return null;
    state.finance.ledgerEntries = (state.finance.ledgerEntries || []).map(e =>
      e.id === Number(id) ? { ...e, status: "Completed" } : e
    );
    persist(); listeners.forEach(l => l());
    return (state.finance.ledgerEntries || []).find(e => e.id === Number(id));
  },

  getFinanceData: () => {
    return {
      purchaseOrders: state.purchases?.orders || state.finance?.purchaseOrders || [],
      salesOrders: state.customerOrders || state.finance?.salesOrders || [],
      ledgerEntries: state.finance?.ledgerEntries || []
    };
  },

  getReportsData: () => {
    return {
      monthlyTrend: [
        { month: "Jan", revenue: 185000, expenses: 92000, profit: 93000, invoices: 18, bills: 11 },
        { month: "Feb", revenue: 210000, expenses: 108000, profit: 102000, invoices: 21, bills: 13 },
        { month: "Mar", revenue: 175000, expenses: 88000, profit: 87000, invoices: 16, bills: 9 },
        { month: "Apr", revenue: 260000, expenses: 134000, profit: 126000, invoices: 26, bills: 15 },
        { month: "May", revenue: 312000, expenses: 158000, profit: 154000, invoices: 31, bills: 18 },
        { month: "Jun", revenue: 385000, expenses: 182000, profit: 203000, invoices: 38, bills: 22 },
      ],
      categories: [
        { name: "Salaries", amount: 325000 },
        { name: "Software", amount: 84000 },
        { name: "Marketing", amount: 128000 },
        { name: "Hosting", amount: 56000 },
        { name: "Office", amount: 36000 },
        { name: "Others", amount: 100000 },
      ],
      profitLoss: [
        { label: "Service Revenue", type: "income", amount: 1185000 },
        { label: "Product Revenue", type: "income", amount: 253000 },
        { label: "Salaries & Wages", type: "expense", amount: 325000 },
        { label: "Software Tools", type: "expense", amount: 84000 },
        { label: "Marketing Spend", type: "expense", amount: 128000 },
        { label: "Hosting & Infrastructure", type: "expense", amount: 56000 },
        { label: "Office & Operations", type: "expense", amount: 136000 },
      ]
    };
  },

  // ── SUPPORT TICKETS & CLAIMS ACTIONS ─────────────────────────────────────
  getSupportTickets: (user) => {
    if (!state.supportTickets) state.supportTickets = [];
    if (user && user.role === "customer") {
      return state.supportTickets.filter(t => t.customer_id === Number(user.id));
    }
    return state.supportTickets;
  },

  createSupportTicket: (payload) => {
    if (!state.supportTickets) state.supportTickets = [];
    const nextId = Math.max(0, ...state.supportTickets.map(t => t.id)) + 1;
    const tktNum = `TKT-${1000 + nextId}`;
    const nextMsgId = state.supportTickets.reduce((max, t) => Math.max(max, ...(t.messages || []).map(m => m.id || 0)), 0) + 1;
    
    // Find customer details
    const customer = (state.customers || []).find(c => c.id === Number(payload.customer_id));
    const now = new Date().toISOString();
    
    const newTicket = {
      id: nextId,
      ticket_number: tktNum,
      customer_id: Number(payload.customer_id),
      customer_name: customer?.customer_name || "Rachel Patel",
      category: payload.category || "general",
      subject: payload.subject || `${payload.category} regarding Order ${payload.order_number || "N/A"}`,
      description: payload.description || "",
      status: "open",
      priority: payload.priority || "medium",
      order_number: payload.order_number || null,
      assigned_to: "Unassigned",
      created_at: now,
      updated_at: now,
      sla_due_at: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
      claim_details: payload.claim_details || null,
      messages: (payload.description || payload.message) ? [
        {
          id: nextMsgId,
          user_id: Number(payload.customer_id),
          username: customer?.customer_name || "Rachel Patel",
          message: payload.description || payload.message,
          created_at: now
        }
      ] : []
    };
    
    state.supportTickets = [newTicket, ...state.supportTickets];
    persist();
    listeners.forEach((l) => l());
    return newTicket;
  },

  addTicketMessage: (ticketId, messagePayload) => {
    if (!state.supportTickets) state.supportTickets = [];
    const nextMsgId = state.supportTickets.reduce((max, t) => Math.max(max, ...(t.messages || []).map(m => m.id || 0)), 0) + 1;
    let targetTicket = null;

    // Resolve the current user
    const u = localStorage.getItem("erp_user");
    const currentUser = u ? JSON.parse(u) : null;

    state.supportTickets = state.supportTickets.map(t => {
      if (t.id === Number(ticketId) || t.ticket_number === ticketId) {
        const now = new Date().toISOString();
        const newMessage = {
          id: nextMsgId,
          user_id: currentUser?.id || 0,
          username: currentUser?.username || messagePayload.sender_name || "User",
          message: messagePayload.message || messagePayload.text || "",
          created_at: now
        };
        const updatedMessages = [...(t.messages || []), newMessage];
        
        let status = t.status;
        if (currentUser?.role === "customer" && t.status === "resolved") {
          status = "open"; // Reopen
        }
        
        targetTicket = { ...t, messages: updatedMessages, status, updated_at: now };
        return targetTicket;
      }
      return t;
    });
    
    persist();
    listeners.forEach((l) => l());
    return targetTicket;
  },

  assignTicket: (ticketId, agentName) => {
    if (!state.supportTickets) state.supportTickets = [];
    let targetTicket = null;
    state.supportTickets = state.supportTickets.map(t => {
      if (t.id === Number(ticketId) || t.ticket_number === ticketId) {
        const sysMessage = {
          sender: "system",
          sender_name: "System",
          text: `Ticket assigned to ${agentName}`,
          timestamp: new Date().toISOString()
        };
        targetTicket = {
          ...t,
          assigned_to: agentName,
          status: t.status === "open" ? "in_progress" : t.status,
          messages: [...(t.messages || []), sysMessage]
        };
        return targetTicket;
      }
      return t;
    });
    persist();
    listeners.forEach((l) => l());
    return targetTicket;
  },

  escalateTicket: (ticketId, priority) => {
    if (!state.supportTickets) state.supportTickets = [];
    let targetTicket = null;
    state.supportTickets = state.supportTickets.map(t => {
      if (t.id === Number(ticketId) || t.ticket_number === ticketId) {
        const sysMessage = {
          sender: "system",
          sender_name: "System",
          text: `Priority escalated to ${priority.toUpperCase()}`,
          timestamp: new Date().toISOString()
        };
        targetTicket = {
          ...t,
          priority: priority.toLowerCase(),
          status: "escalated",
          messages: [...(t.messages || []), sysMessage]
        };
        return targetTicket;
      }
      return t;
    });
    persist();
    listeners.forEach((l) => l());
    return targetTicket;
  },

  resolveTicket: (ticketId, notes) => {
    if (!state.supportTickets) state.supportTickets = [];
    let targetTicket = null;
    let refundApplied = 0;
    let customerId = null;
    let ticketCat = "";
    let orderNum = "";
    
    state.supportTickets = state.supportTickets.map(t => {
      if (t.id === Number(ticketId) || t.ticket_number === ticketId) {
        if (t.status === "resolved") {
          targetTicket = t;
          return t;
        }
        customerId = t.customer_id;
        ticketCat = t.category;
        orderNum = t.order_number || "";
        
        if (t.category === "Damaged Items" || t.category === "Late Delivery" || t.category === "Order Quantity Adjustment") {
          if (t.claim_details && t.claim_details.refund_amount) {
            refundApplied = Number(t.claim_details.refund_amount);
          } else {
            if (t.category === "Damaged Items") refundApplied = 84.00;
            else if (t.category === "Late Delivery") refundApplied = 150.00;
            else refundApplied = 50.00;
          }
        }
        
        const sysMessage = {
          sender: "system",
          sender_name: "System",
          text: `Ticket resolved by agent. Resolution notes: ${notes}. ${refundApplied > 0 ? `Approved refund credit of £${refundApplied.toFixed(2)}.` : ""}`,
          timestamp: new Date().toISOString()
        };
        
        targetTicket = {
          ...t,
          status: "resolved",
          resolution_notes: notes,
          refund_amount: refundApplied,
          messages: [...(t.messages || []), sysMessage]
        };
        return targetTicket;
      }
      return t;
    });
    
    if (targetTicket && refundApplied > 0 && customerId) {
      if (state.customers) {
        state.customers = state.customers.map(c => {
          if (c.id === Number(customerId)) {
            const currentBalance = Number(c.credit_balance || 0);
            return {
              ...c,
              credit_balance: Number((currentBalance + refundApplied).toFixed(2))
            };
          }
          return c;
        });
      }
      
      if (!state.finance) state.finance = { purchaseOrders: [], salesOrders: [], ledgerEntries: [] };
      if (!state.finance.ledgerEntries) state.finance.ledgerEntries = [];
      
      const nextLedgerId = Math.max(0, ...state.finance.ledgerEntries.map(e => e.id)) + 1;
      const ledgerEntry = {
        id: nextLedgerId,
        date: new Date().toISOString().split("T")[0],
        description: `Credit Note - Refund for ${ticketCat} Claim (Ticket: ${targetTicket.ticket_number}, Order: ${orderNum || 'N/A'})`,
        type: "Debit",
        amount: refundApplied,
        status: "Completed",
        category: "Refund Credit",
        source: "auto",
        reference: targetTicket.ticket_number
      };
      
      state.finance.ledgerEntries = [ledgerEntry, ...state.finance.ledgerEntries];
    }
    
    persist();
    listeners.forEach((l) => l());
    return targetTicket;
  },

  getSupportChats: (customerId) => {
    if (!state.supportChats) state.supportChats = [];
    let chat = state.supportChats.find(c => c.customer_id === Number(customerId));
    if (!chat) {
      chat = {
        id: `chat-${customerId}`,
        customer_id: Number(customerId),
        messages: [
          { sender: "agent", sender_name: "Virtual Dispatcher", text: "Welcome to Sword B2B Live Support Portal. How can I assist you with your orders, pricing negotiation, or claims today?", timestamp: new Date().toISOString() }
        ]
      };
      state.supportChats.push(chat);
      persist();
    }
    return chat;
  },

  addGlobalChatMessage: (customerId, messagePayload) => {
    if (!state.supportChats) state.supportChats = [];
    let targetChat = null;
    state.supportChats = state.supportChats.map(c => {
      if (c.customer_id === Number(customerId)) {
        const updatedMessages = [...(c.messages || []), {
          sender: messagePayload.sender,
          sender_name: messagePayload.sender_name,
          text: messagePayload.text,
          timestamp: new Date().toISOString()
        }];
        
        if (messagePayload.sender === "customer") {
          let replyText = "Thank you for your message. An agent will be with you shortly. If you are facing an issue with a delivery or have damaged items, please feel free to submit a support ticket under the 'File a Claim' section for immediate financial resolution.";
          const txt = messagePayload.text.toLowerCase();
          if (txt.includes("hello") || txt.includes("hi")) {
            replyText = "Hello! I am your Virtual Dispatcher bot. How can I help you today? You can ask about order status, filing claims, or getting a credit refund.";
          } else if (txt.includes("status") || txt.includes("order")) {
            replyText = "To check your order status or track a shipment, view the 'Active Shipments SLA Monitor' on your dashboard. You can see real-time route progress, ETAs, and file late delivery claims from there!";
          } else if (txt.includes("damage") || txt.includes("torn") || txt.includes("broken")) {
            replyText = "Oh no, I'm sorry to hear that! You can file an 'Item Damage Claim' directly from your dashboard. Select the order and specify the exact quantity damaged to receive a credit refund on your account immediately upon approval.";
          } else if (txt.includes("credit") || txt.includes("refund") || txt.includes("balance")) {
            replyText = "When a damage or delay claim is resolved, a credit refund is applied directly to your B2B account credit balance, and a credit note is written to our General Ledger. You can use this balance for future orders!";
          }
          
          updatedMessages.push({
            sender: "agent",
            sender_name: "Virtual Dispatcher",
            text: replyText,
            timestamp: new Date(Date.now() + 1000).toISOString()
          });
        }
        
        targetChat = { ...c, messages: updatedMessages };
        return targetChat;
      }
      return c;
    });
    
    persist();
    listeners.forEach((l) => l());
    return targetChat;
  }
};
