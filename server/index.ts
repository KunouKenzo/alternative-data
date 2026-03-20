import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

const s3 = new S3Client({
  region: process.env.VITE_AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.VITE_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.VITE_AWS_SECRET_ACCESS_KEY!,
  },
})

const S3_BUCKET = 'altdata-exports'

const app = express()
const PORT = process.env.PORT || 3002

app.use(cors())
app.use(express.json())

// API: List all datasets
app.get('/api/datasets', async (req, res) => {
  const { category, search } = req.query
  let query = supabase.from('alt_datasets').select('*').eq('is_public', true).order('last_updated', { ascending: false })
  if (category && category !== 'all') {
    query = query.eq('category', category)
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`)
  }
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// API: Get single dataset with preview
app.get('/api/datasets/:id', async (req, res) => {
  const { data, error } = await supabase.from('alt_datasets').select('*').eq('id', req.params.id).single()
  if (error) return res.status(404).json({ error: 'Dataset not found' })
  res.json(data)
})

// API: Get presigned download URL
app.get('/api/datasets/:id/download', async (req, res) => {
  const { data, error } = await supabase.from('alt_datasets').select('s3_key, title').eq('id', req.params.id).single()
  if (error || !data?.s3_key) return res.status(404).json({ error: 'Dataset not found' })

  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: data.s3_key,
  })
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 })
  res.json({ url, filename: `${data.title}.csv` })
})

// API: List data sources (admin)
app.get('/api/sources', async (req, res) => {
  const { data, error } = await supabase.from('alt_data_sources').select('*').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// API: List collection runs
app.get('/api/runs', async (req, res) => {
  const { source_id } = req.query
  let query = supabase.from('alt_collection_runs').select('*').order('started_at', { ascending: false }).limit(50)
  if (source_id) {
    query = query.eq('source_id', source_id)
  }
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data || [])
})

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'alternative-data' })
})

// Serve frontend
const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Alternative Data server running on port ${PORT}`)
})
