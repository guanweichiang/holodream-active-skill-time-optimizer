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
          // 只保留 5 星角色
          allCharactersData = results.data.filter(char => char.character && char['AP cooldown'] && char.Rarity === 5);
          
          allCharactersData.forEach(char => {
            // 處理機率文字 (字首大寫)
            const rawRate = char.base_trigger_rate ? String(char.base_trigger_rate).trim() : 'Medium';
            char.display_rate = rawRate.charAt(0).toUpperCase() + rawRate.slice(1);
            
            // 轉換為機率小數點供演算法使用
            const rateStr = rawRate.toLowerCase();
            if (rateStr === 'high') char.parsed_rate = 0.55;
            else if (rateStr === 'medium' || rateStr === 'mid') char.parsed_rate = 0.45;
            else if (rateStr === 'low') char.parsed_rate = 0.35;
            else char.parsed_rate = 0.45; 
            
            // 【終極修復】：精準讀取 score_bonus 欄位，並過濾可能的 % 符號
            let rawScore = char.score_bonus;
            let parsedScore = parseFloat(String(rawScore).replace('%', '').trim());
            
            // 如果讀取出來真的是數字就用它，否則預設 100
            char.score_bonus = isNaN(parsedScore) ? 100 : parsedScore;
          });

          // 如果找不到容器，代表 index.html 沒更新，跳出警告
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

// --- 2. Render Accordion UI (支援 Fubuki 連動與強制排序) ---
function renderAccordionList(characters) {
  accordionContainer.innerHTML = '';
  const grouped = {};
  
  characters.forEach(char => {
    // 支援多群組 (例如: Gen 1, Gamers)
    const groups = char.group ? String(char.group).split(',').map(g => g.trim()) : ['Other'];
    groups.forEach(g => {
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(char);
    });
  });

  // 強制群組顯示順序
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

  // 強制角色顯示順序
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
        
        // 跨群組連動打勾狀態
        document.querySelectorAll(`.character-card input[type="checkbox"][value="${char.id}"]`).forEach(cb => {
            cb.checked = e.target.checked;
        });
      });

      const currentLimit = characterLimits.has(char.id) ? characterLimits.get(char.id) : 3;

      const infoDiv = document.createElement('div');
      infoDiv.className = 'char-info';
      
      // 更新顯示格式
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
        // 跨群組連動下拉選單
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

function findBestEVTeam(memberPool, maxTalentPoints, songDuration) {
  let bestResult = { expectedScore: 0, team: [] };
  const usableTalents = Math.min(maxTalentPoints, 15);
  const talentDistributions = getTalentDistributions(usableTalents, memberPool);

  for (const distribution of talentDistributions) {
    let currentTimelineData = [];
    
    memberPool.forEach((char, index) => {
      const investedPoints = distribution[index];
      const intervals = getCharacterIntervals(char['AP cooldown'], char['AP duration'], investedPoints, songDuration);
      currentTimelineData.push({
        id: char.id,
        name: char.character,
        color: timelineColors[index % timelineColors.length],
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
          <hr style="border-top: 1px dashed var(--accent-color); margin: 10px 0; opacity: 0.5;" />
          ${rankingHtml}
        `;

        const timelineWrapper = document.getElementById('timeline-wrapper');
        timelineWrapper.innerHTML = '';

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