import { Router } from 'express';
import { getSetting, setSetting, checkPin, setPin } from '../db/index.js';

const router = Router();

router.get('/:key', (req, res) => {
  const val = getSetting(req.params.key);
  if (val === null) return res.status(404).json({ error: 'not found' });
  res.json(val);
});

router.put('/:key', (req, res) => {
  setSetting(req.params.key, req.body);
  res.json({ ok: true });
});

router.post('/admin/verify-pin', (req, res) => {
  const { pin } = req.body;
  if (!pin || !/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'Invalid PIN format' });
  const pinSet = getSetting('admin_pin') !== null;
  if (!pinSet) {
    // First time: set the PIN automatically
    setPin(pin);
    return res.json({ ok: true, firstTime: true });
  }
  res.json({ ok: checkPin(pin) });
});

router.post('/admin/set-pin', (req, res) => {
  const { currentPin, newPin } = req.body;
  if (!checkPin(currentPin)) return res.status(403).json({ error: 'Wrong PIN' });
  if (!/^\d{4}$/.test(newPin)) return res.status(400).json({ error: 'PIN must be 4 digits' });
  setPin(newPin);
  res.json({ ok: true });
});

export default router;
