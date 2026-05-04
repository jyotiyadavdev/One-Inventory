import express from 'express';
import { pool } from '../server.js';

const router = express.Router();

// Get all tickets
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, 
             a.name as asset_name,
             u.full_name as reported_by_name
      FROM tickets t
      LEFT JOIN assets a ON t.asset_id = a.id
      LEFT JOIN users u ON t.reported_by = u.id
      ORDER BY 
        CASE t.priority 
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          WHEN 'low' THEN 4
        END,
        t.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single ticket with comments
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const ticket = await pool.query(`
      SELECT t.*, a.name as asset_name, a.asset_tag,
             u.full_name as reported_by_name
      FROM tickets t
      LEFT JOIN assets a ON t.asset_id = a.id
      LEFT JOIN users u ON t.reported_by = u.id
      WHERE t.id = $1
    `, [id]);
    
    if (ticket.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    const comments = await pool.query(`
      SELECT c.*, u.full_name
      FROM ticket_comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.ticket_id = $1
      ORDER BY c.created_at ASC
    `, [id]);
    
    res.json({
      ...ticket.rows[0],
      comments: comments.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new ticket
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      priority,
      asset_id,
      location,
      reported_by
    } = req.body;
    
    // Generate ticket number
    const ticketNumber = `TKT-${Date.now()}`;
    
    // Set SLA dates
    const slaResponseHours = priority === 'critical' ? 1 : priority === 'high' ? 4 : priority === 'medium' ? 24 : 48;
    const slaResolutionHours = priority === 'critical' ? 4 : priority === 'high' ? 24 : priority === 'medium' ? 72 : 120;
    
    const slaResponseDue = new Date();
    slaResponseDue.setHours(slaResponseDue.getHours() + slaResponseHours);
    
    const slaResolutionDue = new Date();
    slaResolutionDue.setHours(slaResolutionDue.getHours() + slaResolutionHours);
    
    const result = await pool.query(
      `INSERT INTO tickets 
       (ticket_number, title, description, category, priority, status, asset_id, location, reported_by, sla_response_due, sla_resolution_due)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [ticketNumber, title, description, category, priority, 'new', asset_id || null, location, reported_by || 1, slaResponseDue, slaResolutionDue]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update ticket status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_to } = req.body;
    
    let query = 'UPDATE tickets SET status = $1, updated_at = CURRENT_TIMESTAMP';
    const params = [status];
    
    if (status === 'resolved') {
      query += ', resolved_at = CURRENT_TIMESTAMP';
    } else if (status === 'closed') {
      query += ', closed_at = CURRENT_TIMESTAMP';
    }
    
    if (assigned_to) {
      query += ', assigned_to = $' + (params.length + 1);
      params.push(assigned_to);
    }
    
    query += ' WHERE id = $' + (params.length + 1) + ' RETURNING *';
    params.push(id);
    
    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add comment to ticket
router.post('/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, user_id } = req.body;
    
    const result = await pool.query(
      `INSERT INTO ticket_comments (ticket_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, user_id || 1, comment]
    );
    
    // Also update ticket status to indicate activity
    await pool.query(
      'UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;