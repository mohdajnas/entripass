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
  const { data: events } = await supabase.from('events').select('id').limit(1);
  if (!events || events.length === 0) {
    console.log("No events found");
    return;
  }
  const eventId = events[0].id;
  console.log('Testing insert for event:', eventId);

  const { data: newGuest, error } = await supabase
    .from("guests")
    .insert({
      event_id: eventId,
      name: "Test User",
      email: "test@example.com",
      status: "confirmed",
      qr_code: "TEST_QR",
      payment_status: "paid",
      amount_paid: 0,
    })
    .select("*");

  console.log('Insert Result:', newGuest);
  if (error) {
    console.error('Insert Error:', JSON.stringify(error, null, 2));
  }
}

check();
