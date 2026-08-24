const express = require('express');
const pool = require('../db/pool');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/admin/pending-admins
router.get('/pending-admins', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, flat_number, role, admin_status, created_at
       FROM users
       WHERE role = 'admin' AND admin_status = 'pending'
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching pending admin requests:', err);
    res.status(500).json({ error: 'Failed to fetch pending admin requests' });
  }
});

// GET /api/admin/all-admins
router.get('/all-admins', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, flat_number, role, admin_status, created_at
       FROM users
       WHERE role = 'admin'
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching all admins:', err);
    res.status(500).json({ error: 'Failed to fetch all admins' });
  }
});

// PATCH /api/admin/pending-admins/:id/approve
router.patch('/pending-admins/:id/approve', authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const targetRes = await pool.query(
      'SELECT id, name, email, role, admin_status FROM users WHERE id = $1',
      [id]
    );

    if (targetRes.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found' });
    }

    const targetUser = targetRes.rows[0];

    if (targetUser.role !== 'admin') {
      return res.status(400).json({ error: 'Target account is not an administrator' });
    }

    if (targetUser.admin_status === 'approved') {
      return res.status(400).json({ error: 'Admin account is already approved' });
    }

    if (targetUser.admin_status !== 'pending') {
      return res.status(400).json({ error: `Cannot approve account with status: ${targetUser.admin_status}` });
    }

    const updateRes = await pool.query(
      `UPDATE users
       SET admin_status = 'approved'
       WHERE id = $1
       RETURNING id, name, email, role, admin_status, flat_number, created_at`,
      [id]
    );

    const updatedUser = updateRes.rows[0];

    res.json({
      message: 'Admin access approved successfully.',
      user: updatedUser,
    });
  } catch (err) {
    console.error('Error approving admin request:', err);
    res.status(500).json({ error: 'Failed to approve admin request' });
  }
});

// POST /api/admin/seed-production-db
router.post('/seed-production-db', authenticate, requireAdmin, async (req, res) => {
  const bcrypt = require('bcryptjs');
  try {
    console.log('🧹 Purging old operational data...');
    await pool.query('DELETE FROM email_logs');
    await pool.query('DELETE FROM notifications');
    await pool.query('DELETE FROM complaint_history');
    await pool.query('DELETE FROM complaints');
    await pool.query('DELETE FROM notices');

    // Create resident users if not exist
    const residents = [
      { name: 'John Resident', email: 'resident@society.com', flat: 'A-301' },
      { name: 'Priya Sharma', email: 'priya.sharma@society.com', flat: 'B-104' },
      { name: 'Rahul Verma', email: 'rahul.verma@society.com', flat: 'C-202' },
      { name: 'Anita Desai', email: 'anita.desai@society.com', flat: 'A-501' },
      { name: 'Vikram Mehta', email: 'vikram.mehta@society.com', flat: 'D-303' },
    ];

    const residentIds = [];
    const defaultHash = await bcrypt.hash('Resident@123', 10);
    const adminHash = await bcrypt.hash('Admin@123', 10);

    for (const r of residents) {
      let rRes = await pool.query('SELECT id FROM users WHERE email = $1', [r.email]);
      if (rRes.rows.length === 0) {
        rRes = await pool.query(
          `INSERT INTO users (name, email, password_hash, role, flat_number)
           VALUES ($1, $2, $3, 'resident', $4) RETURNING id`,
          [r.name, r.email, defaultHash, r.flat]
        );
      }
      residentIds.push(rRes.rows[0].id);
    }

    // Secondary Admin accounts
    const secAdmins = [
      { name: 'Sarah Approved', email: 'approved.admin@society.com', status: 'approved', flat: 'B-101' },
      { name: 'Robert Rejected', email: 'rejected.admin@society.com', status: 'rejected', flat: 'C-202' },
      { name: 'David Pending', email: 'pending.admin@society.com', status: 'pending', flat: 'D-404' },
    ];

    for (const sa of secAdmins) {
      const saRes = await pool.query('SELECT id FROM users WHERE email = $1', [sa.email]);
      if (saRes.rows.length === 0) {
        await pool.query(
          `INSERT INTO users (name, email, password_hash, role, admin_status, flat_number)
           VALUES ($1, $2, $3, 'admin', $4, $5)`,
          [sa.name, sa.email, adminHash, sa.status, sa.flat]
        );
      }
    }

    // Complaints Pool
    const SEED_COMPLAINTS = [
      { category: 'Plumbing', desc: 'Main overhead water tank outlet pipe leaking near Block B stairway.', photo: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400&auto=format&fit=crop&q=80' },
      { category: 'Plumbing', desc: 'Low water pressure in Block A 4th floor master bathroom.', photo: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=400&auto=format&fit=crop&q=80' },
      { category: 'Plumbing', desc: 'Drainage blockage near basement P1 parking causing stagnant water.', photo: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80' },
      { category: 'Plumbing', desc: 'Continuous water seepage from ceiling in C-302 guest bedroom.', photo: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80' },
      { category: 'Plumbing', desc: 'Corroded valve tap leaking continuously in 2nd floor common washroom.', photo: 'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&auto=format&fit=crop&q=80' },
      { category: 'Plumbing', desc: 'Broken lawn sprinkler flooding walking track near North Gate.', photo: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&auto=format&fit=crop&q=80' },
      { category: 'Plumbing', desc: 'Sump pump making grinding noise during automated filling cycle.', photo: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80' },

      { category: 'Electrical', desc: 'Flickering corridor lights on Block C 3rd floor creating safety hazard.', photo: 'https://images.unsplash.com/photo-1555963966-b7ae5404b6ed?w=400&auto=format&fit=crop&q=80' },
      { category: 'Electrical', desc: 'Substation circuit breaker tripped twice during evening peak hours.', photo: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80' },
      { category: 'Electrical', desc: 'Basement P2 lighting panel switch malfunctioning, half area dark.', photo: 'https://images.unsplash.com/photo-1508873696983-2df515122519?w=400&auto=format&fit=crop&q=80' },
      { category: 'Electrical', desc: 'EV charging station Bay 4 displaying ground fault error light.', photo: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400&auto=format&fit=crop&q=80' },
      { category: 'Electrical', desc: 'Clubhouse AC unit tripping main distribution breaker repeatedly.', photo: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&auto=format&fit=crop&q=80' },
      { category: 'Electrical', desc: 'Exhaust fan in generator room stopped spinning completely.', photo: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&auto=format&fit=crop&q=80' },
      { category: 'Electrical', desc: 'Emergency staircase exit sign battery backup light unlit.', photo: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&auto=format&fit=crop&q=80' },

      { category: 'Cleaning', desc: 'Garbage chute jammed on Block B 5th floor, odor spreading.', photo: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400&auto=format&fit=crop&q=80' },
      { category: 'Cleaning', desc: 'Dirty elevator mirrors and scuffed flooring in Lift 2 Block A.', photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80' },
      { category: 'Cleaning', desc: 'Spilled motor oil in Basement P1 slot 42 requires chemical degreasing.', photo: 'https://images.unsplash.com/photo-1618090584126-129cd173f248?w=400&auto=format&fit=crop&q=80' },
      { category: 'Cleaning', desc: 'Stairwell cobwebs accumulating near Block C emergency exit windows.', photo: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&auto=format&fit=crop&q=80' },
      { category: 'Cleaning', desc: 'Overflowing recycling bin near Gate 2 security cabin.', photo: 'https://images.unsplash.com/photo-1604186837056-8e7c286766f2?w=400&auto=format&fit=crop&q=80' },
      { category: 'Cleaning', desc: 'Pigeon droppings on clubhouse terrace seating furniture.', photo: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80' },
      { category: 'Cleaning', desc: 'Children playground sand pit needs weeding and sifting.', photo: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=400&auto=format&fit=crop&q=80' },

      { category: 'Security', desc: 'Main Gate boom barrier sensor sluggish, delaying visitor entries.', photo: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&auto=format&fit=crop&q=80' },
      { category: 'Security', desc: 'CCTV Camera #8 facing podium garden offline since midnight.', photo: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&auto=format&fit=crop&q=80' },
      { category: 'Security', desc: 'Intercom unit not ringing in A-504 when visitors check in at gate.', photo: 'https://images.unsplash.com/photo-1508873696983-2df515122519?w=400&auto=format&fit=crop&q=80' },
      { category: 'Security', desc: 'Pedestrian side gate magnetic lock failing to latch properly.', photo: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&auto=format&fit=crop&q=80' },
      { category: 'Security', desc: 'Unidentified commercial van parked overnight in resident spot B-12.', photo: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400&auto=format&fit=crop&q=80' },
      { category: 'Security', desc: 'Night security patrol guard missing checkpoint scan at 3:00 AM.', photo: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&auto=format&fit=crop&q=80' },
      { category: 'Security', desc: 'Visitor RFID card dispenser jamming frequently at entry kiosk.', photo: 'https://images.unsplash.com/photo-1508873696983-2df515122519?w=400&auto=format&fit=crop&q=80' },

      { category: 'Lift', desc: 'Elevator #1 in Block B making jerky movements between 2nd and 3rd floors.', photo: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=400&auto=format&fit=crop&q=80' },
      { category: 'Lift', desc: 'Lift door sensor sensitivity issue causing doors to re-open repeatedly.', photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80' },
      { category: 'Lift', desc: 'Elevator emergency intercom button unresponsive in Block A Lift 2.', photo: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=400&auto=format&fit=crop&q=80' },
      { category: 'Lift', desc: 'Block C main elevator floor indicator screen displaying error E-04.', photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80' },
      { category: 'Lift', desc: 'Service lift cabin light bulb burned out on Block B service shaft.', photo: 'https://images.unsplash.com/photo-1555963966-b7ae5404b6ed?w=400&auto=format&fit=crop&q=80' },
      { category: 'Lift', desc: 'Elevator ventilation fan producing high pitched squeaking noise.', photo: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=400&auto=format&fit=crop&q=80' },
      { category: 'Lift', desc: 'Lift floor buttons for 7th and 8th floor stuck in depressed state.', photo: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&auto=format&fit=crop&q=80' },

      { category: 'Parking', desc: 'Unassigned vehicle parked illegally in reserved disabled slot near entrance.', photo: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&auto=format&fit=crop&q=80' },
      { category: 'Parking', desc: 'Basement P2 driveway speed breaker loose bolts creating loud noise.', photo: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400&auto=format&fit=crop&q=80' },
      { category: 'Parking', desc: 'Water dripping from AC exhaust pipe onto parked car in slot A-105.', photo: 'https://images.unsplash.com/photo-1542013936693-884638332954?w=400&auto=format&fit=crop&q=80' },
      { category: 'Parking', desc: 'Faded parking slot line markings near Visitor Bay 6 need repainting.', photo: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=400&auto=format&fit=crop&q=80' },
      { category: 'Parking', desc: 'Bicycle rack full with abandoned bicycles obstructing walkway.', photo: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&auto=format&fit=crop&q=80' },
      { category: 'Parking', desc: 'Basement ramp convex safety mirror cracked and misaligned.', photo: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400&auto=format&fit=crop&q=80' },

      { category: 'Other', desc: 'Gym treadmill belt slipping during operation on Unit 2.', photo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80' },
      { category: 'Other', desc: 'Table tennis net torn in community recreation room.', photo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80' },
      { category: 'Other', desc: 'Loud music coming from clubhouse hall after 10:00 PM curfew.', photo: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80' },
      { category: 'Other', desc: 'Swings in kids play area rusted at chain connection joints.', photo: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?w=400&auto=format&fit=crop&q=80' },
      { category: 'Other', desc: 'Stray dog entered compound through broken boundary fence segment.', photo: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80' },
      { category: 'Other', desc: 'Badminton court floor rubber matting peeling off near baseline.', photo: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&auto=format&fit=crop&q=80' },
    ];

    // Statuses & Priorities
    const statusPool = ['Open', 'In Progress', 'Resolved'];
    const priorityPool = ['High', 'Medium', 'Low'];

    const dateDistribution = [
      { dayOffset: 4, count: 8 },
      { dayOffset: 3, count: 13 },
      { dayOffset: 2, count: 7 },
      { dayOffset: 1, count: 17 },
      { dayOffset: 0, count: 3 }
    ];

    const now = new Date();
    let compIdx = 0;

    for (const d of dateDistribution) {
      for (let k = 0; k < d.count; k++) {
        const item = SEED_COMPLAINTS[compIdx % SEED_COMPLAINTS.length];
        const status = statusPool[compIdx % statusPool.length];
        const priority = priorityPool[compIdx % priorityPool.length];
        const residentId = residentIds[compIdx % residentIds.length];

        const dateObj = new Date(now);
        dateObj.setDate(now.getDate() - d.dayOffset);
        dateObj.setHours((compIdx * 2 + 7) % 24, (compIdx * 13) % 60, 0, 0);

        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const mins = String(dateObj.getMinutes()).padStart(2, '0');
        const secs = String(dateObj.getSeconds()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day} ${hours}:${mins}:${secs}`;

        const cRes = await pool.query(
          `INSERT INTO complaints (resident_id, category, description, photo_url, status, priority, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [residentId, item.category, item.desc, item.photo, status, priority, formattedDate, formattedDate]
        );

        const cId = cRes.rows[0].id;

        await pool.query(
          `INSERT INTO complaint_history (complaint_id, actor_id, actor_role, change_type, old_value, new_value, note, created_at)
           VALUES ($1, $2, 'resident', 'created', null, 'Open', 'Complaint registered.', $3)`,
          [cId, residentId, formattedDate]
        );

        if (status !== 'Open') {
          await pool.query(
            `INSERT INTO complaint_history (complaint_id, actor_id, actor_role, change_type, old_value, new_value, note, created_at)
             VALUES ($1, $2, 'admin', 'status_change', 'Open', $3, 'Maintenance assigned.', $4)`,
            [cId, req.user.id, status, formattedDate]
          );
        }

        compIdx++;
      }
    }

    // 6 Notices
    const noticesList = [
      { title: 'Scheduled Power Outage & Lift Maintenance', body: 'Power backup testing across Block A & B on Wednesday from 10 AM to 1 PM.', is_important: true, daysAgo: 4 },
      { title: 'Annual General Body Society Meeting (AGM)', body: 'Discussion on annual budget allocation and solar roof installation on Sunday 5 PM.', is_important: true, daysAgo: 3 },
      { title: 'Swimming Pool Maintenance & Deep Cleaning', body: 'The pool will remain closed for chemical treatment on Friday morning.', is_important: false, daysAgo: 2 },
      { title: 'Quarterly Pest Control Drive in Common Areas', body: 'Pest control service scheduled for basement parking P1 & P2 on Saturday.', is_important: false, daysAgo: 2 },
      { title: 'Weekend Community Yoga & Wellness Camp', body: 'Free morning yoga sessions at the clubhouse lawn on Saturday & Sunday 6:30 AM.', is_important: false, daysAgo: 1 },
      { title: 'Mandatory Waste Segregation Notice', body: 'All residents are requested to separate wet and dry waste before daily pickup.', is_important: false, daysAgo: 0 },
    ];

    for (const n of noticesList) {
      const dateObj = new Date(now);
      dateObj.setDate(now.getDate() - n.daysAgo);
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day} 10:00:00`;

      await pool.query(
        `INSERT INTO notices (title, body, is_important, posted_by, created_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [n.title, n.body, n.is_important, req.user.id, formattedDate]
      );
    }

    console.log('✅ Production DB populated with 48 complaints & 6 notices!');
    res.json({ message: 'Production database populated successfully with 48 complaints and 6 notices.', totalComplaints: 48, totalNotices: 6 });
  } catch (err) {
    console.error('Error seeding production db:', err);
    res.status(500).json({ error: 'Failed to seed production database: ' + err.message });
  }
});

module.exports = router;
