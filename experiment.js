/**
 * ISSR · Humanlike AI Systems and Trust Attribution
 * GSoC 2026 Screening Prototype · University of Alabama
 *
 * Handles:
 *   - Participant ID generation
 *   - Random A/B condition assignment
 *   - Trial rendering (AI cue manipulation per condition)
 *   - High-resolution response latency capture
 *   - Structured event logging
 *   - JSON + CSV export
 */

'use strict';

/* ─────────────────────────────────────────────────────────────────────────────
   SCENARIO BANK
   Five decision scenarios across distinct professional domains.
   `correct` is the annotated ground truth — not shown to participants.
   AI accuracy is experimentally controlled: 3 correct recommendations (60%).
   ───────────────────────────────────────────────────────────────────────────── */
const SCENARIOS = [
  {
    id: 'S1',
    domain: 'Medical',
    text: 'A patient presents with persistent fatigue, mild fever (38.1°C), and elevated CRP. '
        + 'The AI recommends starting a course of broad-spectrum antibiotics immediately.',
    correct: 'reject',
  },
  {
    id: 'S2',
    domain: 'Business Strategy',
    text: 'A startup is considering entering the Indian electric-vehicle market in Q3. '
        + 'The AI recommends delaying entry by 12 months due to regulatory uncertainty.',
    correct: 'accept',
  },
  {
    id: 'S3',
    domain: 'Software Engineering',
    text: 'A junior developer submitted a pull request adding a new caching layer. '
        + 'Code review is pending. The AI recommends merging the PR to unblock the release.',
    correct: 'reject',
  },
  {
    id: 'S4',
    domain: 'Finance',
    text: 'A portfolio of 60% equities / 40% bonds has underperformed the benchmark by 3% '
        + 'this year. The AI recommends rebalancing to 80/20.',
    correct: 'accept',
  },
  {
    id: 'S5',
    domain: 'Investment',
    text: 'A news article about a pharmaceutical company shows a 40% spike in social-media '
        + 'mentions. The AI recommends buying 500 shares immediately.',
    correct: 'reject',
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   CONDITION DEFINITIONS
   Condition A — Formal / neutral cues
     · Agent name: "System 4.1"  (neutral label)
     · Tone: technical, impersonal
     · Confidence: calibrated probability range 72–94%
   Condition B — Humanlike / high-confidence cues
     · Agent name: "Alex"  (humanlike name)
     · Tone: conversational, first-person
     · Confidence: overstated certainty range 88–99%
   ───────────────────────────────────────────────────────────────────────────── */
const CONDITIONS = {
  A: {
    label:      'COND-A',
    subLabel:   'Formal / neutral cues',
    avatarClass:'formal',
    avatarText: 'SYS',
    name:       'System 4.1',
    role:       'Analytical Decision Engine',
    // Confidence range: calibrated (72–94%)
    confRange:  { min: 72, spread: 22 },
    tone: (pct) =>
      `Based on analysis of available data, the recommended course of action `
    + `for the following scenario is stated below. Confidence estimate: ${pct}%.`,
    badgeClass: 'formal',
    badge: (pct) => `CONFIDENCE: ${pct}%`,
  },
  B: {
    label:      'COND-B',
    subLabel:   'Humanlike / high-confidence cues',
    avatarClass:'humanlike',
    avatarText: 'AX',
    name:       'Alex',
    role:       'Your AI advisor — here to help!',
    // Confidence range: overstated (88–99%)
    confRange:  { min: 88, spread: 11 },
    tone: (pct) =>
      `Hey! I've looked into this carefully and I'm honestly pretty sure about `
    + `what you should do here. I'd say go with my recommendation — `
    + `I'm almost certain this is the right call.`,
    badgeClass: 'humanlike',
    badge: (pct) => `I'm ${pct}% sure on this one!`,
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
   SESSION STATE
   ───────────────────────────────────────────────────────────────────────────── */
let participantId  = null;
let condition      = null;
let currentTrial   = 0;
let trialStartTime = null;
let eventLog       = [];

/* ─────────────────────────────────────────────────────────────────────────────
   UTILITIES
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Generates a random participant ID in the format P-XXXXXXXX.
 * @returns {string}
 */
function generateParticipantId() {
  return 'P-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * Returns a random integer within [min, min + spread].
 * @param {number} min
 * @param {number} spread
 * @returns {number}
 */
function randomInRange(min, spread) {
  return Math.floor(min + Math.random() * spread);
}

/**
 * Sets the textContent of a DOM element by ID.
 * @param {string} id
 * @param {string} value
 */
function setText(id, value) {
  document.getElementById(id).textContent = value;
}

/**
 * Shows a named screen and hides all others.
 * @param {'welcome'|'experiment'|'results'} name
 */
function showScreen(name) {
  document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  window.scrollTo(0, 0);
}

/* ─────────────────────────────────────────────────────────────────────────────
   EXPERIMENT FLOW
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Initialises a new session: assigns participant ID, randomly assigns A/B
 * condition, resets state, and renders the first trial.
 */
function startExperiment() {
  participantId = generateParticipantId();
  condition     = Math.random() < 0.5 ? 'A' : 'B';
  currentTrial  = 0;
  eventLog      = [];

  showScreen('experiment');
  renderTrial();
}

/**
 * Renders the current trial: populates all DOM elements with condition-
 * appropriate AI cues and scenario text, then starts the latency timer.
 */
function renderTrial() {
  const c = CONDITIONS[condition];
  const scenario = SCENARIOS[currentTrial];
  const confPct = randomInRange(c.confRange.min, c.confRange.spread);

  // 1. Update UI Labels & Metrics
  setText('topbar-pid', participantId);
  setText('q-current', currentTrial + 1);
  setText('q-total', SCENARIOS.length);
  setText('condition-label', c.label);
  setText('scenario-id-label', scenario.id);

  // 2. Update Progress
  const progressFill = document.getElementById('progress-fill');
  if (progressFill) {
    progressFill.style.width = ((currentTrial / SCENARIOS.length) * 100) + '%';
  }

  // 3. AI Condition Manipulation (Cues)
  const avatar = document.getElementById('ai-avatar');
  if (avatar) {
    avatar.className = 'ai-sigil ' + c.avatarClass;
    avatar.textContent = c.avatarText;
  }

  setText('ai-name', c.name);
  setText('ai-role', c.role);
  setText('ai-message', c.tone(confPct));

  // 4. Confidence Visuals
  const badge = document.getElementById('confidence-badge');
  if (badge) {
    badge.className = 'conf-tag ' + c.badgeClass;
    badge.textContent = c.badge(confPct);
  }

  // 5. Task Content
  setText('scenario-text', scenario.text);

  // 6. State Reset
  const slider = document.getElementById('conf-slider');
  if (slider) {
    slider.value = 5;
    setText('conf-display', '5');
  }

  // 7. Enable Interactions
  document.querySelectorAll('.btn-decision').forEach((btn) => {
    btn.disabled = false;
  });

  // Start latency timer — high-resolution
  trialStartTime = performance.now();
}

/**
 * Records a decision event, advances to the next trial or shows results.
 * Called by the Accept / Reject buttons in index.html.
 *
 * @param {'accept'|'reject'} decision
 */
function recordDecision(decision) {
  // Capture latency immediately on click
  const latency_ms = Math.round(performance.now() - trialStartTime);
  const participant_confidence = parseInt(document.getElementById('conf-slider').value, 10);

  // Disable buttons to prevent double-submission
  document.querySelectorAll('.btn-decision').forEach((btn) => {
    btn.disabled = true;
  });

  // Parse the displayed confidence percentage out of the badge text
  const ai_confidence_shown_pct = parseInt(
    document.getElementById('confidence-badge').textContent.replace(/[^0-9]/g, ''),
    10
  );

  // Append structured event to log
  eventLog.push({
    participant_id:          participantId,
    condition:               condition,
    condition_label:         CONDITIONS[condition].subLabel,
    trial:                   currentTrial + 1,
    scenario_id:             SCENARIOS[currentTrial].id,
    decision,
    ai_confidence_shown_pct,
    participant_confidence,
    latency_ms,
    timestamp:               new Date().toISOString(),
  });

  // Advance
  currentTrial++;
  if (currentTrial < SCENARIOS.length) {
    setTimeout(renderTrial, 280);
  } else {
    setTimeout(showResults, 380);
  }
}

/* ─────────────────────────────────────────────────────────────────────────────
   RESULTS
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Calculates summary statistics, populates the results screen, and renders
 * the raw event log table.
 */
function showResults() {
  const c          = CONDITIONS[condition];
  const accepted   = eventLog.filter((e) => e.decision === 'accept').length;
  const avgLatency = Math.round(
    eventLog.reduce((sum, e) => sum + e.latency_ms, 0) / eventLog.length
  );
  const avgConf = (
    eventLog.reduce((sum, e) => sum + e.participant_confidence, 0) / eventLog.length
  ).toFixed(1);

  // Populate summary stats
  setText('stat-accept',        accepted);
  setText('stat-latency',       avgLatency.toLocaleString());
  setText('stat-condition',     condition);
  setText('stat-condition-sub', c.subLabel);
  setText('stat-confidence',    avgConf);
  setText('results-pid',        participantId);
  setText('results-sub',
    `${participantId}  ·  ${c.label}  ·  ${c.subLabel}\n${new Date().toISOString()}`
  );

  // Build event log table
  const tbody = document.getElementById('log-tbody');
  tbody.innerHTML = '';

  eventLog.forEach((entry) => {
    const condClass = condition === 'A' ? 'ca' : 'cb';
    const decClass  = entry.decision === 'accept' ? 'cok' : 'cno';
    const ts        = entry.timestamp.replace('T', ' ').split('.')[0];

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.trial}</td>
      <td class="${condClass}">${entry.condition}</td>
      <td class="${decClass}">${entry.decision.toUpperCase()}</td>
      <td>${entry.latency_ms.toLocaleString()}</td>
      <td>${entry.participant_confidence}/10</td>
      <td class="ts">${ts}</td>
    `;
    tbody.appendChild(row);
  });

  showScreen('results');
}

/* ─────────────────────────────────────────────────────────────────────────────
   EXPORT
   ───────────────────────────────────────────────────────────────────────────── */

/**
 * Triggers a browser download of the event log as a formatted JSON file.
 */
function downloadJSON() {
  const blob = new Blob(
    [JSON.stringify(eventLog, null, 2)],
    { type: 'application/json' }
  );
  triggerDownload(blob, `trust_study_${participantId}.json`);
}

/**
 * Triggers a browser download of the event log as a CSV file.
 * All values are JSON-stringified to handle commas and quotes safely.
 */
function downloadCSV() {
  const keys = Object.keys(eventLog[0]);
  const rows = [
    keys.join(','),
    ...eventLog.map((entry) =>
      keys.map((key) => JSON.stringify(entry[key])).join(',')
    ),
  ];
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
  triggerDownload(blob, `trust_study_${participantId}.csv`);
}

/**
 * Creates a temporary anchor element to trigger a file download.
 * @param {Blob} blob
 * @param {string} filename
 */
function triggerDownload(blob, filename) {
  const anchor = document.createElement('a');
  anchor.href  = URL.createObjectURL(blob);
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

/**
 * Resets the session and returns to the welcome screen.
 * Called by the "New Participant Session" button.
 */
function resetExperiment() {
  showScreen('welcome');
}