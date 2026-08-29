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
const timelineColors = ["#ffb6c1", "#ff7f50", "#87cefa", "#98fb98", "#ffffb3"];

const accordionContainer = document.getElementById('accordionContainer');
const calculateBtn = document.getElementById('calculateBtn');
const resultSection = document.getElementById('resultSection');
const selectedCountDisplay = document.getElementById('selectedCountDisplay');
const clearCharactersBtn = document.getElementById('clearCharactersBtn');

// --- 1. Auto-fetch CSV & Pre-process ---
window.addEventListener('DOMContentLoaded', () => {
  fetch('character.csv') 
    .then(response => {
      if (!response.ok) throw new Error("Failed to load character.csv");
      return response.text();
    })
    .then(csvText => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: function(results) {
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
          });

          if (!accordionContainer) {
             console.error("accordionContainer not found! Please update your index.html");
             return;
          }
          renderAccordionList(allCharactersData);
        }
      });
    })
    .catch(error => {
      if (accordionContainer) {
        accordionContainer.innerHTML = `<div style="color: #ff6b6b; padding: 20px;">Failed to load database. Please ensure character.csv exists.</div>`;
      }
      console.error(error);
    });
});

clearCharactersBtn.addEventListener('click', () => {
  selectedIds.clear();
  document.querySelectorAll('.character-card input[type="checkbox"]').forEach(cb => cb.checked = false);
  selectedCountDisplay.innerText = '0';
});

// --- 2. Render Accordion UI ---
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

  const charRankList = [
    "tokinosora", "robocosan", "azki", "sakuramiko", "hoshimachisuisei",
    "akirosenthal", "akirosethal", "akaihaato", "shirakamifubuki", "natsuiromatsuri",
    "nakiriayame", "yuzukichoco", "oozorasubaru",
    "ookamimio", "nekomataokayu", "inugamikorone",
    "usadapekora", "shiranuiflare", "shiroganenoel", "shiroganeneol", "houshoumarine",
    "tsunomakiwatame", "tokoyamitowa", "himemoriluna",
    "yukihanalamy", "momosuzunene", "shishirobotan", "omarupolka",
    "la+darknesss", "takanelui", "hakuikoyori", "kazamairoha",
    "ayundarisu", "moonahoshinova", "airaniiofifteen",
    "kureijiollie", "anyamelfissa", "pavoliareine",
    "vestiazeta", "kaelakovalskia", "kobokanaeru",
    "moricalliope", "takanashikiara", "ninomaeinanis", "ninomaeina'nis",
    "irys", "ourokronii", "hakosbaelz",
    "shiorinovella", "kosekibijou", "nerissaravencroft", "fuwawaabyssgard", "mococoabyssgard",
    "otonosekanade", "ichijouririka", "juufuuteiraden", "todorokihajime"
  ];

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
        <span class="char-stats">⏱️ CD: ${char['AP cooldown']}s | ⏳ Dur: ${char['AP duration']}s</span>
        <span class="char-bonus">💥 Score: ${char.score_bonus}% | Rate: ${char.display_rate}</span>
        
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
        if (e.target.classList.contains('no-trigger') || e.target.tagName === 'OPTION') return;
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change')); 
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

function calculateExpectedScore(teamData, songDuration, triggerRateBuffs = {}) {
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
        let finalProb = char.parsed_rate + (triggerRateBuffs[char.id] || 0);
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
      
      segments.push({
        start: prevTime,
        end: event.time,
        color: bestChar.color,
        name: bestChar.name
      });
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

function findBestEVTeam(memberPool, maxTalentPoints, songDuration) {
  let bestResult = { expectedScore: 0, team: [] };
  const usableTalents = Math.min(maxTalentPoints, 15);
  const talentDistributions = getTalentDistributions(usableTalents, memberPool);

  for (const distribution of talentDistributions) {
    let currentTimelineData = [];
    
    memberPool.forEach((char, index) => {
      const investedPoints = distribution[index];
      const intervals = getCharacterIntervals(char['AP cooldown'], char['AP duration'], investedPoints, songDuration);
      
      // 【更新重點】：優先讀取自定義顏色，若無填寫則使用預設陣列的顏色
      const customColor = characterColors[char.character];
      const assignedColor = (customColor && customColor.trim() !== "") ? customColor : timelineColors[index % timelineColors.length];

      currentTimelineData.push({
        id: char.id,
        name: char.character,
        color: assignedColor,
        investedPoints: investedPoints,
        intervals: intervals,
        score_bonus: char.score_bonus,
        parsed_rate: char.parsed_rate
      });
    });

    const ev = calculateExpectedScore(currentTimelineData, songDuration, {});
    
    if (ev > bestResult.expectedScore) {
      bestResult = { expectedScore: ev, team: currentTimelineData };
    }
  }
  return bestResult;
}

function recommendTriggerBuffRanking(bestTeamData, songDuration) {
  const baseEV = calculateExpectedScore(bestTeamData, songDuration, {});
  const recommendations = [];

  bestTeamData.forEach(char => {
    const testBuffs = {};
    testBuffs[char.id] = 0.01; 
    
    const boostedEV = calculateExpectedScore(bestTeamData, songDuration, testBuffs);
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
      
      if (selectedIds.size !== 5) {
        alert(`Please select exactly 5 members for your team. You have selected ${selectedIds.size}.`);
        return;
      }

      const selectedMembers = allCharactersData.filter(char => selectedIds.has(char.id));

      calculateBtn.innerText = "Calculating EV, please wait...";
      
      setTimeout(() => {
        const bestTeam = findBestEVTeam(selectedMembers, talentPoints, songDuration);
        const utilizedPoints = bestTeam.team.reduce((sum, char) => sum + char.investedPoints, 0);
        const topRecommendations = recommendTriggerBuffRanking(bestTeam.team, songDuration);

        const summarySegments = getCoverageSegments(bestTeam.team);
        let totalCoverageTime = 0;
        summarySegments.forEach(seg => {
          totalCoverageTime += (seg.end - seg.start);
        });
        const coveragePercent = ((totalCoverageTime / songDuration) * 100).toFixed(2);

        let rankingHtml = `<div style="margin-top: 10px;"><strong>📈 Priority Trigger Buff Ranking:</strong><br>`;
        topRecommendations.forEach((rec, index) => {
          rankingHtml += `<div style="margin-top: 4px;">
            <span style="display: inline-block; width: 25px; color: #aaa;">#${index + 1}</span> 
            <span style="color: #4ade80; font-weight: bold;">${rec.name}</span> 
            <span style="color: #aaa; font-size: 0.85em;">(+${rec.increase.toFixed(2)} EV / 1% Rate Up)</span>
          </div>`;
        });
        rankingHtml += `</div>`;

        document.getElementById('summary-container').innerHTML = `
          Duration: ${songDuration}s | CD Points Used: ${utilizedPoints} / ${talentPoints}<br>
          Total Expected Score (EV): <span style="font-size: 1.2em;">${bestTeam.expectedScore.toFixed(0)} pts</span><br>
          Total Skill Coverage: <span style="color: var(--accent-color); font-weight: bold;">${totalCoverageTime.toFixed(1)}s</span> <span style="font-size: 0.85em; color: #aaa;">(${coveragePercent}%)</span><br>
          <hr style="border-top: 1px dashed var(--accent-color); margin: 10px 0; opacity: 0.5;" />
          ${rankingHtml}
        `;

        const timelineWrapper = document.getElementById('timeline-wrapper');
        timelineWrapper.innerHTML = '';

        // 1. 先繪製每個角色的獨立軌道
        bestTeam.team.forEach(char => {
          const row = document.createElement('div');
          row.className = 'track-row';
          
          const talentHTML = char.investedPoints > 0 ? `<div style="margin-top: 6px;"><span class="talent-badge">+${char.investedPoints * 4}% CD</span></div>` : '';
          
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

        // 2. 將「總結算軌道」放在成員列表的正下方
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

        // 3. 繪製時間軸
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
        calculateBtn.innerText = "Calculate Best EV Team 🚀";
      }, 50); 
    });
}