import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '../app.js'

describe('GET /api/health', () => {
  it('répond avec un champ status', async () => {
    const res = await request(app).get('/api/health')
    expect(res.body).toHaveProperty('status')
  })
})