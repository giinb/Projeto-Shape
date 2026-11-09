/* Projeto Shape — dados base: grupos musculares, biblioteca de exercícios e ficha padrão. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ShapeData = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const GROUPS = {
    quadriceps: { label: 'Quadríceps', view: 'front' },
    posterior: { label: 'Posterior de coxa', view: 'back' },
    gluteos: { label: 'Glúteos', view: 'back' },
    peito: { label: 'Peito', view: 'front' },
    ombros: { label: 'Ombros', view: 'front' },
    'deltoide-post': { label: 'Ombro posterior', view: 'back' },
    triceps: { label: 'Tríceps', view: 'back' },
    costas: { label: 'Costas', view: 'back' },
    biceps: { label: 'Bíceps', view: 'front' },
    panturrilha: { label: 'Panturrilha', view: 'back' },
    abdomen: { label: 'Abdômen', view: 'front' }
  };

  // H halteres · B barra · C caneleira · P polia · M máquina · W peso corporal
  const EQUIP = { H: 'Halteres', B: 'Barra', C: 'Caneleira', P: 'Polia', M: 'Máquina', W: 'Peso corporal' };

  const E = (name, group, eq, pattern, sets, reps, extra) =>
    Object.assign({ name, group, equip: eq.split(''), pattern, sets, reps, unit: 'reps', note: '' }, extra || {});

  const LIBRARY = [
    // Quadríceps
    E('Agachamento livre', 'quadriceps', 'B', 'squat', 3, '8–10'),
    E('Agachamento no Smith', 'quadriceps', 'BM', 'squat', 3, '8–12'),
    E('Agachamento com halteres (goblet)', 'quadriceps', 'H', 'squat', 3, '10–12'),
    E('Agachamento sumô com halter', 'quadriceps', 'H', 'squat', 3, '10–12'),
    E('Agachamento com peso corporal', 'quadriceps', 'W', 'squat', 3, '15–20'),
    E('Agachamento hack', 'quadriceps', 'M', 'press', 3, '10–12'),
    E('Leg press 45°', 'quadriceps', 'M', 'press', 3, '10–12'),
    E('Leg press horizontal', 'quadriceps', 'M', 'press', 3, '10–12'),
    E('Agachamento búlgaro', 'quadriceps', 'HW', 'lunge', 3, '10', { note: 'por perna' }),
    E('Agachamento búlgaro (peso corporal)', 'quadriceps', 'W', 'lunge', 3, '12', { note: 'por perna' }),
    E('Afundo com halteres', 'quadriceps', 'H', 'lunge', 3, '10', { note: 'por perna' }),
    E('Passada (avanço) com halteres', 'quadriceps', 'H', 'lunge', 3, '10', { note: 'por perna' }),
    E('Afundo com caneleiras', 'quadriceps', 'CW', 'lunge', 3, '12', { note: 'por perna' }),
    E('Afundo no Smith', 'quadriceps', 'BM', 'lunge', 3, '10', { note: 'por perna' }),
    E('Step-up no banco com halteres', 'quadriceps', 'H', 'lunge', 3, '10', { note: 'por perna' }),
    E('Cadeira extensora', 'quadriceps', 'M', 'extension', 3, '12–15'),
    E('Extensão de joelho com caneleira', 'quadriceps', 'C', 'extension', 3, '15–20'),

    // Posterior de coxa
    E('Mesa flexora', 'posterior', 'M', 'curl', 3, '10–12'),
    E('Cadeira flexora', 'posterior', 'M', 'curl', 3, '12–15'),
    E('Flexão de joelho com caneleira', 'posterior', 'C', 'curl', 3, '12–15'),
    E('Flexão de joelho na polia', 'posterior', 'P', 'curl', 3, '12–15'),
    E('Flexão nórdica assistida', 'posterior', 'W', 'curl', 3, '6–10'),
    E('Stiff com halteres', 'posterior', 'H', 'hinge', 3, '8–10'),
    E('Stiff com barra', 'posterior', 'B', 'hinge', 3, '8–10'),
    E('Levantamento terra romeno', 'posterior', 'B', 'hinge', 3, '8–10'),
    E('Stiff unilateral com halter', 'posterior', 'H', 'hinge', 3, '10', { note: 'por perna' }),

    // Glúteos
    E('Elevação pélvica', 'gluteos', 'BHWM', 'bridge', 3, '8–12'),
    E('Elevação pélvica com barra', 'gluteos', 'B', 'bridge', 3, '8–12'),
    E('Elevação pélvica com halter', 'gluteos', 'H', 'bridge', 3, '10–12'),
    E('Elevação pélvica na máquina', 'gluteos', 'M', 'bridge', 3, '10–12'),
    E('Ponte de glúteo (peso corporal)', 'gluteos', 'W', 'bridge', 3, '15–20'),
    E('Ponte de glúteo unilateral', 'gluteos', 'W', 'bridge', 3, '12', { note: 'por perna' }),
    E('Extensão de quadril (hiperextensão)', 'gluteos', 'WM', 'bridge', 3, '12–15'),
    E('Coice na polia', 'gluteos', 'P', 'kickback', 3, '12–15'),
    E('Coice com caneleira', 'gluteos', 'C', 'kickback', 3, '15'),
    E('Coice na máquina', 'gluteos', 'M', 'kickback', 3, '12–15'),
    E('Coice de 4 apoios (peso corporal)', 'gluteos', 'W', 'kickback', 3, '15–20'),
    E('Cadeira abdutora', 'gluteos', 'M', 'abduction', 3, '15–20'),
    E('Abdução de quadril na polia', 'gluteos', 'P', 'abduction', 3, '15'),
    E('Abdução com caneleira (deitada)', 'gluteos', 'C', 'abduction', 3, '15–20'),

    // Peito
    E('Supino máquina ou halteres', 'peito', 'MH', 'press', 3, '8–12'),
    E('Supino máquina', 'peito', 'M', 'press', 3, '8–12'),
    E('Supino com halteres', 'peito', 'H', 'press', 3, '8–12'),
    E('Supino reto com barra', 'peito', 'B', 'press', 3, '8–10'),
    E('Supino inclinado', 'peito', 'HMB', 'incline', 3, '10–12'),
    E('Supino inclinado com halteres', 'peito', 'H', 'incline', 3, '10–12'),
    E('Supino inclinado com barra', 'peito', 'B', 'incline', 3, '8–10'),
    E('Supino inclinado na máquina', 'peito', 'M', 'incline', 3, '10–12'),
    E('Crucifixo com halteres', 'peito', 'H', 'fly', 3, '10–12'),
    E('Crucifixo na máquina (peck deck)', 'peito', 'M', 'fly', 3, '12–15'),
    E('Crossover na polia', 'peito', 'P', 'fly', 3, '12–15'),
    E('Flexão de braços', 'peito', 'W', 'pushup', 3, '8–12'),
    E('Flexão inclinada (mãos no banco)', 'peito', 'W', 'pushup', 3, '10–15'),

    // Ombros
    E('Desenvolvimento de ombros', 'ombros', 'HMB', 'ohp', 2, '8–12'),
    E('Desenvolvimento com halteres', 'ombros', 'H', 'ohp', 3, '8–12'),
    E('Desenvolvimento na máquina', 'ombros', 'M', 'ohp', 3, '8–12'),
    E('Desenvolvimento com barra', 'ombros', 'B', 'ohp', 3, '8–10'),
    E('Desenvolvimento Arnold', 'ombros', 'H', 'ohp', 3, '10–12'),
    E('Elevação lateral', 'ombros', 'H', 'lateral', 3, '12–15'),
    E('Elevação lateral na polia', 'ombros', 'P', 'lateral', 3, '12–15'),
    E('Elevação lateral na máquina', 'ombros', 'M', 'lateral', 3, '12–15'),
    E('Elevação frontal com halteres', 'ombros', 'H', 'front', 3, '12'),
    E('Elevação frontal na polia', 'ombros', 'P', 'front', 3, '12'),
    E('Elevação frontal com barra', 'ombros', 'B', 'front', 3, '12'),

    // Ombro posterior
    E('Crucifixo inverso', 'deltoide-post', 'HMP', 'reardelt', 3, '12–15'),
    E('Crucifixo inverso com halteres', 'deltoide-post', 'H', 'reardelt', 3, '12–15'),
    E('Crucifixo inverso na máquina', 'deltoide-post', 'M', 'reardelt', 3, '12–15'),
    E('Crucifixo inverso na polia', 'deltoide-post', 'P', 'reardelt', 3, '12–15'),
    E('Face pull', 'deltoide-post', 'P', 'facepull', 2, '12–15'),

    // Tríceps
    E('Tríceps na polia', 'triceps', 'P', 'pushdown', 3, '10–12'),
    E('Tríceps corda', 'triceps', 'P', 'pushdown', 3, '10–12'),
    E('Tríceps na polia (barra V)', 'triceps', 'P', 'pushdown', 3, '10–12'),
    E('Tríceps unilateral na polia', 'triceps', 'P', 'pushdown', 3, '12', { note: 'por braço' }),
    E('Tríceps na máquina', 'triceps', 'M', 'pushdown', 3, '10–12'),
    E('Tríceps francês', 'triceps', 'H', 'overhead', 2, '10–12'),
    E('Tríceps francês na polia', 'triceps', 'P', 'overhead', 3, '10–12'),
    E('Tríceps testa com barra', 'triceps', 'B', 'lying', 3, '10–12'),
    E('Tríceps testa com halteres', 'triceps', 'H', 'lying', 3, '10–12'),
    E('Tríceps coice com halter', 'triceps', 'H', 'kick', 3, '12', { note: 'por braço' }),
    E('Mergulho no banco', 'triceps', 'W', 'dip', 3, '10–15'),
    E('Flexão fechada (tríceps)', 'triceps', 'W', 'dip', 3, '8–12'),

    // Costas
    E('Puxada frontal', 'costas', 'P', 'pulldown', 3, '8–12'),
    E('Puxada com triângulo', 'costas', 'P', 'pulldown', 3, '8–12'),
    E('Puxada supinada', 'costas', 'P', 'pulldown', 3, '8–12'),
    E('Puxada na máquina', 'costas', 'M', 'pulldown', 3, '8–12'),
    E('Barra fixa', 'costas', 'W', 'pulldown', 3, '6–10'),
    E('Barra fixa assistida', 'costas', 'M', 'pulldown', 3, '6–10'),
    E('Pulldown com braços estendidos', 'costas', 'P', 'pullover', 3, '12'),
    E('Remada baixa', 'costas', 'P', 'row', 3, '10–12'),
    E('Remada articulada', 'costas', 'M', 'row', 2, '10–12'),
    E('Remada curvada com barra', 'costas', 'B', 'row', 3, '8–10'),
    E('Remada curvada com halteres', 'costas', 'H', 'row', 3, '10–12'),
    E('Remada unilateral (serrote)', 'costas', 'H', 'row', 3, '10–12', { note: 'por braço' }),
    E('Remada invertida', 'costas', 'BW', 'row', 3, '8–12'),
    E('Hiperextensão lombar', 'costas', 'W', 'lowback', 3, '12–15'),

    // Bíceps
    E('Rosca direta', 'biceps', 'BH', 'curl', 3, '10–12'),
    E('Rosca direta com barra W', 'biceps', 'B', 'curl', 3, '10–12'),
    E('Rosca direta na polia', 'biceps', 'P', 'curl', 3, '10–12'),
    E('Rosca alternada', 'biceps', 'H', 'curl', 3, '10–12'),
    E('Rosca scott na máquina', 'biceps', 'M', 'curl', 3, '10–12'),
    E('Rosca concentrada', 'biceps', 'H', 'curl', 3, '10–12'),
    E('Rosca inclinada com halteres', 'biceps', 'H', 'curl', 3, '10–12'),
    E('Rosca martelo', 'biceps', 'H', 'hammer', 2, '10–12'),
    E('Rosca martelo na corda', 'biceps', 'P', 'hammer', 3, '10–12'),

    // Panturrilha
    E('Panturrilha', 'panturrilha', 'MHW', 'calf', 3, '12–15'),
    E('Panturrilha em pé na máquina', 'panturrilha', 'M', 'calf', 3, '12–15'),
    E('Panturrilha sentada', 'panturrilha', 'M', 'calf', 3, '15'),
    E('Panturrilha no leg press', 'panturrilha', 'M', 'calf', 3, '15'),
    E('Panturrilha em pé com halteres', 'panturrilha', 'H', 'calf', 3, '15'),
    E('Panturrilha no degrau (peso corporal)', 'panturrilha', 'W', 'calf', 3, '15–20'),
    E('Panturrilha unilateral no degrau', 'panturrilha', 'WH', 'calf', 3, '12', { note: 'por perna' }),
    E('Panturrilha no Smith', 'panturrilha', 'BM', 'calf', 3, '12–15'),

    // Abdômen
    E('Prancha abdominal', 'abdomen', 'W', 'plank', 3, '30–45', { unit: 'sec' }),
    E('Prancha lateral', 'abdomen', 'W', 'plank', 3, '20–30', { unit: 'sec', note: 'por lado' }),
    E('Dead bug', 'abdomen', 'W', 'plank', 3, '10', { note: 'por lado' }),
    E('Abdominal na polia', 'abdomen', 'P', 'crunch', 3, '12–15'),
    E('Abdominal na máquina', 'abdomen', 'M', 'crunch', 3, '12–15'),
    E('Abdominal crunch', 'abdomen', 'W', 'crunch', 3, '15–20'),
    E('Abdominal com halter no peito', 'abdomen', 'H', 'crunch', 3, '12–15'),
    E('Elevação de pernas', 'abdomen', 'W', 'legraise', 3, '12–15'),
    E('Elevação de pernas suspensa (barra fixa)', 'abdomen', 'W', 'legraise', 3, '8–12'),
    E('Abdominal bicicleta', 'abdomen', 'W', 'twist', 3, '20'),
    E('Rotação russa com halter', 'abdomen', 'H', 'twist', 3, '20')
  ];

  function norm(s) {
    return String(s == null ? '' : s)
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function findByName(name, extra) {
    const k = norm(name);
    return LIBRARY.concat(extra || []).find(e => norm(e.name) === k) || null;
  }

  /** Alternativas para um exercício: mesmo padrão de movimento primeiro, depois o mesmo grupo. */
  function alternativesFor(name, group, equipFilter, extra) {
    const pool = LIBRARY.concat(extra || []);
    const cur = findByName(name, extra);
    const grp = group || (cur && cur.group);
    const pat = cur && cur.pattern;
    let list = pool.filter(e => e.group === grp && norm(e.name) !== norm(name));
    if (equipFilter && equipFilter.length) list = list.filter(e => e.equip.some(q => equipFilter.includes(q)));
    return list
      .map((e, i) => ({ e, i }))
      .sort((a, b) => ((b.e.pattern === pat) - (a.e.pattern === pat)) || (a.i - b.i))
      .map(x => x.e);
  }

  const DAY_NAMES = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const DAY_INITIAL = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  // ordem de exibição: segunda → domingo
  const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

  /** Ficha padrão: exatamente a divisão semanal enviada. */
  function defaultPlan(uid) {
    const it = (name, group, sets, reps, extra) =>
      Object.assign({ id: uid(), name, group, sets, reps, unit: 'reps', note: '' }, extra || {});
    return {
      days: {
        1: {
          title: 'Quadríceps e glúteos', items: [
            it('Agachamento livre', 'quadriceps', 3, '8–10'),
            it('Leg press 45°', 'quadriceps', 3, '10–12'),
            it('Agachamento búlgaro', 'quadriceps', 3, '10', { note: 'por perna' }),
            it('Cadeira extensora', 'quadriceps', 3, '12–15'),
            it('Cadeira abdutora', 'gluteos', 3, '15–20'),
            it('Panturrilha', 'panturrilha', 3, '12–15')
          ]
        },
        2: {
          title: 'Peito, ombros e tríceps', items: [
            it('Supino máquina ou halteres', 'peito', 3, '8–12'),
            it('Supino inclinado', 'peito', 3, '10–12'),
            it('Desenvolvimento de ombros', 'ombros', 2, '8–12'),
            it('Elevação lateral', 'ombros', 3, '12–15'),
            it('Tríceps na polia', 'triceps', 3, '10–12'),
            it('Tríceps francês', 'triceps', 2, '10–12')
          ]
        },
        3: {
          title: 'Costas e bíceps', items: [
            it('Puxada frontal', 'costas', 3, '8–12'),
            it('Remada baixa', 'costas', 3, '10–12'),
            it('Remada articulada', 'costas', 2, '10–12'),
            it('Face pull', 'deltoide-post', 2, '12–15'),
            it('Rosca direta', 'biceps', 3, '10–12'),
            it('Rosca martelo', 'biceps', 2, '10–12')
          ]
        },
        4: {
          title: 'Posterior de coxa e glúteos', items: [
            it('Mesa flexora', 'posterior', 3, '10–12'),
            it('Stiff com halteres', 'posterior', 3, '8–10'),
            it('Elevação pélvica', 'gluteos', 3, '8–12'),
            it('Cadeira flexora', 'posterior', 2, '12–15'),
            it('Coice na polia', 'gluteos', 2, '12–15'),
            it('Cadeira abdutora', 'gluteos', 2, '15–20')
          ]
        },
        5: {
          title: 'Ombros, braços e abdômen', items: [
            it('Elevação lateral', 'ombros', 3, '12–15'),
            it('Crucifixo inverso', 'deltoide-post', 3, '12–15'),
            it('Rosca alternada', 'biceps', 3, '10–12'),
            it('Tríceps corda', 'triceps', 3, '10–12'),
            it('Prancha abdominal', 'abdomen', 3, '30–45', { unit: 'sec' }),
            it('Abdominal na polia', 'abdomen', 3, '12–15')
          ]
        },
        6: { title: 'Descanso', items: [] },
        0: { title: 'Descanso', items: [] }
      }
    };
  }

  return { GROUPS, EQUIP, LIBRARY, DAY_NAMES, DAY_SHORT, DAY_INITIAL, DAY_ORDER, norm, findByName, alternativesFor, defaultPlan };
});
