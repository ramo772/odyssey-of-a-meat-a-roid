// Fixed multiplayer crew: four named players, their roles, and who owns each decision.
// Raed is always Player 1 (the main character), Zahra 2, Brick 3, Azoz 4. Never reordered.
// Each kiosk item and flight moment belongs to a role; the game hands that decision to its owner
// automatically. Nobody picks who plays.
(function (root) {
  const PEOPLE = [
    { n: 1, id: 'raed', model: 'hero' },
    { n: 2, id: 'zahra', model: 'ponytail' },
    { n: 3, id: 'breek', model: 'explorer' },
    { n: 4, id: 'azoz', model: 'officer' }
  ];
  // Areas of responsibility, and the kiosk item categories in each.
  const DOMAIN_OF = {
    engine: 'propulsion', tank: 'propulsion',
    power: 'power', backup: 'power',
    shield: 'life', cabin: 'life',
    instrument: 'data', recorder: 'data', antenna: 'data',
    objective: 'nav', route: 'nav', orbit: 'nav', booster: 'nav'
  };
  // Flight moments: the dark stretch is a power call, the big rock an engine burn, the shower a route call.
  const MOMENT_DOMAIN = { dark: 'power', rock: 'propulsion', shower: 'nav' };
  // Which player owns each area, by player count.
  const SPLIT = {
    1: { propulsion: 1, power: 1, life: 1, data: 1, nav: 1 },
    2: { propulsion: 1, power: 1, life: 1, data: 2, nav: 2 },
    3: { propulsion: 1, power: 2, life: 2, data: 3, nav: 3 },
    4: { propulsion: 1, power: 2, life: 2, data: 3, nav: 4 }
  };
  function count(n) { return Math.max(1, Math.min(4, n | 0 || 1)); }
  function people(n) { return PEOPLE.slice(0, count(n)); }
  function person(p) { return PEOPLE[p - 1] || null; }
  function ownerOfDomain(domain, n) { const s = SPLIT[count(n)]; return s && s[domain] ? s[domain] : null; }
  function ownerOfCat(cat, n) { return DOMAIN_OF[cat] ? ownerOfDomain(DOMAIN_OF[cat], n) : null; }
  function ownerOfMoment(id, n) { return MOMENT_DOMAIN[id] ? ownerOfDomain(MOMENT_DOMAIN[id], n) : null; }
  function roleKey(p, n) { return count(n) < 2 ? null : 'crole_' + count(n) + '_' + p; }

  const T = {
    en: {
      crewName_raed: 'Raed', crewName_zahra: 'Zahra', crewName_breek: 'Brick', crewName_azoz: 'Azoz',
      crewPlayer: 'Player {n} — {name}', crewRole: 'Role: {role}', crewDecision: 'Decision: {d}',
      crole_2_1: 'Propulsion and Ship Systems Lead', crole_2_2: 'Mission and Science Lead',
      crole_3_1: 'Propulsion Engineer', crole_3_2: 'Ship Systems Engineer', crole_3_3: 'Mission and Science Specialist',
      crole_4_1: 'Propulsion Engineer', crole_4_2: 'Power and Life-Support Engineer', crole_4_3: 'Science and Data Specialist', crole_4_4: 'Navigation and Mission Specialist',
      cdec_engine: 'Select an engine', cdec_tank: 'Select a fuel tank', cdec_power: 'Select a power source', cdec_backup: 'Select a backup',
      cdec_shield: 'Select a shield', cdec_cabin: 'Select a cabin', cdec_instrument: 'Select a science tool', cdec_recorder: 'Select a memory box',
      cdec_antenna: 'Select an antenna', cdec_objective: 'Select a science target', cdec_route: 'Select a route', cdec_orbit: 'Select an orbit', cdec_booster: 'Select a rocket',
      cdec_mo_dark: 'Decide how to use the power', cdec_mo_rock: 'Decide how to get past the rock', cdec_mo_shower: 'Decide how to face the shower'
    },
    ar: {
      crewName_raed: 'رائد', crewName_zahra: 'زهره', crewName_breek: 'بريك', crewName_azoz: 'عزوز',
      crewPlayer: 'اللاعب {n} — {name}', crewRole: 'الدور: {role}', crewDecision: 'القرار: {d}',
      crole_2_1: 'قائد الدفع وأنظمة المركبة', crole_2_2: 'قائد المهمة والعلوم',
      crole_3_1: 'مهندس الدفع', crole_3_2: 'مهندس أنظمة المركبة', crole_3_3: 'أخصائي المهمة والعلوم',
      crole_4_1: 'مهندس الدفع', crole_4_2: 'مهندس الطاقة ودعم الحياة', crole_4_3: 'أخصائي العلوم والبيانات', crole_4_4: 'أخصائي الملاحة والمهمة',
      cdec_engine: 'اختر محركًا', cdec_tank: 'اختر خزان وقود', cdec_power: 'اختر مصدر طاقة', cdec_backup: 'اختر نظامًا احتياطيًا',
      cdec_shield: 'اختر درعًا', cdec_cabin: 'اختر كابينة', cdec_instrument: 'اختر أداة علمية', cdec_recorder: 'اختر وحدة ذاكرة',
      cdec_antenna: 'اختر هوائيًا', cdec_objective: 'اختر هدفًا علميًا', cdec_route: 'اختر مسارًا', cdec_orbit: 'اختر مدارًا', cdec_booster: 'اختر صاروخًا',
      cdec_mo_dark: 'قرّر كيف تستخدم الطاقة', cdec_mo_rock: 'قرّر كيف تتجاوز الصخرة', cdec_mo_shower: 'قرّر كيف تواجه وابل النيازك'
    },
    eg: {
      crewName_raed: 'رائد', crewName_zahra: 'زهره', crewName_breek: 'بريك', crewName_azoz: 'عزوز',
      crewPlayer: 'لاعب {n} — {name}', crewRole: 'الدور: {role}', crewDecision: 'القرار: {d}',
      crole_2_1: 'مسؤول الموتور وأجهزة المركبة', crole_2_2: 'مسؤول المهمة والعلوم',
      crole_3_1: 'مهندس الموتور', crole_3_2: 'مهندس أجهزة المركبة', crole_3_3: 'مسؤول المهمة والعلوم',
      crole_4_1: 'مهندس الموتور', crole_4_2: 'مهندس الكهربا والنَّفَس', crole_4_3: 'مسؤول العلوم والبيانات', crole_4_4: 'مسؤول الطريق والمهمة',
      cdec_engine: 'اختار موتور', cdec_tank: 'اختار تانك بنزين', cdec_power: 'اختار مصدر كهربا', cdec_backup: 'اختار استبن',
      cdec_shield: 'اختار درع', cdec_cabin: 'اختار كابينة', cdec_instrument: 'اختار أداة علوم', cdec_recorder: 'اختار علبة ذاكرة',
      cdec_antenna: 'اختار أريال', cdec_objective: 'اختار هدف علمي', cdec_route: 'اختار طريق', cdec_orbit: 'اختار هتلف إزاي', cdec_booster: 'اختار صاروخ',
      cdec_mo_dark: 'قرّر هتعمل إيه بالكهربا', cdec_mo_rock: 'قرّر هتعدّي الحجر إزاي', cdec_mo_shower: 'قرّر هتعمل إيه في مطر الشهب'
    },
    fr: {
      crewName_raed: 'Raed', crewName_zahra: 'Zahra', crewName_breek: 'Brick', crewName_azoz: 'Azoz',
      crewPlayer: 'Joueur {n} — {name}', crewRole: 'Rôle : {role}', crewDecision: 'Décision : {d}',
      crole_2_1: 'Responsable propulsion et systèmes', crole_2_2: 'Responsable mission et science',
      crole_3_1: 'Ingénieur propulsion', crole_3_2: 'Ingénieur systèmes du vaisseau', crole_3_3: 'Spécialiste mission et science',
      crole_4_1: 'Ingénieur propulsion', crole_4_2: 'Ingénieur énergie et survie', crole_4_3: 'Spécialiste science et données', crole_4_4: 'Spécialiste navigation et mission',
      cdec_engine: 'Choisis un moteur', cdec_tank: 'Choisis un réservoir', cdec_power: 'Choisis une source d’énergie', cdec_backup: 'Choisis un secours',
      cdec_shield: 'Choisis un bouclier', cdec_cabin: 'Choisis une cabine', cdec_instrument: 'Choisis un outil scientifique', cdec_recorder: 'Choisis une mémoire',
      cdec_antenna: 'Choisis une antenne', cdec_objective: 'Choisis une cible scientifique', cdec_route: 'Choisis un chemin', cdec_orbit: 'Choisis une orbite', cdec_booster: 'Choisis une fusée',
      cdec_mo_dark: 'Décide quoi faire de l’énergie', cdec_mo_rock: 'Décide comment passer le rocher', cdec_mo_shower: 'Décide face à l’essaim'
    },
    es: {
      crewName_raed: 'Raed', crewName_zahra: 'Zahra', crewName_breek: 'Brick', crewName_azoz: 'Azoz',
      crewPlayer: 'Jugador {n} — {name}', crewRole: 'Rol: {role}', crewDecision: 'Decisión: {d}',
      crole_2_1: 'Jefe de propulsión y sistemas', crole_2_2: 'Jefe de misión y ciencia',
      crole_3_1: 'Ingeniero de propulsión', crole_3_2: 'Ingeniero de sistemas de la nave', crole_3_3: 'Especialista en misión y ciencia',
      crole_4_1: 'Ingeniero de propulsión', crole_4_2: 'Ingeniero de energía y soporte vital', crole_4_3: 'Especialista en ciencia y datos', crole_4_4: 'Especialista en navegación y misión',
      cdec_engine: 'Elige un motor', cdec_tank: 'Elige un tanque', cdec_power: 'Elige una fuente de energía', cdec_backup: 'Elige un respaldo',
      cdec_shield: 'Elige un escudo', cdec_cabin: 'Elige una cabina', cdec_instrument: 'Elige una herramienta científica', cdec_recorder: 'Elige una memoria',
      cdec_antenna: 'Elige una antena', cdec_objective: 'Elige un objetivo científico', cdec_route: 'Elige un camino', cdec_orbit: 'Elige una órbita', cdec_booster: 'Elige un cohete',
      cdec_mo_dark: 'Decide qué hacer con la energía', cdec_mo_rock: 'Decide cómo pasar la roca', cdec_mo_shower: 'Decide cómo enfrentar la lluvia'
    }
  };

  const api = { PEOPLE, DOMAIN_OF, MOMENT_DOMAIN, SPLIT, count, people, person, ownerOfDomain, ownerOfCat, ownerOfMoment, roleKey };
  root.Crew = api;
  root.CrewCopy = T;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
