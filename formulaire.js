const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const allCodes = { "P": "Présence", "TT": "Télétravail", "CP": "Congés payés", "RTT": "RTT", "M": "Maladie", "AT/MP": "Accident Travail", "EV": "Événement familial", "AA": "Absence autorisée", "ANA": "Absence non autorisée", "N": "Nuits travaillées", "Demi P": "Demi-journée", "FORM": "Formation", "SCO": "Ecole", "JF": "Jour férié" };
let globalConfig = null;

window.onload = () => {
    const importData = localStorage.getItem('etf_import_full');
    if (importData) {
        const data = JSON.parse(importData); globalConfig = data.config; initFormulaire(globalConfig);
        setTimeout(() => restaurerDonnees(data), 300); localStorage.removeItem('etf_import_full');
    } else {
        const configStr = localStorage.getItem('etf_config');
        if (!configStr) { window.location.href = 'index.html'; }
        else { globalConfig = JSON.parse(configStr); initFormulaire(globalConfig); }
    }
};

function getHolidays(year) {
    const holidays = [`${year}0101`, `${year}0501`, `${year}0508`, `${year}0714`, `${year}1111`, `${year}1225` ];
    const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), n = (h + l - 7 * m + 114);
    const monthPaques = Math.floor(n / 31), dayPaques = (n % 31) + 1;
    const dPaques = new Date(year, monthPaques - 1, dayPaques);
    const formatLocal = (d) => { return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`; };
    const lundiP = new Date(dPaques); lundiP.setDate(dPaques.getDate() + 1);
    const asc = new Date(dPaques); asc.setDate(dPaques.getDate() + 39);
    const lundiPent = new Date(dPaques); lundiPent.setDate(dPaques.getDate() + 50);
    holidays.push(formatLocal(lundiP), formatLocal(asc), formatLocal(lundiPent));
    return holidays;
}

function initFormulaire(config) {
    document.getElementById('monthYearHeader').innerText = `${months[config.month]} ${config.year}`;
    renderCalendar(parseInt(config.year), parseInt(config.month), config.type);
    initRecapTables(); initSignature('canvas-emp'); initSignature('canvas-mgr');
}

function renderCalendar(year, month, type) {
    const container = document.getElementById('weeks-container'); container.innerHTML = "";
    const holidays = getHolidays(year);
    let firstDay = new Date(year, month, 1), dayOffset = firstDay.getDay() || 7; 
    let currentDay = 1, daysInMonth = new Date(year, month + 1, 0).getDate();
    let labelH = (type === 'DHAM') ? 'Nb Heures' : 'Nb jours';
    let labelE = (type.includes('ELO')) ? 'Eloignement' : (type.includes('IGD') ? 'IGD' : 'Nb TR');

    for (let w = 0; w < 6; w++) {
        if (currentDay > daysInMonth) break;
        let wrapper = document.createElement('div'); wrapper.className = "table-wrapper"; 
        let table = document.createElement('table');
        // Les TH sont bleus (style CSS par défaut)
        let html = `<tr><th style="width:150px"></th><th>Lun</th><th>Mar</th><th>Mer</th><th>Jeu</th><th>Ven</th><th>Sam</th><th>Dim</th><th style="width:60px">Hebdo.</th></tr>`;
        let rDate = `<tr><td class="row-label">Date</td>`, rCode = `<tr><td class="row-label">Codes</td>`, rVal = `<tr><td class="row-label">${labelH}</td>`, rExtra = `<tr><td class="row-label">${labelE}</td>`;

        for (let d = 1; d <= 7; d++) {
            const isWE = (d === 6 || d === 7), weCls = isWE ? 'weekend-bg' : '';
            if ((w === 0 && d < dayOffset) || currentDay > daysInMonth) {
                const outCls = 'out-month-bg';
                rDate += `<td class="${outCls}"></td>`; rCode += `<td class="${outCls}"></td>`; rVal += `<td class="${outCls}"></td>`; rExtra += `<td class="${outCls}"></td>`;
            } else {
                let id = currentDay;
                const dateKey = `${year}${String(month + 1).padStart(2, '0')}${String(id).padStart(2, '0')}`;
                const isHol = holidays.includes(dateKey);
                rDate += `<td class="${weCls}">${id}</td>`;
                rCode += `<td class="${weCls}" id="cell-code-${id}"><select class="code-select ${weCls}" id="c-${id}" data-day="${id}" onchange="handleUpdate('${type}', ${id}, ${w})">
                        <option value=""></option>${Object.keys(allCodes).map(c=>`<option value="${c}" ${isHol && c==='JF'?'selected':''}>${c}</option>`).join('')}</select></td>`;
                if (type === 'DHAM') {
                    rVal += `<td class="${weCls}"><input type="number" step="0.5" class="val-input ${weCls}" id="v-${id}" value="${isHol?0:''}" oninput="sumWeek(${w});updateRecap();"></td>`;
                } else {
                    rVal += `<td id="v-${id}" class="${weCls}">${isHol?0:0}</td>`;
                }
                rExtra += `<td id="e-${id}" class="${weCls}">0</td>`; 
                currentDay++;
            }
        }
        table.innerHTML = html + rDate + `<td>Total</td></tr>` + rCode + `<td>-</td></tr>` + rVal + `<td id="tv-w${w}">0</td></tr>` + rExtra + `<td id="te-w${w}">0</td></tr>`;
        wrapper.appendChild(table); container.appendChild(wrapper);
    }
    document.querySelectorAll('.code-select').forEach(s => { if(s.value === 'JF') toggleHolidayStyle(s.id.split('-')[1], true); });
    for(let i=0; i<6; i++) sumWeek(i); updateRecap();
}

function toggleHolidayStyle(dayId, isJF) {
    const el = document.getElementById(`cell-code-${dayId}`);
    if (el) {
        if (isJF) el.classList.add('holiday-bg'); else el.classList.remove('holiday-bg');
        const inner = el.querySelector('select'); if (inner) { if (isJF) inner.classList.add('holiday-bg'); else inner.classList.remove('holiday-bg'); }
    }
}

function handleUpdate(type, id, w) {
    const code = document.getElementById(`c-${id}`).value, vCell = document.getElementById(`v-${id}`);
    if (!vCell) return;
    toggleHolidayStyle(id, code === 'JF');
    let v = 0; if (code === "P" || code === "TT") v = (type === 'DHAM' ? 7 : 1); else if (code === "Demi P") v = (type === 'DHAM' ? 3.5 : 0.5); else if (code === "JF") v = 0;
    if (vCell.tagName === 'INPUT') vCell.value = v; else vCell.innerText = v;
    let e = (code === "P" || code === "TT") ? 1 : 0;
    const eCell = document.getElementById(`e-${id}`); if (eCell) eCell.innerText = e;
    sumWeek(w); updateRecap();
}

function sumWeek(w) {
    const tables = document.querySelectorAll('.table-wrapper table'); if (!tables[w]) return;
    let sv = 0, se = 0;
    tables[w].querySelectorAll(`[id^='v-']`).forEach(el => sv += parseFloat(el.value || el.innerText) || 0);
    tables[w].querySelectorAll(`[id^='e-']`).forEach(el => se += parseFloat(el.innerText) || 0);
    if (document.getElementById(`tv-w${w}`)) document.getElementById(`tv-w${w}`).innerText = sv;
    if (document.getElementById(`te-w${w}`)) document.getElementById(`te-w${w}`).innerText = se;
}

function initRecapTables() {
    const b1 = document.getElementById('recap-body-1'), b2 = document.getElementById('recap-body-2');
    b1.innerHTML = ""; b2.innerHTML = "";
    const p1 = ["P", "TT", "CP", "RTT", "M", "AT/MP", "EV"];
    for (let c of p1) b1.innerHTML += `<tr><td><strong>${c}</strong></td><td>${allCodes[c]}</td><td id="count-${c}">0</td></tr>`;
    for (let c in allCodes) { if(!p1.includes(c)) b2.innerHTML += `<tr><td><strong>${c}</strong></td><td>${allCodes[c]}</td><td id="count-${c}">0</td></tr>`; }
    b2.innerHTML += `<tr style="background:#f1f5f9"><td><strong>TR</strong></td><td><strong>Tickets Restaurant</strong></td><td id="count-TR">0</td></tr>`;
}

function updateRecap() {
    for (let c in allCodes) {
        let count = 0; document.querySelectorAll('.code-select').forEach(s => { if(s.value === c) count += (c === "Demi P" ? 0.5 : 1); });
        const el = document.getElementById(`count-${c}`); if(el) el.innerText = count;
    }
    let tr = 0; document.querySelectorAll(`[id^='e-']`).forEach(cell => tr += parseInt(cell.innerText) || 0);
    if (document.getElementById('count-TR')) document.getElementById('count-TR').innerText = tr;
}

function autoRemplir() {
    const year = parseInt(globalConfig.year), month = parseInt(globalConfig.month), holidays = getHolidays(year);
    document.querySelectorAll('.code-select').forEach(select => {
        const day = parseInt(select.getAttribute('data-day'));
        const dateKey = `${year}${String(month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`;
        if (holidays.includes(dateKey)) return;
        const dW = new Date(year, month, day).getDay();
        if (dW >= 1 && dW <= 5) { select.value = "P"; handleUpdate(globalConfig.type, day, 0); }
    });
    for(let i=0; i<6; i++) sumWeek(i); updateRecap();
}

function exporterDonnees() {
    const vals = {}; document.querySelectorAll('input, select, textarea, [id^="v-"], [id^="e-"]').forEach(el => { if(el.id) vals[el.id] = (el.tagName === 'TD') ? el.innerText : el.value; });
    const data = { config: globalConfig, values: vals, sigSalarie: document.getElementById('canvas-emp').toDataURL(), nav: { yes: document.getElementById('nav-yes').checked, h: document.getElementById('nav-hebdo').checked, m: document.getElementById('nav-mens').checked, a: document.getElementById('nav-ann').checked } };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `Rapport_${months[globalConfig.month]}_${globalConfig.year}.json`; a.click();
}

function restaurerDonnees(data) {
    for (let id in data.values) {
        const el = document.getElementById(id); if (el) { 
            if(el.tagName === 'TD') el.innerText = data.values[id]; else el.value = data.values[id];
            if(id.startsWith('c-') && data.values[id] === 'JF') toggleHolidayStyle(id.split('-')[1], true);
        }
    }
    document.getElementById('nav-yes').checked = data.nav.yes; document.getElementById('nav-hebdo').checked = data.nav.h;
    document.getElementById('nav-mens').checked = data.nav.m; document.getElementById('nav-ann').checked = data.nav.a;
    const ctx = document.getElementById('canvas-emp').getContext('2d'); const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = data.sigSalarie;
    for(let i=0; i<6; i++) sumWeek(i); updateRecap();
}

function initSignature(id) {
    const canvas = document.getElementById(id); const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2; ctx.lineCap = 'round'; let paint = false;
    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect(), cx = e.clientX || (e.touches ? e.touches[0].clientX : 0), cy = e.clientY || (e.touches ? e.touches[0].clientY : 0);
        return { x: (cx - rect.left) * (canvas.width / rect.width), y: (cy - rect.top) * (canvas.height / rect.height) };
    };
    canvas.addEventListener('mousedown', (e) => { paint = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); });
    canvas.addEventListener('mousemove', (e) => { if(!paint) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); });
    window.addEventListener('mouseup', () => paint = false);
    canvas.addEventListener('touchstart', (e) => { paint = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); }, {passive:false});
    canvas.addEventListener('touchmove', (e) => { if(!paint) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); }, {passive:false});
}
function clearCanvas(id) { document.getElementById(id).getContext('2d').clearRect(0,0,400,200); }