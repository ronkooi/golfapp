/**
 * Golfclub Zeegersloot - Griendbaan Scorekaart App
 * Hoofdapplicatie Logica
 */

(function () {
  'use strict';

  // ================= State =================
  let state = {
    currentView: 'setup', // 'setup' | 'play' | 'summary' | 'history'
    currentHole: 1,
    isCoverScreenMode: false,
    partner: {
      name: "Speelpartner",
      whsHandicap: 28.0,
      defaultTee: "geel"
    },
    user: {
      name: "Mijn Score",
      whsHandicap: 24.0,
      defaultTee: "geel"
    },
    golfdashboardUrl: "https://zeegersloot.golfdashboard.com",
    scores: {}, // { 1: { partnerStrokes: 4, partnerTee: 'geel', userStrokes: 4, userTee: 'geel' }, ... }
    activeRoundId: null,
    roundStartDate: null,
    gpsDistanceData: null
  };

  // ================= DOM Elements =================
  const views = {
    setup: document.getElementById('viewSetup'),
    play: document.getElementById('viewPlay'),
    summary: document.getElementById('viewSummary'),
    history: document.getElementById('viewHistory')
  };

  const tabs = {
    scorecard: document.getElementById('tabScorecard'),
    summary: document.getElementById('tabSummary'),
    history: document.getElementById('tabHistory'),
    golfdashboard: document.getElementById('tabGolfdashboard')
  };

  // ================= PWA Registration =================
  if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        console.log('SW registration error:', err);
      });
    });
  }

  // ================= Initialization =================
  function init() {
    loadPreferences();
    renderSetupTeePills();
    updateSetupPhcpDisplays();
    setupEventListeners();
    initGPS();

    // Check for active round
    const activeRound = StorageManager.getActiveRound();
    if (activeRound) {
      document.getElementById('resumeRoundBanner').style.display = 'block';
    }

    // Auto-detect square / compact cover screen on Flip 6
    checkCoverScreenAuto();
    window.addEventListener('resize', checkCoverScreenAuto);
  }

  function loadPreferences() {
    const prefs = StorageManager.getPreferences();
    if (prefs.partner) state.partner = Object.assign({}, state.partner, prefs.partner);
    if (prefs.user) state.user = Object.assign({}, state.user, prefs.user);
    if (prefs.coverScreenMode !== undefined) state.isCoverScreenMode = prefs.coverScreenMode;
    if (prefs.golfdashboardUrl) state.golfdashboardUrl = prefs.golfdashboardUrl;

    // Vul setup velden in
    document.getElementById('inputPartnerName').value = state.partner.name;
    document.getElementById('inputPartnerHcp').value = state.partner.whsHandicap;
    document.getElementById('inputUserName').value = state.user.name;
    document.getElementById('inputUserHcp').value = state.user.whsHandicap;

    const displayUrlEl = document.getElementById('displayDashboardUrl');
    if (displayUrlEl) {
      displayUrlEl.textContent = state.golfdashboardUrl.replace(/^https?:\/\//, '');
    }

    applyCoverScreenMode(state.isCoverScreenMode);
  }

  function checkCoverScreenAuto() {
    // Samsung Flip 6 cover screen is ca. 720x748 (hoogte <= 760 en breedte <= 740 of aspect ratio ca. 1:1)
    const w = window.innerWidth;
    const h = window.innerHeight;
    const isSquareish = (w <= 740 && h <= 760 && Math.abs(w - h) < 150);
    if (isSquareish && !state.isCoverScreenMode) {
      applyCoverScreenMode(true);
    }
  }

  function applyCoverScreenMode(isCover) {
    state.isCoverScreenMode = isCover;
    const body = document.body;
    const btn = document.getElementById('btnCoverModeToggle');
    const label = document.getElementById('coverModeLabel');

    if (isCover) {
      body.classList.add('cover-screen-mode');
      btn.classList.add('active');
      label.textContent = "Coverscherm Aan";
    } else {
      body.classList.remove('cover-screen-mode');
      btn.classList.remove('active');
      label.textContent = "Coverscherm";
    }
  }

  // ================= Setup View Helpers =================
  function renderSetupTeePills() {
    const partnerContainer = document.getElementById('partnerTeePills');
    const userContainer = document.getElementById('userTeePills');
    partnerContainer.innerHTML = '';
    userContainer.innerHTML = '';

    const teeKeys = ['wit', 'geel', 'blauw', 'rood', 'oranje'];

    teeKeys.forEach((key) => {
      const tee = COURSE_INFO.tees[key];

      // Partner pill
      const pPill = document.createElement('div');
      pPill.className = `tee-pill ${state.partner.defaultTee === key ? 'selected' : ''}`;
      pPill.style.backgroundColor = tee.hex;
      pPill.style.color = tee.textHex;
      pPill.style.borderColor = tee.border ? tee.border.split(' ')[2] : 'transparent';
      pPill.textContent = tee.name.charAt(0);
      pPill.title = tee.label;
      pPill.addEventListener('click', () => {
        state.partner.defaultTee = key;
        renderSetupTeePills();
        updateSetupPhcpDisplays();
      });
      partnerContainer.appendChild(pPill);

      // User pill
      const uPill = document.createElement('div');
      uPill.className = `tee-pill ${state.user.defaultTee === key ? 'selected' : ''}`;
      uPill.style.backgroundColor = tee.hex;
      uPill.style.color = tee.textHex;
      uPill.style.borderColor = tee.border ? tee.border.split(' ')[2] : 'transparent';
      uPill.textContent = tee.name.charAt(0);
      uPill.title = tee.label;
      uPill.addEventListener('click', () => {
        state.user.defaultTee = key;
        renderSetupTeePills();
        updateSetupPhcpDisplays();
      });
      userContainer.appendChild(uPill);
    });
  }

  function updateSetupPhcpDisplays() {
    const pWhs = parseFloat(document.getElementById('inputPartnerHcp').value) || 0;
    const uWhs = parseFloat(document.getElementById('inputUserHcp').value) || 0;
    
    const pPhcp = HandicapCalculator.calculatePlayingHandicap(pWhs, state.partner.defaultTee);
    const uPhcp = HandicapCalculator.calculatePlayingHandicap(uWhs, state.user.defaultTee);

    document.getElementById('partnerPhcpDisplay').textContent = `Baanhandicap: ${pPhcp}`;
    document.getElementById('userPhcpDisplay').textContent = `Baanhandicap: ${uPhcp}`;
  }

  // ================= Navigation & View Switching =================
  function showView(viewName) {
    state.currentView = viewName;
    Object.keys(views).forEach((v) => {
      views[v].style.display = (v === viewName) ? 'block' : 'none';
    });

    // Update bottom tabs
    Object.keys(tabs).forEach((t) => {
      tabs[t].classList.remove('active');
    });

    if (viewName === 'play' || viewName === 'setup') {
      tabs.scorecard.classList.add('active');
    } else if (viewName === 'summary') {
      tabs.summary.classList.add('active');
    } else if (viewName === 'history') {
      tabs.history.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ================= GPS Setup =================
  function initGPS() {
    GPSManager.startTracking();
    GPSManager.subscribe((gpsState) => {
      updateGPSIndicator(gpsState);
      updateDistancesDisplay();
    });
  }

  function updateGPSIndicator(gpsState) {
    const pill = document.getElementById('gpsStatusPill');
    const text = document.getElementById('gpsStatusText');

    if (!pill || !text) return;

    pill.className = 'gps-status-pill ' + gpsState.status;

    if (gpsState.status === 'active' && gpsState.position) {
      text.textContent = `GPS ±${gpsState.position.accuracy}m`;
    } else if (gpsState.status === 'locating') {
      text.textContent = `GPS zoeken...`;
    } else if (gpsState.status === 'denied') {
      text.textContent = `Geen GPS toegang`;
    } else {
      text.textContent = `GPS inactief`;
    }
  }

  // ================= Hole Play Display =================
  function renderHole(holeNum) {
    state.currentHole = holeNum;
    const hole = COURSE_INFO.holes.find(h => h.number === holeNum);
    if (!hole) return;

    // Header card
    document.getElementById('currentHoleTitle').textContent = `Hole ${hole.number}`;
    document.getElementById('currentHolePar').textContent = `Par ${hole.par}`;
    document.getElementById('currentHoleSI').textContent = `SI ${hole.strokeIndex}`;

    // 9-holes progress bar
    renderHoleDotsBar();

    // Ensure scores object for this hole exists
    if (!state.scores[holeNum]) {
      state.scores[holeNum] = {
        partnerStrokes: hole.par, // default naar par
        partnerTee: state.partner.defaultTee || 'geel',
        userStrokes: hole.par, // default naar par
        userTee: state.user.defaultTee || 'geel'
      };
    }

    const currentScore = state.scores[holeNum];

    // ================= Speelpartner (ALTIJD 1E) =================
    document.getElementById('playPartnerName').textContent = state.partner.name || "Speelpartner";
    const partnerPhcp = HandicapCalculator.calculatePlayingHandicap(state.partner.whsHandicap, currentScore.partnerTee);
    const partnerStrokesReceived = HandicapCalculator.getStrokesReceived(hole.strokeIndex, partnerPhcp);
    document.getElementById('partnerStrokesReceivedChip').textContent = 
      partnerStrokesReceived > 0 ? `+${partnerStrokesReceived} slag` : `${partnerStrokesReceived} slag`;

    renderPartnerScoreDisplay(currentScore.partnerStrokes, hole.par, partnerStrokesReceived);
    renderInlineTees('partnerInlineTees', currentScore.partnerTee, (newTee) => {
      currentScore.partnerTee = newTee;
      saveActiveRoundState();
      renderHole(holeNum);
    });

    // ================= Mijn Score (2E) =================
    document.getElementById('playUserName').textContent = state.user.name || "Mijn Score";
    const userPhcp = HandicapCalculator.calculatePlayingHandicap(state.user.whsHandicap, currentScore.userTee);
    const userStrokesReceived = HandicapCalculator.getStrokesReceived(hole.strokeIndex, userPhcp);
    document.getElementById('userStrokesReceivedChip').textContent = 
      userStrokesReceived > 0 ? `+${userStrokesReceived} slag` : `${userStrokesReceived} slag`;

    renderUserScoreDisplay(currentScore.userStrokes, hole.par, userStrokesReceived);
    renderInlineTees('userInlineTees', currentScore.userTee, (newTee) => {
      currentScore.userTee = newTee;
      saveActiveRoundState();
      renderHole(holeNum);
    });

    // Navigatie knoppen
    document.getElementById('btnPrevHole').disabled = (holeNum === 1);
    const btnNext = document.getElementById('btnNextHole');
    if (holeNum === COURSE_INFO.totalHoles) {
      btnNext.textContent = "Afronden & Uitslag 🏆";
      btnNext.className = "btn btn-gold";
    } else {
      btnNext.textContent = `Hole ${holeNum + 1} ▶`;
      btnNext.className = "btn btn-primary";
    }

    // Afstanden bijwerken
    updateDistancesDisplay();
    saveActiveRoundState();
  }

  function renderHoleDotsBar() {
    const bar = document.getElementById('holeDotsBar');
    bar.innerHTML = '';
    for (let i = 1; i <= COURSE_INFO.totalHoles; i++) {
      const dot = document.createElement('div');
      dot.className = 'hole-dot';
      if (i === state.currentHole) {
        dot.classList.add('current');
      } else if (state.scores[i] && state.scores[i].partnerStrokes !== null) {
        dot.classList.add('completed');
      }
      dot.title = `Hole ${i}`;
      dot.addEventListener('click', () => renderHole(i));
      bar.appendChild(dot);
    }
  }

  function renderPartnerScoreDisplay(strokes, par, strokesReceived) {
    const display = document.getElementById('partnerScoreDisplay');
    const status = document.getElementById('partnerScoreStatus');

    if (strokes === 0 || strokes === '0') {
      display.textContent = '—';
      status.textContent = 'Streep (0 ptn)';
      return;
    }

    display.textContent = strokes;
    const badge = HandicapCalculator.getScoreBadge(strokes, par, strokesReceived, false);
    const stbf = HandicapCalculator.calculateStableford(strokes, par, strokesReceived);
    status.textContent = `${badge.label} • ${stbf} Ptn`;
  }

  function renderUserScoreDisplay(strokes, par, strokesReceived) {
    const display = document.getElementById('userScoreDisplay');
    const status = document.getElementById('userScoreStatus');

    if (strokes === 0 || strokes === '0') {
      display.textContent = '—';
      status.textContent = 'Streep (0 ptn)';
      return;
    }

    display.textContent = strokes;
    const badge = HandicapCalculator.getScoreBadge(strokes, par, strokesReceived, false);
    const stbf = HandicapCalculator.calculateStableford(strokes, par, strokesReceived);
    status.textContent = `${badge.label} • ${stbf} Ptn`;
  }

  function renderInlineTees(containerId, activeTee, onSelect) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    const teeKeys = ['wit', 'geel', 'blauw', 'rood', 'oranje'];

    teeKeys.forEach((key) => {
      const tee = COURSE_INFO.tees[key];
      const pill = document.createElement('div');
      pill.className = `mini-tee-pill ${activeTee === key ? 'active' : ''}`;
      pill.style.backgroundColor = tee.hex;
      pill.style.color = tee.textHex;
      pill.style.borderColor = tee.border ? tee.border.split(' ')[2] : 'transparent';
      pill.textContent = tee.name.charAt(0);
      pill.title = `${tee.label}`;
      pill.addEventListener('click', () => onSelect(key));
      container.appendChild(pill);
    });
  }

  // ================= Afstandsberekening Weergave (Key Requirement) =================
  function updateDistancesDisplay() {
    if (state.currentView !== 'play') return;

    const holeNum = state.currentHole;
    const currentHole = COURSE_INFO.holes.find(h => h.number === holeNum);
    const dists = GPSManager.getHoleDistances(holeNum);

    // Current hole length and green distance
    const currentScore = state.scores[holeNum] || {};
    const currentTee = currentScore.userTee || state.user.defaultTee || 'geel';
    const cardMeters = currentHole.distances[currentTee] || currentHole.distances.geel;

    document.getElementById('currentHoleNumShort').textContent = holeNum;
    document.getElementById('currentHoleLengthVal').textContent = `${cardMeters}m (${currentTee})`;

    const distToCurrentGreenEl = document.getElementById('distToCurrentGreen');
    if (dists.hasGPS && dists.toCurrentGreen !== null) {
      distToCurrentGreenEl.innerHTML = `${dists.toCurrentGreen} <small>m</small>`;
    } else {
      // Fallback: toon kaartafstand
      distToCurrentGreenEl.innerHTML = `${cardMeters} <small>m</small>`;
    }

    // Next hole distance (Gebruikerswens: "als ik hole 5 invul dan wil ik de afstand tot hole 6 kunnen aflezen")
    const nextHoleDistLabel = document.getElementById('nextHoleDistLabel');
    const distToNextTeeEl = document.getElementById('distToNextTee');
    const nextHoleSubInfo = document.getElementById('nextHoleSubInfo');
    const distToNextGreenEl = document.getElementById('distToNextGreen');

    if (holeNum < COURSE_INFO.totalHoles) {
      const nextNum = holeNum + 1;
      const nextHole = COURSE_INFO.holes.find(h => h.number === nextNum);
      const nextTeeKey = state.user.defaultTee || 'geel';
      const nextHoleLength = nextHole.distances[nextTeeKey] || nextHole.distances.geel;

      nextHoleDistLabel.textContent = `👉 Naar Hole ${nextNum}`;

      if (dists.hasGPS && dists.toNextTee !== null) {
        distToNextTeeEl.innerHTML = `${dists.toNextTee} <small>m</small>`;
        const greenText = dists.toNextGreen !== null ? `${dists.toNextGreen}m` : `${nextHoleLength}m`;
        distToNextGreenEl.textContent = greenText;
        nextHoleSubInfo.innerHTML = `Tee afslag • Green: <span id="distToNextGreen">${greenText}</span>`;
      } else {
        // Zonder GPS: toon de lengte van de volgende hole volgens de kaart
        distToNextTeeEl.innerHTML = `${nextHoleLength} <small>m</small>`;
        nextHoleSubInfo.textContent = `Hole ${nextNum} • Par ${nextHole.par} • ${nextTeeKey}`;
      }
    } else {
      // Hole 9: Laatste hole van de ronde
      nextHoleDistLabel.textContent = `🏁 Terug naar Clubhuis`;
      distToNextTeeEl.innerHTML = `Einde <small>ronde</small>`;
      nextHoleSubInfo.textContent = `Griendbaan Par 36 afgerond`;
    }
  }

  // ================= Active Round Persistence =================
  function saveActiveRoundState() {
    const roundData = {
      id: state.activeRoundId || 'rnd_' + Date.now(),
      startDate: state.roundStartDate || new Date().toISOString(),
      currentHole: state.currentHole,
      partner: state.partner,
      user: state.user,
      scores: state.scores
    };
    state.activeRoundId = roundData.id;
    state.roundStartDate = roundData.startDate;
    StorageManager.saveActiveRound(roundData);
  }

  // ================= Summary View (Eindoverzicht) =================
  function renderSummary() {
    const partnerSummary = HandicapCalculator.calculateSummary(state.partner, state.scores);
    const userSummary = HandicapCalculator.calculateSummary(state.user, state.scores);

    // Bepaal de winnaar op basis van Stableford punten (of Netto als gelijk)
    let winnerText = "Gelijkspel!";
    let winnerSub = `Beiden hebben ${userSummary.stablefordTotal} Stableford punten`;
    let trophy = "🤝";

    if (partnerSummary.stablefordTotal > userSummary.stablefordTotal) {
      winnerText = `🏆 ${state.partner.name} wint!`;
      winnerSub = `${partnerSummary.stablefordTotal} vs ${userSummary.stablefordTotal} Stableford punten`;
      trophy = "🏆";
    } else if (userSummary.stablefordTotal > partnerSummary.stablefordTotal) {
      winnerText = `🏆 ${state.user.name} wint!`;
      winnerSub = `${userSummary.stablefordTotal} vs ${partnerSummary.stablefordTotal} Stableford punten`;
      trophy = "🏆";
    }

    document.getElementById('summaryTrophy').textContent = trophy;
    document.getElementById('summaryWinnerText').textContent = winnerText;
    document.getElementById('summaryWinnerSub').textContent = winnerSub;

    // Speelpartner stats
    document.getElementById('sumPartnerName').textContent = state.partner.name;
    document.getElementById('sumPartnerGross').textContent = partnerSummary.grossTotal;
    document.getElementById('sumPartnerNet').textContent = partnerSummary.netTotal;
    document.getElementById('sumPartnerStbf').textContent = `${partnerSummary.stablefordTotal} ptn`;
    document.getElementById('sumPartnerStbf18').textContent = `${partnerSummary.stableford18Equiv} ptn`;

    // Gebruiker stats
    document.getElementById('sumUserName').textContent = state.user.name;
    document.getElementById('sumUserGross').textContent = userSummary.grossTotal;
    document.getElementById('sumUserNet').textContent = userSummary.netTotal;
    document.getElementById('sumUserStbf').textContent = `${userSummary.stablefordTotal} ptn`;
    document.getElementById('sumUserStbf18').textContent = `${userSummary.stableford18Equiv} ptn`;

    // Tabelkoppen namen
    document.getElementById('thPartnerName').textContent = state.partner.name.substring(0, 10);
    document.getElementById('thUserName').textContent = state.user.name.substring(0, 10);

    // Scorekaart tabel rijen
    const tbody = document.getElementById('scorecardTableBody');
    tbody.innerHTML = '';

    for (let i = 0; i < 9; i++) {
      const pRow = partnerSummary.holeBreakdown[i];
      const uRow = userSummary.holeBreakdown[i];
      const hole = COURSE_INFO.holes[i];

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 700;">${hole.number}</td>
        <td>${hole.par}</td>
        <td>${hole.strokeIndex}</td>
        <td><span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color:${COURSE_INFO.tees[uRow.teeKey].hex};"></span></td>
        <td><span class="score-badge ${pRow.badge.class}">${pRow.strokes || '—'}</span></td>
        <td><span class="score-badge ${uRow.badge.class}">${uRow.strokes || '—'}</span></td>
        <td style="font-weight:600;">${pRow.stableford} / ${uRow.stableford}</td>
      `;
      tbody.appendChild(tr);
    }

    // Totalen rij
    const totalTr = document.createElement('tr');
    totalTr.innerHTML = `
      <td>TOT</td>
      <td>${COURSE_INFO.par}</td>
      <td>—</td>
      <td>—</td>
      <td>${partnerSummary.grossTotal} (${partnerSummary.netTotal})</td>
      <td>${userSummary.grossTotal} (${userSummary.netTotal})</td>
      <td style="color:var(--accent-gold);">${partnerSummary.stablefordTotal} / ${userSummary.stablefordTotal}</td>
    `;
    tbody.appendChild(totalTr);

    // Automatisch opslaan in Historie
    StorageManager.saveCompletedRound({
      id: state.activeRoundId,
      partner: state.partner,
      user: state.user,
      scores: state.scores,
      partnerSummary,
      userSummary
    });
  }

  // ================= Speech (Voice Reading) =================
  function speakSummary() {
    if (!('speechSynthesis' in window)) {
      alert("Spraakuitvoer wordt helaas niet ondersteund door deze browser.");
      return;
    }

    const partnerSummary = HandicapCalculator.calculateSummary(state.partner, state.scores);
    const userSummary = HandicapCalculator.calculateSummary(state.user, state.scores);

    let winnerSentence = "";
    if (partnerSummary.stablefordTotal > userSummary.stablefordTotal) {
      winnerSentence = `${state.partner.name} heeft gewonnen met ${partnerSummary.stablefordTotal} stableford punten.`;
    } else if (userSummary.stablefordTotal > partnerSummary.stablefordTotal) {
      winnerSentence = `${state.user.name} heeft gewonnen met ${userSummary.stablefordTotal} stableford punten.`;
    } else {
      winnerSentence = `Het is een gelijkspel met ieder ${userSummary.stablefordTotal} stableford punten.`;
    }

    const textToSpeak = `
      Ronde op Golfclub Zeegersloot Griendbaan voltooid!
      ${winnerSentence}
      ${state.partner.name} had ${partnerSummary.grossTotal} slagen en ${partnerSummary.netTotal} netto.
      ${state.user.name} had ${userSummary.grossTotal} slagen en ${userSummary.netTotal} netto.
      Gefeliciteerd met jullie ronde!
    `;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'nl-NL';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  // ================= Share Round =================
  function shareRound() {
    const partnerSummary = HandicapCalculator.calculateSummary(state.partner, state.scores);
    const userSummary = HandicapCalculator.calculateSummary(state.user, state.scores);

    const text = `⛳ *Golfclub Zeegersloot - Griendbaan (9 Holes)*\n` +
      `📅 ${new Date().toLocaleDateString('nl-NL')}\n\n` +
      `👤 *${state.partner.name}*: ${partnerSummary.grossTotal} slagen (Netto ${partnerSummary.netTotal}) • *${partnerSummary.stablefordTotal} Stableford ptn*\n` +
      `👤 *${state.user.name}*: ${userSummary.grossTotal} slagen (Netto ${userSummary.netTotal}) • *${userSummary.stablefordTotal} Stableford ptn*\n\n` +
      `🏆 Uitslag: ${partnerSummary.stablefordTotal > userSummary.stablefordTotal ? state.partner.name + ' wint!' : userSummary.stablefordTotal > partnerSummary.stablefordTotal ? state.user.name + ' wint!' : 'Gelijkspel!'}`;

    if (navigator.share) {
      navigator.share({
        title: 'Scorekaart Zeegersloot Griendbaan',
        text: text
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        alert("Scorekaart samenvatting gekopieerd naar klembord! Je kunt deze nu plakken in WhatsApp.");
      }).catch(() => {
        alert(text);
      });
    }
  }

  // ================= History View =================
  function renderHistory() {
    const listContainer = document.getElementById('historyListContainer');
    listContainer.innerHTML = '';
    const history = StorageManager.getHistory();

    if (!history || history.length === 0) {
      listContainer.innerHTML = `
        <div class="card" style="text-align: center; color: var(--text-muted); padding: 30px 16px;">
          <p style="font-size: 28px; margin-bottom: 8px;">📜</p>
          <p>Nog geen gespeelde rondes opgeslagen.</p>
          <p style="font-size: 12px; margin-top: 4px;">Zodra je 9 holes uitspeelt, verschijnt je scorekaart hier.</p>
        </div>
      `;
      return;
    }

    history.forEach((round) => {
      const item = document.createElement('div');
      item.className = 'history-item';
      
      const pName = round.partner?.name || "Partner";
      const uName = round.user?.name || "Ik";
      const pStbf = round.partnerSummary?.stablefordTotal ?? "-";
      const uStbf = round.userSummary?.stablefordTotal ?? "-";

      item.innerHTML = `
        <div class="history-date">${round.formattedDate || round.date} • Griendbaan 9H</div>
        <div class="history-matchup">
          <div>
            <div class="history-player" style="color: var(--partner-color);">${pName} (${round.partnerSummary?.grossTotal || '-'})</div>
            <div class="history-player" style="color: var(--user-color);">${uName} (${round.userSummary?.grossTotal || '-'})</div>
          </div>
          <div style="text-align: right;">
            <div class="history-points">${pStbf} vs ${uStbf} <span style="font-size: 11px; font-weight: 500;">stbf</span></div>
          </div>
        </div>
      `;

      item.addEventListener('click', () => {
        // Heropen deze ronde in het uitslagenscherm
        state.partner = round.partner;
        state.user = round.user;
        state.scores = round.scores;
        renderSummary();
        showView('summary');
      });

      listContainer.appendChild(item);
    });
  }

  // ================= Event Listeners =================
  function setupEventListeners() {
    // Mode toggle button
    document.getElementById('btnCoverModeToggle').addEventListener('click', () => {
      applyCoverScreenMode(!state.isCoverScreenMode);
      StorageManager.savePreferences({
        partner: state.partner,
        user: state.user,
        coverScreenMode: state.isCoverScreenMode
      });
    });

    // GPS refresh button
    document.getElementById('btnGpsToggle').addEventListener('click', () => {
      GPSManager.startTracking();
      updateDistancesDisplay();
    });

    function startNewRound() {
      state.partner.name = document.getElementById('inputPartnerName').value.trim() || "Speelpartner";
      state.partner.whsHandicap = parseFloat(document.getElementById('inputPartnerHcp').value) || 28.0;

      state.user.name = document.getElementById('inputUserName').value.trim() || "Mijn Score";
      state.user.whsHandicap = parseFloat(document.getElementById('inputUserHcp').value) || 24.0;

      // Voorkeuren opslaan
      StorageManager.savePreferences({
        partner: state.partner,
        user: state.user,
        coverScreenMode: state.isCoverScreenMode,
        golfdashboardUrl: state.golfdashboardUrl
      });

      state.activeRoundId = 'rnd_' + Date.now();
      state.roundStartDate = new Date().toISOString();
      state.scores = {};
      renderHole(1);
      showView('play');
    }

    // Golfdashboard inchecken knop in banner
    const btnOpenCheckin = document.getElementById('btnOpenGolfdashboard');
    const btnBannerStart = document.getElementById('btnBannerStartRound');

    if (btnOpenCheckin) {
      btnOpenCheckin.href = state.golfdashboardUrl;
    }

    if (btnBannerStart) {
      btnBannerStart.addEventListener('click', () => {
        startNewRound();
      });
    }

    if (tabs.golfdashboard) {
      tabs.golfdashboard.href = state.golfdashboardUrl;
    }

    // URL aanpassen link
    document.getElementById('btnEditDashboardUrl')?.addEventListener('click', (e) => {
      e.preventDefault();
      const newUrl = prompt("Voer de inlog/incheck URL van Zeegersloot Golfdashboard in:", state.golfdashboardUrl);
      if (newUrl && newUrl.trim()) {
        let cleanUrl = newUrl.trim();
        if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
          cleanUrl = 'https://' + cleanUrl;
        }
        state.golfdashboardUrl = cleanUrl;
        document.getElementById('displayDashboardUrl').textContent = cleanUrl.replace(/^https?:\/\//, '');
        if (btnOpenCheckin) btnOpenCheckin.href = cleanUrl;
        if (tabs.golfdashboard) tabs.golfdashboard.href = cleanUrl;
        StorageManager.savePreferences({
          partner: state.partner,
          user: state.user,
          coverScreenMode: state.isCoverScreenMode,
          golfdashboardUrl: cleanUrl
        });
      }
    });

    // WHS Handicap input updates
    document.getElementById('inputPartnerHcp').addEventListener('input', updateSetupPhcpDisplays);
    document.getElementById('inputUserHcp').addEventListener('input', updateSetupPhcpDisplays);

    // Start Round knop
    document.getElementById('btnStartRound').addEventListener('click', startNewRound);

    // Hervat ronde
    document.getElementById('btnResumeRound')?.addEventListener('click', () => {
      const activeRound = StorageManager.getActiveRound();
      if (activeRound) {
        state.activeRoundId = activeRound.id;
        state.roundStartDate = activeRound.startDate;
        state.partner = activeRound.partner;
        state.user = activeRound.user;
        state.scores = activeRound.scores;
        renderHole(activeRound.currentHole || 1);
        showView('play');
      }
    });

    // Wis ronde
    document.getElementById('btnDiscardRound')?.addEventListener('click', () => {
      if (confirm("Weet je zeker dat je de lopende ronde wilt wissen?")) {
        StorageManager.clearActiveRound();
        document.getElementById('resumeRoundBanner').style.display = 'none';
      }
    });

    // ================= Steppers voor Hole Play =================
    // Speelpartner Minus / Plus / Pickup (1e)
    document.getElementById('btnPartnerMinus').addEventListener('click', () => {
      const currentScore = state.scores[state.currentHole];
      const hole = COURSE_INFO.holes.find(h => h.number === state.currentHole);
      const cur = currentScore.partnerStrokes !== null ? parseInt(currentScore.partnerStrokes, 10) : hole.par;
      if (cur > 1) {
        currentScore.partnerStrokes = cur - 1;
      }
      renderHole(state.currentHole);
    });

    document.getElementById('btnPartnerPlus').addEventListener('click', () => {
      const currentScore = state.scores[state.currentHole];
      const hole = COURSE_INFO.holes.find(h => h.number === state.currentHole);
      const cur = currentScore.partnerStrokes !== null ? parseInt(currentScore.partnerStrokes, 10) : hole.par;
      currentScore.partnerStrokes = cur + 1;
      renderHole(state.currentHole);
    });

    document.getElementById('btnPartnerPickup').addEventListener('click', () => {
      const currentScore = state.scores[state.currentHole];
      currentScore.partnerStrokes = 0; // Streep
      renderHole(state.currentHole);
    });

    // Mijn Score Minus / Plus / Pickup (2e)
    document.getElementById('btnUserMinus').addEventListener('click', () => {
      const currentScore = state.scores[state.currentHole];
      const hole = COURSE_INFO.holes.find(h => h.number === state.currentHole);
      const cur = currentScore.userStrokes !== null ? parseInt(currentScore.userStrokes, 10) : hole.par;
      if (cur > 1) {
        currentScore.userStrokes = cur - 1;
      }
      renderHole(state.currentHole);
    });

    document.getElementById('btnUserPlus').addEventListener('click', () => {
      const currentScore = state.scores[state.currentHole];
      const hole = COURSE_INFO.holes.find(h => h.number === state.currentHole);
      const cur = currentScore.userStrokes !== null ? parseInt(currentScore.userStrokes, 10) : hole.par;
      currentScore.userStrokes = cur + 1;
      renderHole(state.currentHole);
    });

    document.getElementById('btnUserPickup').addEventListener('click', () => {
      const currentScore = state.scores[state.currentHole];
      currentScore.userStrokes = 0; // Streep
      renderHole(state.currentHole);
    });

    // Vorige / Volgende Hole knoppen
    document.getElementById('btnPrevHole').addEventListener('click', () => {
      if (state.currentHole > 1) {
        renderHole(state.currentHole - 1);
      }
    });

    document.getElementById('btnNextHole').addEventListener('click', () => {
      if (state.currentHole < COURSE_INFO.totalHoles) {
        renderHole(state.currentHole + 1);
      } else {
        // Laatste hole voltooid -> Toon samenvatting
        renderSummary();
        showView('summary');
      }
    });

    // Summary actieknoppen
    document.getElementById('btnSpeakSummary').addEventListener('click', speakSummary);
    document.getElementById('btnShareRound').addEventListener('click', shareRound);
    document.getElementById('btnNewRoundFromSummary').addEventListener('click', () => {
      showView('setup');
    });

    // Bottom Tabs
    tabs.scorecard.addEventListener('click', () => {
      if (state.activeRoundId) {
        showView('play');
        renderHole(state.currentHole);
      } else {
        showView('setup');
      }
    });

    tabs.summary.addEventListener('click', () => {
      renderSummary();
      showView('summary');
    });

    tabs.history.addEventListener('click', () => {
      renderHistory();
      showView('history');
    });
  }

  // Start app
  init();

})();
