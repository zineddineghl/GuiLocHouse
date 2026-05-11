const PDFDocument = require('pdfkit');

/**
 * Génère un contrat de bail PDF en mémoire et le pipe vers res.
 * @param {object} params
 * @param {object} params.booking  - booking row
 * @param {object} params.house    - house row
 * @param {object} params.owner    - owner user row
 * @param {object} params.tenant   - tenant user row
 * @param {object} res             - Express response (pour pipe)
 */
function generateLeasePDF({ booking, house, owner, tenant }, res) {
  const doc = new PDFDocument({ margin: 60, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="contrat-bail-${booking.id}.pdf"`
  );
  doc.pipe(res);

  const gnfFmt = (n) => Number(n).toLocaleString('fr-FR') + ' GNF';
  const dateFmt = (d) => new Date(d).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });

  // ── ENTÊTE ────────────────────────────────────────────────────────────────
  doc.fontSize(20).font('Helvetica-Bold').text('CONTRAT DE BAIL', { align: 'center' });
  doc.fontSize(11).font('Helvetica').text('Location résidentielle longue durée', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(9).fillColor('#888888').text('GuiLocHouse — www.guilochouse.com', { align: 'center' });
  doc.fillColor('#000000');
  doc.moveDown(1.5);

  // Ligne de séparation
  doc.moveTo(60, doc.y).lineTo(535, doc.y).lineWidth(1).strokeColor('#CCCCCC').stroke();
  doc.moveDown(1);

  // ── ENTRE LES SOUSSIGNÉS ──────────────────────────────────────────────────
  doc.fontSize(12).font('Helvetica-Bold').text('ENTRE LES SOUSSIGNÉS');
  doc.moveDown(0.5);

  doc.fontSize(10).font('Helvetica');

  doc.font('Helvetica-Bold').text('Bailleur (Propriétaire) :', { continued: false });
  doc.font('Helvetica')
    .text(`Nom : ${owner.name}`)
    .text(`Email : ${owner.email}`)
    .text(`Téléphone : ${owner.phone || 'Non renseigné'}`);

  doc.moveDown(0.8);

  doc.font('Helvetica-Bold').text('Locataire :', { continued: false });
  doc.font('Helvetica')
    .text(`Nom : ${tenant.name}`)
    .text(`Email : ${tenant.email}`)
    .text(`Téléphone : ${tenant.phone || 'Non renseigné'}`);

  doc.moveDown(1.5);
  doc.moveTo(60, doc.y).lineTo(535, doc.y).lineWidth(0.5).strokeColor('#CCCCCC').stroke();
  doc.moveDown(1);

  // ── ARTICLE 1 — OBJET DU CONTRAT ─────────────────────────────────────────
  doc.fontSize(12).font('Helvetica-Bold').text('ARTICLE 1 — OBJET DU CONTRAT');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica').text(
    `Le bailleur loue au locataire le bien immobilier décrit ci-dessous :`
  );
  doc.moveDown(0.3);
  doc.font('Helvetica-Bold').text(`Désignation du bien :`);
  doc.font('Helvetica')
    .text(`Type : ${house.type || 'Logement'}`)
    .text(`Titre : ${house.title}`)
    .text(`Ville : ${house.city}${house.neighborhood ? ' — ' + house.neighborhood : ''}`)
    .text(`Adresse : ${house.address || 'Non précisée'}`)
    .text(`Chambres : ${house.bedrooms} | Salles de bain : ${house.bathrooms} | Capacité max : ${house.max_guests} personnes`);

  doc.moveDown(1.5);
  doc.moveTo(60, doc.y).lineTo(535, doc.y).lineWidth(0.5).strokeColor('#CCCCCC').stroke();
  doc.moveDown(1);

  // ── ARTICLE 2 — DURÉE ────────────────────────────────────────────────────
  doc.fontSize(12).font('Helvetica-Bold').text('ARTICLE 2 — DURÉE DE LA LOCATION');
  doc.moveDown(0.5);

  const startDate = new Date(booking.start_date);
  const endDate = new Date(booking.end_date);

  doc.fontSize(10).font('Helvetica')
    .text(`Date d'entrée : ${dateFmt(startDate)}`)
    .text(`Date de fin : ${dateFmt(endDate)}`)
    .text(`Durée : ${booking.duration_months} mois`);

  doc.moveDown(1.5);
  doc.moveTo(60, doc.y).lineTo(535, doc.y).lineWidth(0.5).strokeColor('#CCCCCC').stroke();
  doc.moveDown(1);

  // ── ARTICLE 3 — LOYER & CAUTION ──────────────────────────────────────────
  doc.fontSize(12).font('Helvetica-Bold').text('ARTICLE 3 — LOYER ET CAUTION');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica')
    .text(`Loyer mensuel : ${gnfFmt(house.price_per_month)} (charges comprises)`)
    .text(`Durée totale : ${booking.duration_months} mois`)
    .text(`Montant total du bail : ${gnfFmt(booking.total_price)}`);

  if (house.caution_amount > 0) {
    doc.text(`Caution (dépôt de garantie) : ${gnfFmt(house.caution_amount)}`);
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor('#555555')
      .text('La caution sera restituée dans un délai de 30 jours suivant la fin du bail, déduction faite des éventuelles réparations.');
    doc.fillColor('#000000').fontSize(10);
  } else {
    doc.text('Caution : Aucune caution exigée');
  }

  doc.moveDown(0.5);
  doc.fontSize(9).fillColor('#555555')
    .text('Le paiement du loyer s\'effectue directement entre le locataire et le bailleur (virement bancaire ou espèces), selon les modalités convenues entre les parties.');
  doc.fillColor('#000000').fontSize(10);

  doc.moveDown(1.5);
  doc.moveTo(60, doc.y).lineTo(535, doc.y).lineWidth(0.5).strokeColor('#CCCCCC').stroke();
  doc.moveDown(1);

  // ── ARTICLE 4 — CONDITIONS GÉNÉRALES ─────────────────────────────────────
  doc.fontSize(12).font('Helvetica-Bold').text('ARTICLE 4 — CONDITIONS GÉNÉRALES');
  doc.moveDown(0.5);
  doc.fontSize(10).font('Helvetica');

  const conditions = [
    'Les charges (eau, électricité, etc.) sont incluses dans le loyer.',
    house.smoking_allowed ? 'Le tabac est autorisé dans le logement.' : 'Il est strictement interdit de fumer dans le logement.',
    house.pets_allowed ? 'Les animaux de compagnie sont autorisés.' : 'Les animaux de compagnie ne sont pas autorisés.',
    'Le locataire s\'engage à utiliser le logement en bon père de famille.',
    'Toute dégradation constatée à l\'état des lieux de sortie sera imputée au locataire.',
    'Le présent contrat est soumis aux lois guinéennes en vigueur.',
  ];

  conditions.forEach((c, i) => {
    doc.text(`${i + 1}. ${c}`);
    doc.moveDown(0.2);
  });

  if (house.extra_rules) {
    doc.moveDown(0.3);
    doc.font('Helvetica-Bold').text('Règles spécifiques :');
    doc.font('Helvetica').text(house.extra_rules);
  }

  doc.moveDown(1.5);
  doc.moveTo(60, doc.y).lineTo(535, doc.y).lineWidth(0.5).strokeColor('#CCCCCC').stroke();
  doc.moveDown(1);

  // ── SIGNATURES ────────────────────────────────────────────────────────────
  doc.fontSize(12).font('Helvetica-Bold').text('SIGNATURES');
  doc.moveDown(1);
  doc.fontSize(10).font('Helvetica');

  const sigY = doc.y;

  // Bailleur
  doc.text('Fait à ______________, le ___/___/______', 60);
  doc.moveDown(2);
  doc.text('Signature du Bailleur :', 60);
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor('#888888').text(`(${owner.name})`, 60);
  doc.fillColor('#000000').fontSize(10);
  doc.moveDown(3);

  // Locataire
  doc.text('Signature du Locataire :', 60);
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor('#888888').text(`(${tenant.name})`, 60);
  doc.fillColor('#000000');

  // ── PIED DE PAGE ──────────────────────────────────────────────────────────
  doc.fontSize(8).fillColor('#AAAAAA')
    .text(
      `Contrat généré le ${new Date().toLocaleDateString('fr-FR')} via GuiLocHouse (www.guilochouse.com) — Référence réservation #${booking.id}`,
      60, 760, { align: 'center', width: 475 }
    );

  doc.end();
}

module.exports = { generateLeasePDF };
