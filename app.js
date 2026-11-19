/*
 * Vaccine Needle Depth Guide
 * Education/discussion tool only. Not medical advice.
 *
 * Needle lengths follow the CDC "During Vaccination" needle length and gauge tables:
 * https://www.cdc.gov/vaccines/hcp/administration/during.html
 * Vaccine routes follow the CDC "U.S. Vaccines" table and FDA labeling.
 * Everything runs in the browser; nothing is stored or sent.
 */
(function () {
  'use strict';

  var CDC_URL = 'https://www.cdc.gov/vaccines/hcp/administration/during.html';

  // ---------- Vaccine list ----------
  // route: IM | SC | IM_SC | SC_ID | ORAL | NASAL | UNKNOWN
  var VACCINES = [
    { group: 'Usually given into muscle (IM)', items: [
      { id: 'covid', name: 'COVID-19 (Comirnaty, Spikevax, Mnexspike, Nuvaxovid)', route: 'IM' },
      { id: 'flu', name: 'Influenza "flu shot" (all injectable types, incl. high-dose and recombinant)', route: 'IM' },
      { id: 'tdap', name: 'Tdap (Boostrix, Adacel)', route: 'IM' },
      { id: 'td', name: 'Td tetanus-diphtheria (Tenivac, TdVax)', route: 'IM' },
      { id: 'dtap', name: 'DTaP and DTaP combinations (children)', route: 'IM' },
      { id: 'hib', name: 'Hib (Haemophilus influenzae type b)', route: 'IM' },
      { id: 'hepa', name: 'Hepatitis A (Havrix, Vaqta)', route: 'IM' },
      { id: 'hepb', name: 'Hepatitis B (Engerix-B, Recombivax HB, Heplisav-B)', route: 'IM' },
      { id: 'hepab', name: 'Hepatitis A + B (Twinrix)', route: 'IM' },
      { id: 'hpv', name: 'HPV (Gardasil 9)', route: 'IM' },
      { id: 'pcv', name: 'Pneumococcal conjugate (Prevnar 20, Vaxneuvance, Capvaxive)', route: 'IM' },
      { id: 'mening', name: 'Meningococcal (Menveo, MenQuadfi, Bexsero, Trumenba, Penbraya, Penmenvy)', route: 'IM' },
      { id: 'rsv', name: 'RSV (Arexvy, Abrysvo, mResvia)', route: 'IM' },
      { id: 'zoster', name: 'Shingles (Shingrix)', route: 'IM' },
      { id: 'rabies', name: 'Rabies (Imovax, RabAvert)', route: 'IM' },
      { id: 'je', name: 'Japanese encephalitis (Ixiaro)', route: 'IM' },
      { id: 'typhoidinj', name: 'Typhoid, injectable (Typhim Vi)', route: 'IM' },
      { id: 'chik', name: 'Chikungunya (Vimkunya)', route: 'IM' }
    ]},
    { group: 'Can be given into muscle OR under the skin', items: [
      { id: 'mmr2', name: 'MMR, M-M-R II brand', route: 'IM_SC' },
      { id: 'var', name: 'Chickenpox / varicella (Varivax)', route: 'IM_SC' },
      { id: 'mmrv', name: 'MMRV (ProQuad)', route: 'IM_SC',
        note: 'FDA added the IM route for ProQuad in 2023, but some CDC tables still list it as under-the-skin only. The package insert in hand is the final word.' },
      { id: 'ipv', name: 'Polio, inactivated (IPOL)', route: 'IM_SC' },
      { id: 'ppsv', name: 'Pneumococcal polysaccharide (Pneumovax 23)', route: 'IM_SC' }
    ]},
    { group: 'Given under the skin (subcutaneous, SC)', items: [
      { id: 'mmrpriorix', name: 'MMR, Priorix brand', route: 'SC' },
      { id: 'yf', name: 'Yellow fever (YF-Vax)', route: 'SC' },
      { id: 'dengue', name: 'Dengue (Dengvaxia)', route: 'SC' },
      { id: 'mpox', name: 'Mpox / smallpox (Jynneos)', route: 'SC_ID' }
    ]},
    { group: 'No needle', items: [
      { id: 'rota', name: 'Rotavirus (by mouth)', route: 'ORAL' },
      { id: 'typhoidoral', name: 'Typhoid, oral capsules (Vivotif)', route: 'ORAL' },
      { id: 'cholera', name: 'Cholera (Vaxchora, by mouth)', route: 'ORAL' },
      { id: 'flumist', name: 'FluMist nasal spray flu vaccine', route: 'NASAL' }
    ]},
    { group: 'Other', items: [
      { id: 'mmrunknown', name: 'MMR, brand not known', route: 'IM_SC',
        note: 'M-M-R II can be given into muscle or under the skin; Priorix is given under the skin only. Ask which brand you are getting.' },
      { id: 'unknown', name: 'Not sure / not listed', route: 'UNKNOWN' }
    ]}
  ];

  var VAX_BY_ID = {};
  VACCINES.forEach(function (g) { g.items.forEach(function (v) { VAX_BY_ID[v.id] = v; }); });

  // ---------- Helpers ----------
  var LB_PER_KG = 2.20462;
  var NEEDLE = {
    0.625: { label: '⅝ inch', mm: 16 },
    1: { label: '1 inch', mm: 25 },
    1.25: { label: '1¼ inch', mm: 32 },
    1.5: { label: '1½ inch', mm: 38 }
  };

  function $(id) { return document.getElementById(id); }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function needleRange(min, max) {
    if (min === max) return NEEDLE[min].label + ' (' + NEEDLE[min].mm + ' mm)';
    return NEEDLE[min].label.replace(' inch', '') + ' to ' + NEEDLE[max].label +
      ' (' + NEEDLE[min].mm + '–' + NEEDLE[max].mm + ' mm)';
  }

  function round1(n) { return Math.round(n * 10) / 10; }

  function ageToDays(value, unit) {
    if (unit === 'days') return value;
    if (unit === 'months') return value * 30.4375;
    return value * 365.25;
  }

  function formatAge(value, unit) {
    var n = round1(value);
    var u = unit;
    if (n === 1) u = unit.replace(/s$/, '');
    return n + ' ' + u;
  }

  // CDC age groups
  function ageBand(days) {
    if (days <= 28) return 'neonate';
    if (days < 365.25) return 'infant';        // 1–12 months
    if (days < 3 * 365.25) return 'toddler';   // 1–2 years
    if (days < 11 * 365.25) return 'child';    // 3–10 years
    if (days < 19 * 365.25) return 'teen';     // 11–18 years
    return 'adult';                            // 19+
  }

  var BAND_LABEL = {
    neonate: 'Newborn (28 days or younger)',
    infant: 'Infant (1–12 months)',
    toddler: 'Toddler (1–2 years)',
    child: 'Child (3–10 years)',
    teen: 'Adolescent (11–18 years)',
    adult: 'Adult (19 years or older)'
  };

  // ---------- IM needle logic (CDC tables) ----------
  // Returns { primary:{site,min,max,flatOnlyForMin}, alternate:{...}|null, sizeKey, notes:[] }
  function imRecommendation(band, lb, sex) {
    var r = { primary: null, alternate: null, sizeKey: null, notes: [] };
    var DELT = 'Deltoid muscle of the upper arm';
    var THIGH = 'Thigh muscle (vastus lateralis, outer front of the thigh)';

    switch (band) {
      case 'neonate':
        r.primary = { site: THIGH, min: 0.625, max: 0.625, flatOnlyForMin: true };
        r.sizeKey = 'small-child';
        break;
      case 'infant':
        r.primary = { site: THIGH, min: 1, max: 1 };
        r.sizeKey = 'small-child';
        break;
      case 'toddler':
        r.primary = { site: THIGH + ' (preferred at this age)', min: 1, max: 1.25 };
        r.alternate = { site: DELT + ' (if muscle mass is adequate)', min: 0.625, max: 1, flatOnlyForMin: true };
        r.sizeKey = 'small-child';
        r.notes.push('At this age the thigh is the preferred site. The arm can be used when the deltoid muscle is big enough.');
        break;
      case 'child':
        r.primary = { site: DELT + ' (preferred)', min: 0.625, max: 1, flatOnlyForMin: true };
        r.alternate = { site: THIGH, min: 1, max: 1.25 };
        r.sizeKey = 'child';
        break;
      case 'teen':
        r.primary = { site: DELT + ' (preferred)', min: 0.625, max: 1, flatOnlyForMin: true };
        r.alternate = { site: THIGH + ' (can also be used)', min: null, max: null };
        r.sizeKey = 'teen';
        r.notes.push('CDC also notes that most adolescents and adults need a 1- to 1½-inch (25–38 mm) needle to reach muscle, so larger teens may need the longer end of the range.');
        if (lb) {
          if (lb < 132) {
            r.notes.push('In a study of 11- to 15-year-olds with the skin stretched flat, a ⅝-inch needle was adequate in 92%. For lighter teens (under about 132 lb / 60 kg), a 1-inch needle on flattened skin more often came close to bone.');
          } else {
            r.notes.push('In a study of 11- to 15-year-olds, a 1-inch needle was adequate for 93% of those weighing 132 lb (60 kg) or more.');
          }
        }
        break;
      default: // adult — CDC bands are defined in pounds
        var s = sex || 'unspecified';
        if (lb < 130) {
          r.primary = { site: DELT + ' (preferred)', min: 0.625, max: 1, flatOnlyForMin: true, adultLean: true };
          r.sizeKey = 'lean';
          r.notes.push('CDC lists 1 inch for adults under 130 lb (60 kg). Some experts use ⅝ inch in this group, but only with the skin stretched tight and the tissue not bunched.');
        } else if (lb < 153) {
          r.primary = { site: DELT + ' (preferred)', min: 1, max: 1 };
          r.sizeKey = 'middle';
        } else if (s === 'female') {
          if (lb <= 200) { r.primary = { site: DELT + ' (preferred)', min: 1, max: 1.5 }; r.sizeKey = 'range'; }
          else { r.primary = { site: DELT + ' (preferred)', min: 1.5, max: 1.5 }; r.sizeKey = 'large'; }
        } else if (s === 'male') {
          if (lb <= 260) { r.primary = { site: DELT + ' (preferred)', min: 1, max: 1.5 }; r.sizeKey = 'range'; }
          else { r.primary = { site: DELT + ' (preferred)', min: 1.5, max: 1.5 }; r.sizeKey = 'large'; }
        } else {
          if (lb <= 200) {
            r.primary = { site: DELT + ' (preferred)', min: 1, max: 1.5 }; r.sizeKey = 'range';
          } else if (lb <= 260) {
            r.primary = { site: DELT + ' (preferred)', min: 1, max: 1.5 }; r.sizeKey = 'range';
            r.notes.push('Between 201 and 260 lb (91–118 kg), CDC lists 1 to 1½ inches for men and 1½ inches for women.');
          } else {
            r.primary = { site: DELT + ' (preferred)', min: 1.5, max: 1.5 }; r.sizeKey = 'large';
          }
        }
        r.alternate = { site: THIGH + ' (can also be used)', min: null, max: null };
        if (r.sizeKey === 'range') {
          r.notes.push('Within the 1- to 1½-inch range, the arm matters more than the scale. Women tend to have more fat over the deltoid than men at the same weight. In one study, every adult whose fat layer was thicker than 25 mm (1 inch) had a BMI of 33 or more or an upper-arm circumference of 40 cm (15.7 in) or more. In lean men under 260 lb, a 1½-inch needle is more likely to go deeper than needed.');
        }
        if (r.sizeKey === 'large') {
          r.notes.push('Even a 1½-inch needle may not reach muscle in about 1 in 4 people above these weights, so careful technique matters (see below).');
        }
    }
    return r;
  }

  // ---------- Technique guidance ----------
  // Returns per-technique status: 'fit' | 'caution' | 'neutral' plus text
  function techniqueAdvice(rec, band) {
    var key = rec.sizeKey;
    var allowsFiveEighths = rec.primary && rec.primary.min === 0.625;

    var normal = { status: 'neutral', tag: 'Standard',
      text: 'Skin neither stretched nor pinched. The chart lengths are the starting point; the landmark and a straight-in (90°) angle matter most.' };
    var flat = { status: 'neutral', tag: 'Option',
      text: 'Thumb and finger spread the skin taut. This compresses fat, bringing the muscle closer to the surface, but it also brings the bone closer.' };
    var bunch = { status: 'neutral', tag: 'Option',
      text: 'The muscle is grasped and lifted. This pulls it away from the bone but adds more tissue for the needle to cross. CDC says a bunched injection needs a needle of at least 1 inch.' };
    var summary = '';

    if (key === 'small-child' || key === 'child') {
      bunch.status = 'fit'; bunch.tag = 'Often used';
      bunch.text += ' Commonly used in small children to keep the needle off bone.';
      if (allowsFiveEighths || band === 'neonate') {
        flat.status = 'fit'; flat.tag = 'Required with ⅝ inch';
        flat.text += ' If a ⅝-inch needle is used, the skin must be stretched flat and not bunched.';
      }
      summary = 'For small arms and legs, the main risk is going too deep. A ⅝-inch needle goes with flat skin; a 1-inch needle can go with gentle bunching.';
      if (band === 'neonate') {
        bunch.status = 'caution'; bunch.tag = 'Not with ⅝ inch';
        bunch.text = 'The muscle is grasped and lifted. CDC says a bunched injection needs a needle of at least 1 inch, so it is not used with the ⅝-inch needle recommended for newborns.';
        summary = 'Newborns get a ⅝-inch needle in the thigh, with the skin stretched flat.';
      }
    } else if (key === 'teen') {
      flat.status = 'fit'; flat.tag = 'Required with ⅝ inch';
      flat.text += ' If a ⅝-inch needle is used, the skin must be stretched flat and not bunched.';
      bunch.status = 'neutral'; bunch.tag = 'Only with 1 inch or longer';
      summary = 'Ask which length they are using, then match the technique: ⅝ inch with flat skin, or 1 inch (with gentle bunching in a slim arm).';
    } else if (key === 'lean') {
      flat.status = 'fit'; flat.tag = 'Required with ⅝ inch';
      flat.text += ' Required if a ⅝-inch needle is used.';
      bunch.status = 'fit'; bunch.tag = 'Reasonable with 1 inch';
      bunch.text += ' In a thin arm, gentle bunching with a 1-inch needle keeps the tip away from bone.';
      summary = 'In a slim arm, the main risk is going too deep. Pair a ⅝-inch needle with flat skin, or a 1-inch needle with gentle bunching. A 1½-inch needle is usually more than needed.';
    } else if (key === 'middle') {
      normal.status = 'fit'; normal.tag = 'Usual';
      summary = 'A 1-inch needle with normal or flattened skin suits most people in this weight range.';
    } else if (key === 'range') {
      flat.status = 'fit'; flat.tag = 'Helpful in larger arms';
      flat.text += ' In a fuller arm, this helps a 1-inch needle reach muscle.';
      bunch.status = 'caution'; bunch.tag = 'Usually not needed';
      bunch.text += ' In adults, bunching pushed the fat layer past 20 mm (0.8 in) in about 1 in 10 people, which risks leaving vaccine in fat.';
      summary = 'Errors can go either way here. Ask how they are choosing between 1 and 1½ inches for your arm.';
    } else if (key === 'large') {
      flat.status = 'fit'; flat.tag = 'Preferred';
      flat.text += ' In a larger arm, compressing fat helps the needle reach muscle.';
      bunch.status = 'caution'; bunch.tag = 'Avoid';
      bunch.text += ' In a larger arm, bunching adds fat for the needle to cross and makes a too-shallow injection more likely.';
      summary = 'In a larger arm, the main risk is stopping short of muscle. A 1½-inch needle with the skin stretched flat is the usual approach.';
    }
    return { normal: normal, flat: flat, bunch: bunch, summary: summary };
  }

  // ---------- Report pieces ----------
  function imSection(rec, band, lb) {
    var p = rec.primary;
    var html = '<h3>Into the muscle (IM) <span class="route-badge">IM</span></h3>';
    html += '<div class="needle-box"><div class="sub">Recommended needle length, ' + esc(p.site) + '</div>' +
      '<div class="big">' + needleRange(p.min, p.max) + '</div>' +
      '<div class="sub">22- to 25-gauge needle · inserted straight in (90°)' +
      (p.flatOnlyForMin ? ' · ⅝ inch only with skin stretched flat, not bunched' : '') + '</div></div>';

    if (rec.alternate) {
      var a = rec.alternate;
      html += '<p class="alt-site"><strong>Other site:</strong> ' + esc(a.site) +
        (a.min ? ': ' + needleRange(a.min, a.max) + (a.flatOnlyForMin ? ' (⅝ inch only with skin stretched flat)' : '') : '') + '.</p>';
    }

    if (band === 'adult' && lb) {
      html += '<p class="alt-site"><strong>Based on:</strong> CDC adult table at ' + Math.round(lb) + ' lb (' + round1(lb / LB_PER_KG) + ' kg).</p>';
    } else if (band !== 'adult') {
      html += '<p class="alt-site"><strong>Based on:</strong> CDC table for this age group. For children, CDC sizes needles by age, and the person giving the shot adjusts for body size.</p>';
    }

    rec.notes.forEach(function (n) { html += '<div class="note">' + esc(n) + '</div>'; });

    var t = techniqueAdvice(rec, band);
    html += '<h3>Skin technique: normal, stretched flat, or bunched</h3>';
    if (t.summary) html += '<p><strong>For you:</strong> ' + esc(t.summary) + '</p>';
    html += '<div class="technique-grid">' +
      techCard('Normal tension', t.normal) +
      techCard('Stretched flat', t.flat) +
      techCard('Bunched', t.bunch) + '</div>';
    return html;
  }

  function techCard(title, t) {
    return '<div class="tech ' + t.status + '"><span class="tag">' + esc(t.tag) + '</span>' +
      '<h4>' + esc(title) + '</h4><p>' + esc(t.text) + '</p></div>';
  }

  function scSection(days) {
    var site = days < 365.25
      ? 'Fatty tissue of the thigh (under 12 months of age)'
      : 'Fatty tissue over the back of the upper arm (upper outer triceps area)';
    return '<h3>Under the skin (subcutaneous, SC) <span class="route-badge">SC</span></h3>' +
      '<div class="needle-box"><div class="sub">Recommended needle, ' + esc(site) + '</div>' +
      '<div class="big">⅝ inch (16 mm)</div>' +
      '<div class="sub">23- to 25-gauge needle · same length for all ages and sizes</div></div>' +
      '<p>For a shot under the skin, the person giving it usually pinches up a fold of skin and fat and inserts the needle at a 45° angle, so the vaccine stays in the fat layer above the muscle. Needle depth into the shoulder joint is not a concern with this route.</p>';
  }

  function positionSection(route) {
    var items = [
      'Sit upright with your feet on the floor and your shoulders relaxed.',
      'Fully expose the upper arm. Slip your arm out of the sleeve, or wear a short or loose sleeve. A tightly rolled-up sleeve can push the injection site too high on the shoulder.',
      'Let the arm hang loosely at your side, with your hand resting in your lap. Keep the muscle relaxed. In a cadaver study, placing the hand on the hip shifted the radial nerve higher up the arm.',
      'The usual spot is the middle, thickest part of the shoulder muscle: about 2 to 3 finger-widths (roughly 2 in / 5 cm) below the bony point at the top of the shoulder (the acromion), and above the level of the armpit.',
      'Shots placed too high, near the top of the shoulder, are the most commonly reported cause of shoulder injury after vaccination.',
      'An IM shot goes straight in at 90° and is given quickly. CDC advises against pulling back on the plunger (aspirating) because it adds pain.'
    ];
    if (route === 'SC') {
      items = [
        'Sit upright and fully expose the back of the upper arm (or the thigh for babies).',
        'Relax the arm at your side. The shot goes into the fatty tissue at a 45° angle, not into muscle.'
      ];
    }
    return '<h3>Positioning reminder</h3><ul>' +
      items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
  }

  function questionsSection(route) {
    var q = route === 'SC'
      ? ['Is this vaccine given under the skin or into the muscle?', 'Where on my arm will you give it?']
      : ['What needle length are you planning to use for me today?',
         'Could you show me where you\'ll inject? I\'ve read it should be about 2 to 3 finger-widths below the top of the shoulder.',
         'Will you stretch the skin flat or bunch the muscle with that needle?'];
    return '<h3>Questions you could ask</h3><ul class="questions">' +
      q.map(function (i) { return '<li>"' + esc(i) + '"</li>'; }).join('') + '</ul>' +
      '<p>Most vaccinators welcome these questions. They will make the final call based on what they see and feel.</p>';
  }

  function afterSection(route) {
    if (route === 'SC') return '';
    return '<h3>After the shot</h3><p>A sore arm for a day or two is common. Contact your clinician if shoulder pain is severe, keeps you from lifting your arm, or isn\'t clearly improving after a few days. Pain like this usually starts within 2 days of the shot.</p>';
  }

  // ---------- Build report ----------
  function buildReport(data) {
    var vax = VAX_BY_ID[data.vaccine];
    var days = ageToDays(data.ageValue, data.ageUnit);
    var band = ageBand(days);
    var lb = data.weightLb;
    var dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    var routeText = {
      IM: 'Into the muscle (IM)',
      SC: 'Under the skin (SC)',
      IM_SC: 'Into the muscle (IM) or under the skin (SC)',
      SC_ID: 'Under the skin (SC); sometimes into the skin (intradermal)',
      ORAL: 'By mouth, no needle',
      NASAL: 'Nasal spray, no needle',
      UNKNOWN: 'Confirm with your vaccinator; most injected vaccines go into muscle'
    }[vax.route];

    var html = '<h2>Needle depth discussion guide' + (data.name ? ' for ' + esc(data.name) : '') + '</h2>';
    html += '<p class="report-meta">Prepared ' + esc(dateStr) + ' · For discussion with the person giving the vaccine</p>';

    html += '<div class="summary-grid">' +
      sumItem('Age', formatAge(data.ageValue, data.ageUnit) + ' · ' + BAND_LABEL[band]) +
      sumItem('Weight', lb ? Math.round(lb) + ' lb (' + round1(lb / LB_PER_KG) + ' kg)' : 'Not entered') +
      (band === 'adult' ? sumItem('Sex', { female: 'Female', male: 'Male', unspecified: 'Not specified' }[data.sex]) : '') +
      sumItem('Vaccine', vax.name) +
      sumItem('Route', routeText) +
      '</div>';

    if (vax.note) html += '<div class="note">' + esc(vax.note) + '</div>';

    if (vax.route === 'ORAL' || vax.route === 'NASAL') {
      html += '<h3>No needle needed</h3><p>This vaccine is given ' +
        (vax.route === 'ORAL' ? 'by mouth' : 'as a nasal spray') +
        ', so needle length and depth don\'t apply. If you are getting other shots at the same visit, run this guide again for each of them.</p>';
    } else {
      var rec = imRecommendation(band, lb, data.sex);
      if (vax.route === 'UNKNOWN') {
        html += '<div class="note">Most injected vaccines are given into muscle, so the IM guidance is shown below. Ask which route your vaccine uses. If it is under the skin, a ⅝-inch needle at 45° is standard for all ages.</div>';
      }
      if (vax.route === 'IM_SC') {
        html += '<div class="note">This vaccine is licensed for either route. Ask which one will be used today. Both are shown below.</div>';
      }
      if (vax.route === 'IM' || vax.route === 'IM_SC' || vax.route === 'UNKNOWN') {
        html += imSection(rec, band, lb);
      }
      if (vax.route === 'SC' || vax.route === 'IM_SC' || vax.route === 'SC_ID') {
        html += scSection(days);
        if (vax.route === 'SC_ID') {
          html += '<p>In some situations this vaccine is given as a smaller dose into the skin (intradermal), usually on the forearm, using a different technique.</p>';
        }
      }
      var posRoute = (vax.route === 'SC' || vax.route === 'SC_ID') ? 'SC' : 'IM';
      if (band === 'neonate' || band === 'infant') {
        html += '<h3>Positioning reminder</h3><p>Babies under 12 months usually get IM shots in the thigh. Hold the baby securely on your lap so the leg is still and relaxed. Ask the vaccinator to show you the best hold.</p>';
      } else {
        html += positionSection(posRoute);
      }
      html += questionsSection(posRoute);
      html += afterSection(posRoute);
    }

    html += '<div class="report-disclaimer"><p><strong>Disclaimer:</strong> This report is for discussion and education purposes only and does not represent medical advice. It does not replace the judgment of your clinician or the person giving your vaccine, who may choose a different needle or technique based on your body and the product\'s package insert.</p>' +
      '<p>Needle lengths follow the <a href="' + CDC_URL + '" target="_blank" rel="noopener">CDC needle length and gauge tables</a>.</p></div>';

    html += '<div class="report-actions">' +
      '<button type="button" class="btn primary" id="printBtn">Print or save as PDF</button>' +
      '<button type="button" class="btn secondary" id="editBtn">Edit answers</button></div>';

    return html;
  }

  function sumItem(k, v) {
    return '<div class="summary-item"><span class="k">' + esc(k) + '</span><span class="v">' + esc(v) + '</span></div>';
  }

  // ---------- Form wiring ----------
  function populateVaccines() {
    var sel = $('vaccine');
    VACCINES.forEach(function (g) {
      var og = document.createElement('optgroup');
      og.label = g.group;
      g.items.forEach(function (v) {
        var o = document.createElement('option');
        o.value = v.id;
        o.textContent = v.name;
        og.appendChild(o);
      });
      sel.appendChild(og);
    });
  }

  var ROUTE_HELP = {
    IM: 'Given into muscle (IM).',
    SC: 'Given under the skin (SC).',
    IM_SC: 'Licensed for muscle (IM) or under the skin (SC).',
    SC_ID: 'Given under the skin (SC), sometimes into the skin.',
    ORAL: 'Given by mouth. No needle.',
    NASAL: 'Nasal spray. No needle.',
    UNKNOWN: 'We\'ll show the IM guidance, since most injected vaccines go into muscle.'
  };

  function readForm() {
    var ageValue = parseFloat($('ageValue').value);
    var ageUnit = $('ageUnit').value;
    var weightRaw = parseFloat($('weightValue').value);
    var weightUnit = $('weightUnit').value;
    var sexEl = document.querySelector('input[name="sex"]:checked');
    var weightLb = isFinite(weightRaw) && weightRaw > 0
      ? (weightUnit === 'kg' ? weightRaw * LB_PER_KG : weightRaw) : null;
    return {
      name: $('name').value.trim(),
      ageValue: ageValue,
      ageUnit: ageUnit,
      weightRaw: weightRaw,
      weightLb: weightLb,
      sex: sexEl ? sexEl.value : 'unspecified',
      vaccine: $('vaccine').value
    };
  }

  function validate(d) {
    var errs = [];
    if (!isFinite(d.ageValue) || d.ageValue < 0) {
      errs.push('Enter an age.');
    } else {
      var days = ageToDays(d.ageValue, d.ageUnit);
      if (days > 120 * 365.25) errs.push('Check the age; it looks too high.');
      if (days < 0) errs.push('Check the age.');
      var band = ageBand(days);
      var vax = VAX_BY_ID[d.vaccine];
      var needsNeedle = vax && vax.route !== 'ORAL' && vax.route !== 'NASAL';
      if (band === 'adult' && needsNeedle && !d.weightLb) errs.push('Enter a weight. For adults, CDC needle length depends on weight.');
    }
    if (isFinite(d.weightRaw) && d.weightRaw !== 0) {
      if (d.weightRaw < 0 || !d.weightLb || d.weightLb < 2 || d.weightLb > 900) errs.push('Check the weight and its unit (lb or kg).');
    }
    if (!d.vaccine) errs.push('Choose a vaccine (or "Not sure / not listed").');
    return errs;
  }

  function updateWeightHint() {
    var v = parseFloat($('ageValue').value);
    var hint = $('weightHint');
    if (!isFinite(v)) { hint.textContent = '(needed for adults)'; return; }
    var band = ageBand(ageToDays(v, $('ageUnit').value));
    hint.textContent = band === 'adult' ? '(needed for adults)' : '(optional for children)';
  }

  function init() {
    populateVaccines();
    var form = $('guide-form');
    var report = $('report');
    var errBox = $('form-errors');

    $('vaccine').addEventListener('change', function () {
      var v = VAX_BY_ID[this.value];
      $('vaccineHelp').textContent = v ? ROUTE_HELP[v.route] : '';
    });
    $('ageValue').addEventListener('input', updateWeightHint);
    $('ageUnit').addEventListener('change', updateWeightHint);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = readForm();
      var errs = validate(d);
      if (errs.length) {
        errBox.innerHTML = '<ul>' + errs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
        report.hidden = true;
        return;
      }
      errBox.innerHTML = '';
      report.innerHTML = buildReport(d);
      report.hidden = false;
      report.focus();
      report.scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('printBtn').addEventListener('click', function () { window.print(); });
      $('editBtn').addEventListener('click', function () {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        $('ageValue').focus();
      });
    });

    form.addEventListener('reset', function () {
      errBox.innerHTML = '';
      report.hidden = true;
      report.innerHTML = '';
      $('vaccineHelp').textContent = '';
      setTimeout(updateWeightHint, 0);
    });
  }

  // Expose pure functions for testing (harmless in the browser)
  window.NeedleGuide = { ageBand: ageBand, ageToDays: ageToDays, imRecommendation: imRecommendation, techniqueAdvice: techniqueAdvice };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
