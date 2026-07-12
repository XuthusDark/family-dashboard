import { Router } from 'express';
import { getAllTiles, upsertTile, deleteTile, updateLayouts } from '../db/index.js';
import { randomUUID } from 'crypto';

const router = Router();

router.get('/', (req, res) => {
  res.json(getAllTiles());
});

router.post('/', (req, res) => {
  const tile = { ...req.body, id: req.body.id ?? randomUUID() };
  upsertTile(tile);
  res.json({ ok: true, id: tile.id });
});

router.put('/:id', (req, res) => {
  upsertTile({ ...req.body, id: req.params.id });
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  deleteTile(req.params.id);
  res.json({ ok: true });
});

router.post('/layouts', (req, res) => {
  updateLayouts(req.body);
  res.json({ ok: true });
});

export default router;
