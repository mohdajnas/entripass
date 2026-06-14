const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/dashboard/events/[eventId]/tickets/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find the start of the designer portal
const portalStartIndex = content.indexOf('{/* FULLSCREEN PHOTOSHOP-STYLE TICKET DESIGNER */}');

if (portalStartIndex !== -1) {
  const beforePortal = content.slice(0, portalStartIndex);
  let portalContent = content.slice(portalStartIndex);

  // Replace slate with neutral in the portal
  portalContent = portalContent.replace(/slate-/g, 'neutral-');

  // Change the center canvas background to Photoshop medium gray (#535353)
  portalContent = portalContent.replace(/bg-\[#1a1a1a\]/g, 'bg-[#535353]');

  fs.writeFileSync(filePath, beforePortal + portalContent);
  console.log('Successfully updated the designer theme to neutral grays.');
} else {
  console.log('Could not find designer portal.');
}
