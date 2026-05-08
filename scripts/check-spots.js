const fs = require('fs');

const spots = JSON.parse(
  fs.readFileSync('./spots.json', 'utf8')
);

async function checkEmbed(videoId) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );

    return res.ok;
  } catch {
    return false;
  }
}

(async () => {

  let failed = 0;

  console.log('\nChecking YouTube embeds...\n');

  for (const spot of spots) {

    const ok = await checkEmbed(spot.videoId);

    if (ok) {
      console.log(`✅ ${spot.name}`);
    } else {
      console.log(`❌ ${spot.name}`);
      failed++;
    }
  }

  console.log('\n────────────────────');

  if (failed === 0) {
    console.log('All spots embeddable.\n');
  } else {
    console.log(`${failed} spot(s) failed.\n`);
  }

})();