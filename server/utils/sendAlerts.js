const { Resend } = require('resend');
const pool = require('../db');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'GuiLocHouse <alertes@guilochouse.com>';

function matchesSearch(search, house) {
  if (search.city && !house.city?.toLowerCase().includes(search.city.toLowerCase())) return false;
  if (search.max_price && house.price_per_month > search.max_price) return false;
  if (search.min_bedrooms && house.bedrooms < search.min_bedrooms) return false;
  if (search.min_surface && house.surface_house && house.surface_house < search.min_surface) return false;
  if (search.amenities?.length) {
    const ha = Array.isArray(house.amenities) ? house.amenities : JSON.parse(house.amenities || '[]');
    if (!search.amenities.every(a => ha.includes(a))) return false;
  }
  return true;
}

async function sendAlerts(house) {
  try {
    const { rows: searches } = await pool.query(`
      SELECT ss.*, u.email, u.name
      FROM saved_searches ss
      JOIN users u ON ss.user_id = u.id
      WHERE u.id != $1
    `, [house.owner_id]);

    // Dédupliquer par user (garder le premier label qui match)
    const toNotify = {};
    for (const s of searches) {
      if (matchesSearch(s, house) && !toNotify[s.user_id]) {
        toNotify[s.user_id] = { email: s.email, name: s.name, label: s.label };
      }
    }

    const houseUrl = `${process.env.CLIENT_URL}/houses/${house.id}`;
    const price = Number(house.price_per_month).toLocaleString('fr-FR');
    const location = [house.neighborhood, house.city].filter(Boolean).join(', ');

    for (const info of Object.values(toNotify)) {
      await resend.emails.send({
        from: FROM,
        to: info.email,
        subject: `Nouvelle annonce correspond à votre alerte — GuiLocHouse`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#111;border-radius:16px;overflow:hidden;border:1px solid #222;">

    <div style="background:#1a1a1a;padding:28px 32px;border-bottom:1px solid #222;text-align:center;">
      <p style="margin:0;font-size:22px;font-weight:900;color:#fbbf24;letter-spacing:-0.5px;">GuiLocHouse</p>
      <p style="margin:6px 0 0;font-size:12px;color:#666;text-transform:uppercase;letter-spacing:2px;">Alerte nouvelle annonce</p>
    </div>

    <div style="padding:32px;">
      <p style="margin:0 0 24px;color:#aaa;font-size:15px;line-height:1.6;">
        Bonjour <strong style="color:#fff;">${info.name}</strong>,<br>
        Une nouvelle annonce correspond à votre alerte <strong style="color:#fbbf24;">"${info.label || 'recherche sauvegardée'}"</strong>.
      </p>

      <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:24px;margin-bottom:28px;">
        <p style="margin:0 0 6px;font-size:19px;font-weight:800;color:#fff;">${house.title}</p>
        <p style="margin:0 0 16px;font-size:13px;color:#777;">📍 ${location}</p>
        <p style="margin:0;font-size:24px;font-weight:900;color:#fbbf24;">
          ${price} GNF
          <span style="font-size:13px;font-weight:400;color:#666;"> / mois</span>
        </p>
        ${house.bedrooms ? `<p style="margin:10px 0 0;font-size:13px;color:#888;">${house.bedrooms} chambre${house.bedrooms > 1 ? 's' : ''} · ${house.surface_house ? house.surface_house + ' m²' : ''}</p>` : ''}
      </div>

      <a href="${houseUrl}"
        style="display:inline-block;background:#fbbf24;color:#000;font-weight:800;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:14px;letter-spacing:0.5px;">
        Voir l'annonce →
      </a>
    </div>

    <div style="padding:20px 32px;border-top:1px solid #1a1a1a;text-align:center;">
      <p style="margin:0;font-size:11px;color:#444;line-height:1.8;">
        GuiLocHouse · Location immobilière en Guinée<br>
        Pour ne plus recevoir ces alertes, supprimez vos recherches sauvegardées dans votre profil.
      </p>
    </div>
  </div>
</body>
</html>`,
      });
    }
  } catch (err) {
    console.error('[sendAlerts]', err.message);
  }
}

module.exports = { sendAlerts };
