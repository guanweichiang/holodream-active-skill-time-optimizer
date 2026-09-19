// 【新增】：專屬角色顏色字典
// 請在雙引號內填入 HEX 色碼 (例如 "#ffb6c1")
// 若保持空白 ""，系統會自動使用原本的預設循環顏色
const characterColors = {
  "Tokino Sora": "#6875ee",
  "Robocosan": "#e86288",
  "AZKi": "#f081a3",
  "Sakura Miko": "#ff909e",
  "Hoshimachi Suisei": "#75c0ff",
  "Aki Rosenthal": "#abe64d",
  "Akai Haato": "#e5395b",
  "Shirakami Fubuki": "#93d5f2",
  "Natsuiro Matsuri": "#ffcb30",
  "Nakiri Ayame": "#dd305b",
  "Yuzuki Choco": "#ff5487",
  "Oozora Subaru": "#e5ce00",
  "Ookami Mio": "#db3131",
  "Nekomata Okayu": "#d866ed",
  "Inugami Korone": "#ffcd28",
  "Usada Pekora": "#57a9ff",
  "Shiranui Flare": "#ffab2d",
  "Shirogane Noel": "#a5b5b7",
  "Houshou Marine": "#c2153b",
  "Tsunomaki Watame": "#e2d065",
  "Tokoyami Towa": "#b77fff",
  "Himemori Luna": "#ff93d0",
  "Yukihana Lamy": "#49aaff",
  "Momosuzu Nene": "#ffc633",
  "Shishiro Botan": "#757575",
  "Omaru Polka": "#ed0043",
  "La+ Darknesss": "#9464d2",
  "Takane Lui": "#831550",
  "Hakui Koyori": "#ff95c8",
  "Kazama Iroha": "#5ecfc8",
  "Ayunda Risu": "#ffaaaa",
  "Moona Hoshinova": "#aa83ff",
  "Airani Iofifteen": "#9cdf36",
  "Kureiji Ollie": "#c40041",
  "Anya Melfissa": "#f3bf41",
  "Pavolia Reine": "#004dc2",
  "Vestia Zeta": "#9290a1",
  "Kaela Kovalskia": "#fc4045",
  "Kobo Kanaeru": "#50cfe1",
  "Mori Calliope": "#e01c61",
  "Takanashi Kiara": "#ff792e",
  "Ninomae Ina'nis": "#5d4e83",
  "IRyS": "#df185d",
  "Ouro Kronii": "#2221aa",
  "Hakos Baelz": "#ee2222",
  "Shiori Novella": "#c288f7",
  "Koseki Bijou": "#8674ff",
  "Nerissa Ravencroft": "#3950ee",
  "Fuwawa Abyssgard": "#80c2f8",
  "Mococo Abyssgard": "#f79bc2",
  "Otonose Kanade": "#ffd380",
  "Ichijou Ririka": "#ff77a9",
  "Juufuutei Raden": "#357b6c",
  "Todoroki Hajime": "#a4aaff"
};

let allCharactersData = [];
const characterLimits = new Map();
const selectedIds = new Set(); 
const bloomIds = new Set(); // 【新增】：勾選為 Bloom 1 的角色 id
const timelineColors = ["#ffb6c1", "#ff7f50", "#87cefa", "#98fb98", "#ffffb3"];

const accordionContainer = document.getElementById('accordionContainer');
const calculateBtn = document.getElementById('calculateBtn');
const resultSection = document.getElementById('resultSection');
const selectedCountDisplay = document.getElementById('selectedCountDisplay');
const clearCharactersBtn = document.getElementById('clearCharactersBtn');

// 【新增】：安全轉數字（空值 / null / 非數字 → null；支援 "105%" 格式）
function parseNum(v) {
  if (v === null || v === undefined) return null;
  const n = parseFloat(String(v).replace('%', '').trim());
  return isNaN(n) ? null : n;
}

// 【新增】：取得角色「目前實際生效」的 Score 與 Duration
// - 未勾選 Bloom 1：使用原本的 score_bonus / AP duration
// - 已勾選 Bloom 1：使用 bloom1_score_bonus / bloom1_AP_duration；
//   若該欄位是空的，就退回使用原本的數值
function getEffectiveStats(char) {
  const bloomOn = bloomIds.has(char.id);
  return {
    bloom: bloomOn,
    score: (bloomOn && char.bloom_score !== null) ? char.bloom_score : char.score_bonus,
    duration: (bloomOn && char.bloom_dur !== null) ? char.bloom_dur : char['AP duration']
  };
}

function buildStatsHtml(char, st) {
  return `⏱️ CD: ${char['AP cooldown']}s | ⏳ Dur: <span class="stat-val">${st.duration}s</span>`;
}

function buildBonusHtml(char, st) {
  return `💥 Score: <span class="stat-val">${st.score}%</span> | Rate: ${char.display_rate}`;
}

// 【新增】：同一角色可能出現在多個團體分頁，所以要同步更新所有卡片
function refreshCardStats(charId) {
  const char = allCharactersData.find(c => c.id === charId);
  if (!char) return;
  const st = getEffectiveStats(char);
  document.querySelectorAll(`.character-card[data-char-id="${charId}"]`).forEach(card => {
    card.classList.toggle('bloom-on', st.bloom);
    card.querySelector('.char-stats').innerHTML = buildStatsHtml(char, st);
    card.querySelector('.char-bonus').innerHTML = buildBonusHtml(char, st);
    const bloomCb = card.querySelector('.bloom-checkbox');
    if (bloomCb) bloomCb.checked = st.bloom;
  });
}

window.addEventListener('DOMContentLoaded', () => {
  fetch('character.csv', { cache: 'no-store' }) // 避免瀏覽器快取到舊版 CSV
   
    .then(response => {
      if (!response.ok) throw new Error("Failed to load character.csv");
      return response.text();
    })
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: h => h.trim(),
        complete: function(results) {
          if (results.meta.fields && !results.meta.fields.includes('bloom1_score_bonus') && !results.meta.fields.includes('bloom1_AP_duration')) {
            console.warn("character.csv 找不到 bloom1_score_bonus / bloom1_AP_duration 欄位，Bloom 1 功能將無資料可用。");
            const warn = document.createElement('div');
            warn.id = 'bloomWarning';
            warn.style.cssText = 'margin-bottom: 15px; padding: 12px 15px; border-left: 4px solid #ff7f50; background: rgba(255,127,80,0.12); border-radius: 4px; font-size: 0.9rem;';
            warn.innerHTML = '⚠️ 目前讀到的 character.csv 沒有 <b>bloom1_score_bonus</b> / <b>bloom1_AP_duration</b> 欄位，所以 Bloom 1 勾選鈕被停用。'
              + '請確認 CSV 已更新並放在與 index.html 相同的資料夾，然後按 Ctrl+F5 強制重新整理。';
            accordionContainer.parentNode.insertBefore(warn, accordionContainer);
          }
          allCharactersData = results.data.filter(char => char.character && char['AP cooldown'] && char.Rarity === 5);
          allCharactersData.forEach(char => {
            const rawRate = char.base_trigger_rate ? String(char.base_trigger_rate).trim() : 'Medium';
            char.display_rate = rawRate.charAt(0).toUpperCase() + rawRate.slice(1);
            
            const rateStr = rawRate.toLowerCase();
            if (rateStr === 'high') char.parsed_rate = 0.55;
            else if (rateStr === 'medium' || rateStr === 'mid') char.parsed_rate = 0.45;
            else if (rateStr === 'low') char.parsed_rate = 0.35;
            else char.parsed_rate = 0.45; 
            
            let rawScore = char.score_bonus;
            let parsedScore = parseFloat(String(rawScore).replace('%', '').trim());
            char.score_bonus = isNaN(parsedScore) ? 100 : parsedScore;

            // 【新增】：Bloom 1 資料（空值 = null，計算時會退回原本的數值）
            char.bloom_score = parseNum(char.bloom1_score_bonus);
            char.bloom_dur = parseNum(char.bloom1_AP_duration);
            char.has_bloom_data = char.bloom_score !== null || char.bloom_dur !== null;
          });
          if (accordionContainer) renderAccordionList(allCharactersData);
        }
      });
    })
    .catch(error => console.error(error));
});

clearCharactersBtn.addEventListener('click', () => {
  selectedIds.clear();
  // 只取消「選取角色」的勾選（卡片直接子層的 checkbox），不影響 Bloom 1 勾選狀態
  document.querySelectorAll('.character-card > input[type="checkbox"]').forEach(cb => cb.checked = false);
  selectedCountDisplay.innerText = '0';
});

function renderAccordionList(characters) {
  accordionContainer.innerHTML = '';
  const grouped = {};
  characters.forEach(char => {
    const groups = char.group ? String(char.group).split(',').map(g => g.trim()) : ['Other'];
    groups.forEach(g => {
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(char);
    });
  });

  const groupOrder = [
    "Gen 0", "Gen 1", "Gen 2", "Gamers", "Gen 3", "Gen 4", "Gen 5", "HoloX",
    "ID Gen 1", "ID Gen 2", "ID Gen 3", "Myth", "Promise", "Advent", "ReGLOSS"
  ];

  const sortedGroups = Object.keys(grouped).sort((a, b) => {
    let iA = groupOrder.findIndex(g => a.trim().toLowerCase() === g.toLowerCase());
    let iB = groupOrder.findIndex(g => b.trim().toLowerCase() === g.toLowerCase());
    if (iA === -1) iA = 999;
    if (iB === -1) iB = 999;
    return iA - iB;
  });

  const charRankList = Object.keys(characterColors).map(name => String(name).toLowerCase().replace(/[^a-z0-9+]/g, ''));

  function getCharRank(name) {
    const key = String(name).toLowerCase().replace(/[^a-z0-9+]/g, '');
    let idx = charRankList.indexOf(key);
    if (idx !== -1) return idx;
    idx = charRankList.findIndex(k => key.includes(k));
    return idx !== -1 ? idx : 999;
  }

  sortedGroups.forEach(groupName => {
    grouped[groupName].sort((a, b) => {
      let rankA = getCharRank(a.character);
      let rankB = getCharRank(b.character);
      if (rankA === rankB) return a.character.localeCompare(b.character);
      return rankA - rankB;
    });

    const header = document.createElement('div');
    header.className = 'accordion-header';
    header.innerHTML = `<span>${groupName}</span> <span>🔽</span>`;
    
    const content = document.createElement('div');
    content.className = 'accordion-content';

    header.addEventListener('click', () => {
      content.classList.toggle('active');
      header.querySelector('span:last-child').innerText = content.classList.contains('active') ? '🔼' : '🔽';
    });

    grouped[groupName].forEach(char => {
      const card = document.createElement('div');
      card.className = 'character-card';
      card.dataset.charId = char.id;
      const stats = getEffectiveStats(char);
      if (stats.bloom) card.classList.add('bloom-on');
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = char.id; 
      checkbox.checked = selectedIds.has(char.id); 

      checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (selectedIds.size >= 5) {
            alert("Maximum 5 team members allowed!");
            e.target.checked = false;
            return;
          }
          selectedIds.add(char.id);
        } else {
          selectedIds.delete(char.id);
        }
        selectedCountDisplay.innerText = selectedIds.size;
        document.querySelectorAll(`.character-card input[type="checkbox"][value="${char.id}"]`).forEach(cb => {
            cb.checked = e.target.checked;
        });
      });

      const currentLimit = characterLimits.has(char.id) ? characterLimits.get(char.id) : 3;

      const infoDiv = document.createElement('div');
      infoDiv.className = 'char-info';
      
      infoDiv.innerHTML = `
        <span class="char-name">${char.character}</span>
        <span class="char-outfit">${char.outfit}</span>
        <span class="char-stats">${buildStatsHtml(char, stats)}</span>
        <span class="char-bonus">${buildBonusHtml(char, stats)}</span>

        <div style="margin-top: 8px;" class="no-trigger">
          <label class="bloom-toggle no-trigger" title="${char.has_bloom_data ? 'Use Bloom 1 stats' : 'No Bloom 1 data for this character'}">
            <input type="checkbox" class="bloom-checkbox no-trigger" ${stats.bloom ? 'checked' : ''} ${char.has_bloom_data ? '' : 'disabled'}>
            <span class="no-trigger">🌸 Bloom 1</span>
          </label>
        </div>
        
        <div style="margin-top: 8px; font-size: 0.8rem; color: #bbb;" class="no-trigger">
          Max CD Points: 
          <select class="char-limit-select no-trigger" style="background: var(--track-bg); color: #fff; border: 1px solid #555; border-radius: 4px; padding: 2px;">
            <option value="3" ${currentLimit === 3 ? 'selected' : ''}>3 (12%)</option>
            <option value="2" ${currentLimit === 2 ? 'selected' : ''}>2 (8%)</option>
            <option value="1" ${currentLimit === 1 ? 'selected' : ''}>1 (4%)</option>
            <option value="0" ${currentLimit === 0 ? 'selected' : ''}>0 (Locked)</option>
          </select>
        </div>
      `;
      
      card.appendChild(checkbox);
      card.appendChild(infoDiv);

      card.addEventListener('click', (e) => {
        if (e.target.closest('.no-trigger') || e.target.tagName === 'OPTION') return;
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change')); 
      });

      // 【新增】：Bloom 1 勾選 / 取消
      card.querySelector('.bloom-checkbox').addEventListener('change', (e) => {
        if (e.target.checked) bloomIds.add(char.id);
        else bloomIds.delete(char.id);
        refreshCardStats(char.id);
      });

      card.querySelector('.char-limit-select').addEventListener('change', (e) => {
        characterLimits.set(char.id, Number(e.target.value));
        document.querySelectorAll(`.character-card input[type="checkbox"][value="${char.id}"]`).forEach(cb => {
            const relatedSelect = cb.parentElement.querySelector('.char-limit-select');
            if(relatedSelect) relatedSelect.value = e.target.value;
        });
      });

      content.appendChild(card);
    });
    accordionContainer.appendChild(header);
    accordionContainer.appendChild(content);
  });
}

// --- 3. Core Math (Expected Value & Sweep-line) ---
function getTalentDistributions(maxGlobalPoints, team) {
  const distributions = [];
  function backtrack(idx, currentDist, currentSum) {
    if (idx === team.length) {
      distributions.push([...currentDist]);
      return;
    }
    const charId = team[idx].id;
    let localLimit = characterLimits.has(charId) ? characterLimits.get(charId) : 3;
    
    for (let pts = 0; pts <= localLimit; pts++) {
      if (currentSum + pts <= maxGlobalPoints) {
        currentDist.push(pts);
        backtrack(idx + 1, currentDist, currentSum + pts);
        currentDist.pop();
      }
    }
  }
  backtrack(0, [], 0);
  return distributions;
}

function getCharacterIntervals(cooldown, duration, investedPoints, songDuration) {
  const actualCooldown = cooldown * (1 - (investedPoints * 0.04));
  const intervals = [];
  let triggerTime = actualCooldown;
  while (triggerTime < songDuration) {
    intervals.push([triggerTime, Math.min(triggerTime + duration, songDuration)]);
    triggerTime += actualCooldown;
  }
  return intervals;
}

// 【升級】：加入 assumePerfect 參數來計算理論最高分 (Ceiling)
function calculateExpectedScore(teamData, songDuration, triggerRateBuffs = {}, assumePerfect = false) {
  const events = [];
  teamData.forEach(char => {
    char.intervals.forEach(interval => {
      events.push({ time: interval[0], type: 'start', char: char });
      events.push({ time: interval[1], type: 'end', char: char });
    });
  });

  events.sort((a, b) => a.time !== b.time ? a.time - b.time : (a.type === 'end' ? -1 : 1));

  let totalExpectedScore = 0;
  const activeChars = new Set();
  let prevTime = 0;

  events.forEach(event => {
    const timeElapsed = event.time - prevTime;
    if (activeChars.size > 0 && timeElapsed > 0) {
      const sortedActive = Array.from(activeChars).sort((a, b) => b.score_bonus - a.score_bonus);
      let expectedRateForSegment = 0;
      let currentFailProb = 1.0;
      
      for (const char of sortedActive) {
        // 如果開啟理論上限模式，強制 100% 發動機率
        let finalProb = assumePerfect ? 1.0 : (char.parsed_rate + (triggerRateBuffs[char.id] || 0));
        finalProb = Math.min(1.0, finalProb); 
        expectedRateForSegment += currentFailProb * finalProb * char.score_bonus;
        currentFailProb *= (1 - finalProb);
      }
      totalExpectedScore += expectedRateForSegment * timeElapsed;
    }
    if (event.type === 'start') activeChars.add(event.char);
    else activeChars.delete(event.char);
    prevTime = event.time;
  });
  return totalExpectedScore;
}

function getCoverageSegments(teamData) {
  const events = [];
  teamData.forEach(char => {
    char.intervals.forEach(interval => {
      events.push({ time: interval[0], type: 'start', char: char });
      events.push({ time: interval[1], type: 'end', char: char });
    });
  });
  events.sort((a, b) => a.time !== b.time ? a.time - b.time : (a.type === 'end' ? -1 : 1));
  const segments = [];
  const activeChars = new Set();
  let prevTime = 0;
  events.forEach(event => {
    const timeElapsed = event.time - prevTime;
    if (activeChars.size > 0 && timeElapsed > 0) {
      const sortedActive = Array.from(activeChars).sort((a, b) => b.score_bonus - a.score_bonus);
      const bestChar = sortedActive[0];
      segments.push({ start: prevTime, end: event.time, color: bestChar.color, name: bestChar.name });
    }
    if (event.type === 'start') activeChars.add(event.char);
    else activeChars.delete(event.char);
    prevTime = event.time;
  });

  const mergedSegments = [];
  if (segments.length > 0) {
    let currentSegment = { ...segments[0] };
    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.name === currentSegment.name && Math.abs(seg.start - currentSegment.end) < 0.001) {
        currentSegment.end = seg.end;
      } else {
        mergedSegments.push(currentSegment);
        currentSegment = { ...seg };
      }
    }
    mergedSegments.push(currentSegment);
  }
  return mergedSegments;
}

// 【升級】：根據使用者的優化目標 (EV / Ceiling / Coverage) 挑選最佳解
function findBestTeamByGoal(memberPool, maxTalentPoints, songDuration, optimizeGoal) {
  let bestResult = { score: -1, ev: 0, ceiling: 0, coverage: 0, team: [] };
  const usableTalents = Math.min(maxTalentPoints, 15);
  const talentDistributions = getTalentDistributions(usableTalents, memberPool);

  // 【新增】：依照 Bloom 1 勾選狀態，事先算好每位成員實際使用的 Score / Duration
  const memberStats = memberPool.map(char => getEffectiveStats(char));

  for (const distribution of talentDistributions) {
    let currentTimelineData = [];
    
    memberPool.forEach((char, index) => {
      const investedPoints = distribution[index];
      const st = memberStats[index];
      const intervals = getCharacterIntervals(char['AP cooldown'], st.duration, investedPoints, songDuration);
      
      const customColor = characterColors[char.character];
      const assignedColor = (customColor && customColor.trim() !== "") ? customColor : timelineColors[index % timelineColors.length];

      currentTimelineData.push({
        id: char.id,
        name: char.character,
        color: assignedColor,
        investedPoints: investedPoints,
        intervals: intervals,
        score_bonus: st.score,
        duration: st.duration,
        bloom1: st.bloom,
        parsed_rate: char.parsed_rate
      });
    });

    const ev = calculateExpectedScore(currentTimelineData, songDuration, {}, false);
    const ceiling = calculateExpectedScore(currentTimelineData, songDuration, {}, true);
    
    const summarySegments = getCoverageSegments(currentTimelineData);
    let coverage = 0;
    summarySegments.forEach(seg => coverage += (seg.end - seg.start));

    // 決定這次排程的分數 (Score)
    let currentScore = 0;
    if (optimizeGoal === 'ev') {
      currentScore = ev;
    } else if (optimizeGoal === 'ceiling') {
      currentScore = ceiling;
    } else if (optimizeGoal === 'coverage') {
      // 若追求覆蓋率，則以秒數為主；加上微小的 EV 作為覆蓋率相同時的「同分比較條件」
      currentScore = coverage + (ev / 100000); 
    }
    
    if (currentScore > bestResult.score) {
      bestResult = { score: currentScore, ev: ev, ceiling: ceiling, coverage: coverage, team: currentTimelineData };
    }
  }
  return bestResult;
}

function recommendTriggerBuffRanking(bestTeamData, songDuration) {
  const baseEV = calculateExpectedScore(bestTeamData, songDuration, {}, false);
  const recommendations = [];

  bestTeamData.forEach(char => {
    const testBuffs = {};
    testBuffs[char.id] = 0.01; 
    const boostedEV = calculateExpectedScore(bestTeamData, songDuration, testBuffs, false);
    const increase = boostedEV - baseEV; 
    recommendations.push({ name: char.name, increase: increase });
  });

  return recommendations.sort((a, b) => b.increase - a.increase);
}

// --- 4. Trigger Calculation ---
if(calculateBtn) {
    calculateBtn.addEventListener('click', () => {
      const songDuration = Number(document.getElementById('songDuration').value);
      const talentPoints = Number(document.getElementById('talentPoints').value);
      // 讀取優化目標
      const optimizeGoal = document.getElementById('optimizeGoal') ? document.getElementById('optimizeGoal').value : 'ev';
      
      if (selectedIds.size !== 5) {
        alert(`Please select exactly 5 members for your team. You have selected ${selectedIds.size}.`);
        return;
      }

      const selectedMembers = allCharactersData.filter(char => selectedIds.has(char.id));

      calculateBtn.innerText = "Calculating Optimal Strategy...";
      
      setTimeout(() => {
        // 使用新的萬能計算核心
        const bestTeamResult = findBestTeamByGoal(selectedMembers, talentPoints, songDuration, optimizeGoal);
        const bestTeam = bestTeamResult.team;
        
        const utilizedPoints = bestTeam.reduce((sum, char) => sum + char.investedPoints, 0);
        const topRecommendations = recommendTriggerBuffRanking(bestTeam, songDuration);
        const summarySegments = getCoverageSegments(bestTeam);
        const coveragePercent = ((bestTeamResult.coverage / songDuration) * 100).toFixed(2);

        let rankingHtml = `<div style="margin-top: 10px;"><strong>📈 Priority Trigger Buff Ranking (Based on EV):</strong><br>`;
        topRecommendations.forEach((rec, index) => {
          rankingHtml += `<div style="margin-top: 4px;">
            <span style="display: inline-block; width: 25px; color: #aaa;">#${index + 1}</span> 
            <span style="color: #4ade80; font-weight: bold;">${rec.name}</span> 
            <span style="color: #aaa; font-size: 0.85em;">(+${rec.increase.toFixed(2)} EV / 1% Rate Up)</span>
          </div>`;
        });
        rankingHtml += `</div>`;

        let modeDisplay = "";
        if (optimizeGoal === 'ev') modeDisplay = "Highest Expected Value (EV)";
        else if (optimizeGoal === 'ceiling') modeDisplay = "Theoretical Max Ceiling (100% Rate)";
        else modeDisplay = "Maximum Skill Coverage";

        // 面板同時展示 EV、Ceiling 和 Coverage
        document.getElementById('summary-container').innerHTML = `
          <div style="font-size: 0.9em; color: #aaa; margin-bottom: 8px;">Goal: <span style="color: #fff;">${modeDisplay}</span></div>
          Duration: ${songDuration}s | CD Points Used: ${utilizedPoints} / ${talentPoints}<br>
          Average Expected Score (EV): <span style="font-size: 1.1em; color: #87cefa;">${bestTeamResult.ev.toFixed(0)} pts</span><br>
          Theoretical Ceiling Score: <span style="font-size: 1.1em; color: #ffb6c1;">${bestTeamResult.ceiling.toFixed(0)} pts</span><br>
          Total Skill Coverage: <span style="color: var(--accent-color); font-weight: bold;">${bestTeamResult.coverage.toFixed(1)}s</span> <span style="font-size: 0.85em; color: #aaa;">(${coveragePercent}%)</span><br>
          <hr style="border-top: 1px dashed var(--accent-color); margin: 10px 0; opacity: 0.5;" />
          ${rankingHtml}
        `;

        const timelineWrapper = document.getElementById('timeline-wrapper');
        timelineWrapper.innerHTML = '';

        bestTeam.forEach(char => {
          const row = document.createElement('div');
          row.className = 'track-row';
          const badges = [];
          if (char.bloom1) badges.push(`<span class="bloom-badge" title="Score ${char.score_bonus}% | Dur ${char.duration}s">🌸 Bloom 1</span>`);
          if (char.investedPoints > 0) badges.push(`<span class="talent-badge">+${char.investedPoints * 4}% CD</span>`);
          const talentHTML = badges.length ? `<div style="margin-top: 6px; display: flex; gap: 4px; flex-wrap: wrap;">${badges.join('')}</div>` : '';
          const infoDiv = document.createElement('div');
          infoDiv.className = 'track-char-info';
          infoDiv.innerHTML = `${char.name}${talentHTML}`;
          const trackDiv = document.createElement('div');
          trackDiv.className = 'track';

          char.intervals.forEach(interval => {
            const start = interval[0];
            const duration = interval[1] - interval[0];
            const bar = document.createElement('div');
            bar.className = 'skill-bar';
            bar.style.left = `${(start / songDuration) * 100}%`;
            bar.style.width = `${(duration / songDuration) * 100}%`;
            bar.style.backgroundColor = char.color;
            bar.title = `Activate: ${start.toFixed(1)}s`;
            trackDiv.appendChild(bar);
          });
          row.appendChild(infoDiv);
          row.appendChild(trackDiv);
          timelineWrapper.appendChild(row);
        });

        // 總結算軌道在最下方
        const summaryRow = document.createElement('div');
        summaryRow.className = 'track-row';
        summaryRow.style.marginTop = '25px'; 
        const summaryInfoDiv = document.createElement('div');
        summaryInfoDiv.className = 'track-char-info';
        summaryInfoDiv.innerHTML = `<span style="color: var(--accent-color); font-size: 1rem; font-weight: 800;">🌟 Overall Coverage</span>`;
        const summaryTrackDiv = document.createElement('div');
        summaryTrackDiv.className = 'track';
        summaryTrackDiv.style.border = '1px solid rgba(74, 222, 128, 0.4)'; 

        summarySegments.forEach(seg => {
          const bar = document.createElement('div');
          bar.className = 'skill-bar';
          bar.style.left = `${(seg.start / songDuration) * 100}%`;
          bar.style.width = `${((seg.end - seg.start) / songDuration) * 100}%`;
          bar.style.backgroundColor = seg.color;
          bar.title = `Highest Bonus: ${seg.name}\nActive: ${seg.start.toFixed(1)}s ~ ${seg.end.toFixed(1)}s`;
          summaryTrackDiv.appendChild(bar);
        });

        summaryRow.appendChild(summaryInfoDiv);
        summaryRow.appendChild(summaryTrackDiv);
        timelineWrapper.appendChild(summaryRow);

        const axis = document.createElement('div');
        axis.className = 'axis';
        for (let i = 0; i <= songDuration; i += (songDuration >= 200 ? 30 : 15)) {
          const tick = document.createElement('div');
          tick.className = 'tick';
          tick.style.left = `${(i / songDuration) * 100}%`;
          tick.innerText = `${i}s`;
          axis.appendChild(tick);
        }
        timelineWrapper.appendChild(axis);

        resultSection.style.display = 'block';
        calculateBtn.innerText = "Calculate Best Team 🚀";
      }, 50); 
    });
}