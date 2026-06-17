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
  const { data: events } = await supabase.from('events').select('id, description').limit(3);
  for (const ev of events || []) {
    if (ev.description && ev.description.includes('||TICKET_DESIGN||')) {
      const design = ev.description.split(' ||TICKET_DESIGN|| ')[1];
      try {
         console.log('Event', ev.id, 'Design:', JSON.parse(design).backgroundValue);
      } catch (e) {
         console.log('Event', ev.id, 'JSON Parse error');
      }
    } else {
      console.log('Event', ev.id, 'No design');
    }
  }
}

check();
