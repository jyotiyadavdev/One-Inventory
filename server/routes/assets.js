import express from 'express';
import { pool } from '../server.js';
import QRCode from 'qrcode';

const router = express.Router();

// Get all assets
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM assets ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single asset by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM assets WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Get associated tickets
    const tickets = await pool.query(
      'SELECT * FROM tickets WHERE asset_id = $1 ORDER BY created_at DESC',
      [id]
    );
    
    res.json({
      ...result.rows[0],
      tickets: tickets.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new asset
router.post('/', async (req, res) => {
  try {
    const {
      asset_tag,
      name,
      category,
      location,
      status,
      purchase_date,
      purchase_cost,
      warranty_expiry,
      manufacturer,
      model,
      serial_number
    } = req.body;
    
    // Generate QR code
    const qrData = JSON.stringify({ asset_tag, name, location });
    const qrCode = await QRCode.toDataURL(qrData);
    
    const result = await pool.query(
      `INSERT INTO assets 
       (asset_tag, name, category, location, status, purchase_date, purchase_cost, warranty_expiry, manufacturer, model, serial_number, qr_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [asset_tag, name, category, location, status, purchase_date, purchase_cost, warranty_expiry, manufacturer, model, serial_number, qrCode]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update asset
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      location,
      status,
      warranty_expiry
    } = req.body;
    
    const result = await pool.query(
      `UPDATE assets 
       SET name = $1, category = $2, location = $3, status = $4, warranty_expiry = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, category, location, status, warranty_expiry, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate QR for asset
router.post('/:id/generate-qr', async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
    
    if (asset.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    const qrData = JSON.stringify({
      asset_id: asset.rows[0].id,
      asset_tag: asset.rows[0].asset_tag,
      name: asset.rows[0].name,
      location: asset.rows[0].location
    });
    
    const qrCode = await QRCode.toDataURL(qrData);
    
    await pool.query('UPDATE assets SET qr_code = $1 WHERE id = $2', [qrCode, id]);
    
    res.json({ qr_code: qrCode });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;