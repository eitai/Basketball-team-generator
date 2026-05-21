import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuth } from '../middleware/adminAuth';
import { normalizePhone, maskPhone } from '../lib/phone';

const router = Router();

async function getOrCreateSettings() {
  let settings = await prisma.gameSettings.findUnique({ where: { id: 'singleton' } });
  if (!settings) {
    settings = await prisma.gameSettings.create({ data: { id: 'singleton' } });
  }
  return settings;
}

async function checkAutoOpen() {
  const settings = await getOrCreateSettings();
  if (!settings.isOpen && settings.opensAt && settings.opensAt <= new Date()) {
    return prisma.gameSettings.update({
      where: { id: 'singleton' },
      data: { isOpen: true, opensAt: null },
    });
  }
  return settings;
}

// GET /api/registration — public
router.get('/', async (_req, res) => {
  const settings = await checkAutoOpen();
  const [registrations, allowedPhones] = await Promise.all([
    prisma.registration.findMany({ orderBy: { registeredAt: 'asc' } }),
    prisma.allowedPhone.findMany({ orderBy: { name: 'asc' }, select: { name: true, phone: true, playerId: true } }),
  ]);
  const phoneToPlayerId = new Map(
    allowedPhones.filter(ap => ap.playerId).map(ap => [ap.phone, ap.playerId!])
  );
  res.json({
    isOpen: settings.isOpen,
    opensAt: settings.opensAt,
    maxPlayers: settings.maxPlayers,
    gameLabel: settings.gameLabel,
    registrations: registrations.map((r, i) => {
      const playerId = r.phone.startsWith('player:')
        ? r.phone.slice('player:'.length)
        : (phoneToPlayerId.get(r.phone) ?? null);
      return {
        id: r.id,
        displayName: r.displayName,
        phone: maskPhone(r.phone),
        registeredAt: r.registeredAt,
        status: i < settings.maxPlayers ? 'confirmed' : 'waitlist',
        position: i + 1,
        playerId,
      };
    }),
    members: allowedPhones.map(m => ({ name: m.name || maskPhone(m.phone) })),
  });
});

// POST /api/registration/register — public
router.post('/register', async (req, res) => {
  const { phone, name } = req.body as { phone?: string; name?: string };
  if (!phone) { res.status(400).json({ error: 'נדרש מספר טלפון' }); return; }

  const normalized = normalizePhone(phone);
  if (!normalized) { res.status(400).json({ error: 'מספר טלפון לא תקין (דוגמה: 0501234567)' }); return; }

  const settings = await checkAutoOpen();
  if (!settings.isOpen) { res.status(403).json({ error: 'ההרשמה סגורה כרגע' }); return; }

  const allowed = await prisma.allowedPhone.findUnique({ where: { phone: normalized } });
  if (!allowed) { res.status(403).json({ error: 'המספר שלך לא נמצא ברשימת הקבוצה' }); return; }

  const existing = await prisma.registration.findUnique({ where: { phone: normalized } });
  if (existing) {
    const position = await prisma.registration.count({ where: { registeredAt: { lte: existing.registeredAt } } });
    const status = position <= settings.maxPlayers ? 'confirmed' : 'waitlist';
    res.json({ alreadyRegistered: true, displayName: existing.displayName, position, status });
    return;
  }

  // Use player-provided name, fall back to pre-saved name if admin set one
  const displayName = name?.trim() || allowed.name || '';
  if (!displayName) { res.status(400).json({ error: 'נדרש שם' }); return; }

  const registration = await prisma.registration.create({ data: { phone: normalized, displayName } });

  // Save name back to AllowedPhone if it was empty
  if (!allowed.name) {
    await prisma.allowedPhone.update({ where: { phone: normalized }, data: { name: displayName } });
  }

  const position = await prisma.registration.count();
  const status = position <= settings.maxPlayers ? 'confirmed' : 'waitlist';
  res.status(201).json({ alreadyRegistered: false, displayName: registration.displayName, position, status });
});

// DELETE /api/registration/me — public (self unregister)
router.delete('/me', async (req, res) => {
  const { phone } = req.body as { phone?: string };
  if (!phone) { res.status(400).json({ error: 'נדרש מספר טלפון' }); return; }

  const normalized = normalizePhone(phone);
  if (!normalized) { res.status(400).json({ error: 'מספר טלפון לא תקין' }); return; }

  const existing = await prisma.registration.findUnique({ where: { phone: normalized } });
  if (!existing) { res.status(404).json({ error: 'לא נמצאה הרשמה' }); return; }

  await prisma.registration.delete({ where: { phone: normalized } });
  res.status(204).end();
});

// PUT /api/registration/settings — admin
router.put('/settings', adminAuth, async (req, res) => {
  const { isOpen, opensAt, maxPlayers, gameLabel } = req.body as {
    isOpen?: boolean;
    opensAt?: string | null;
    maxPlayers?: number;
    gameLabel?: string;
  };
  const data: Record<string, unknown> = {};
  if (isOpen !== undefined) data['isOpen'] = isOpen;
  if (maxPlayers !== undefined) data['maxPlayers'] = maxPlayers;
  if (gameLabel !== undefined) data['gameLabel'] = gameLabel;
  if (opensAt !== undefined) data['opensAt'] = opensAt ? new Date(opensAt) : null;

  const settings = await prisma.gameSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', ...data },
    update: data,
  });
  res.json(settings);
});

// DELETE /api/registration/all — admin (clear all registrations)
router.delete('/all', adminAuth, async (_req, res) => {
  await prisma.registration.deleteMany();
  res.status(204).end();
});

// GET /api/registration/allowed-phones — admin
router.get('/allowed-phones', adminAuth, async (_req, res) => {
  const phones = await prisma.allowedPhone.findMany({
    orderBy: { name: 'asc' },
    include: { player: { select: { id: true, name: true, position: true } } },
  });
  res.json(phones);
});

// PUT /api/registration/allowed-phones/:id/link — admin: link/unlink to player
router.put('/allowed-phones/:id/link', adminAuth, async (req, res) => {
  const { playerId } = req.body as { playerId: string | null };

  if (playerId) {
    // Unlink any existing phone linked to this player first
    await prisma.allowedPhone.updateMany({ where: { playerId }, data: { playerId: null } });
    const entry = await prisma.allowedPhone.update({
      where: { id: req.params['id'] },
      data: { playerId, name: (await prisma.player.findUnique({ where: { id: playerId } }))?.name ?? '' },
      include: { player: { select: { id: true, name: true, position: true } } },
    });
    res.json(entry);
  } else {
    const entry = await prisma.allowedPhone.update({
      where: { id: req.params['id'] },
      data: { playerId: null },
      include: { player: { select: { id: true, name: true, position: true } } },
    });
    res.json(entry);
  }
});

// POST /api/registration/allowed-phones — admin (add single)
router.post('/allowed-phones', adminAuth, async (req, res) => {
  const { phone, name } = req.body as { phone?: string; name?: string };
  if (!phone) { res.status(400).json({ error: 'נדרש מספר טלפון' }); return; }

  const normalized = normalizePhone(phone);
  if (!normalized) { res.status(400).json({ error: 'מספר טלפון לא תקין' }); return; }

  const entry = await prisma.allowedPhone.upsert({
    where: { phone: normalized },
    create: { phone: normalized, name: name?.trim() ?? '' },
    update: { name: name?.trim() ?? '' },
  });
  res.status(201).json(entry);
});

// POST /api/registration/allowed-phones/bulk — admin
router.post('/allowed-phones/bulk', adminAuth, async (req, res) => {
  const { lines } = req.body as { lines?: string };
  if (!lines) { res.status(400).json({ error: 'נדרש טקסט' }); return; }

  const results = { added: 0, updated: 0, invalid: [] as string[] };
  const rows = lines.split('\n').map(l => l.trim()).filter(Boolean);

  for (const row of rows) {
    // Supports: "Name: phone", "Name phone", or just "phone"
    const match = row.match(/^(.*?)[\s:]+(\d[\d\s\-+]+)$/) || row.match(/^(\d[\d\s\-+]+)$/);
    let name = '';
    let rawPhone = '';
    if (!match) { results.invalid.push(row); continue; }
    if (match.length === 3) { name = (match[1] ?? '').trim(); rawPhone = match[2] ?? ''; }
    else { name = ''; rawPhone = match[1] ?? ''; }

    const normalized = normalizePhone(rawPhone);
    if (!normalized) { results.invalid.push(row); continue; }
    if (!name) name = normalized;

    const existing = await prisma.allowedPhone.findUnique({ where: { phone: normalized } });
    if (existing) {
      await prisma.allowedPhone.update({ where: { phone: normalized }, data: { name } });
      results.updated++;
    } else {
      await prisma.allowedPhone.create({ data: { phone: normalized, name } });
      results.added++;
    }
  }
  res.json(results);
});

// DELETE /api/registration/allowed-phones/:id — admin
router.delete('/allowed-phones/:id', adminAuth, async (req, res) => {
  await prisma.allowedPhone.delete({ where: { id: req.params['id'] } });
  res.status(204).end();
});

// POST /api/registration/admin-register — admin: register someone directly (bypasses isOpen)
router.post('/admin-register', adminAuth, async (req, res) => {
  const { phone, name } = req.body as { phone?: string; name?: string };
  if (!phone) { res.status(400).json({ error: 'נדרש מספר טלפון' }); return; }
  if (!name?.trim()) { res.status(400).json({ error: 'נדרש שם' }); return; }

  const normalized = normalizePhone(phone);
  if (!normalized) { res.status(400).json({ error: 'מספר טלפון לא תקין' }); return; }

  const settings = await getOrCreateSettings();

  const existing = await prisma.registration.findUnique({ where: { phone: normalized } });
  if (existing) {
    const position = await prisma.registration.count({ where: { registeredAt: { lte: existing.registeredAt } } });
    const status = position <= settings.maxPlayers ? 'confirmed' : 'waitlist';
    res.json({ alreadyRegistered: true, displayName: existing.displayName, position, status });
    return;
  }

  const registration = await prisma.registration.create({ data: { phone: normalized, displayName: name.trim() } });
  const position = await prisma.registration.count();
  const status = position <= settings.maxPlayers ? 'confirmed' : 'waitlist';
  res.status(201).json({ alreadyRegistered: false, displayName: registration.displayName, position, status });
});

// POST /api/registration/mark-player — admin: mark an existing player as attending (no phone needed)
router.post('/mark-player', adminAuth, async (req, res) => {
  const { playerId } = req.body as { playerId?: string };
  if (!playerId) { res.status(400).json({ error: 'נדרש מזהה שחקן' }); return; }

  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) { res.status(404).json({ error: 'שחקן לא נמצא' }); return; }

  const settings = await getOrCreateSettings();
  // Use a synthetic phone that can't conflict with real numbers
  const syntheticPhone = `player:${playerId}`;

  const existing = await prisma.registration.findUnique({ where: { phone: syntheticPhone } });
  if (existing) {
    const position = await prisma.registration.count({ where: { registeredAt: { lte: existing.registeredAt } } });
    const status = position <= settings.maxPlayers ? 'confirmed' : 'waitlist';
    res.json({ alreadyRegistered: true, displayName: existing.displayName, position, status });
    return;
  }

  const registration = await prisma.registration.create({ data: { phone: syntheticPhone, displayName: player.name } });
  const position = await prisma.registration.count();
  const status = position <= settings.maxPlayers ? 'confirmed' : 'waitlist';
  res.status(201).json({ alreadyRegistered: false, displayName: registration.displayName, position, status });
});

// DELETE /api/registration/:id — admin (remove a registration by id)
router.delete('/:id', adminAuth, async (req, res) => {
  await prisma.registration.delete({ where: { id: req.params['id'] } });
  res.status(204).end();
});

export default router;
