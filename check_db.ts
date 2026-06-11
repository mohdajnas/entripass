import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envData = fs.readFileSync('/Users/apple/Downloads/scratch/entripass/ticket/.env.local', 'utf8');
const lines = envData.split('\n');
let url = '', key = '';
for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim().replace(/^"|"$/g, '');
}

const supabase = createClient(url, key);

async function check() {
  const { data: events } = await supabase.from('events').select('id, title, created_at').order('created_at', { ascending: false }).limit(3);
  console.log('Events:', events);
}

check();
