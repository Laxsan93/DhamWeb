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

function initFormulaire(config) {
    document.getElementById('monthYearHeader').innerText = `${months[config.month]} ${config.year}`;
    renderCalendar(parseInt(config.year), parseInt(config.month), config.type);
    initRecapTables(); initSignature('canvas-emp'); initSignature('canvas-mgr');
}

function renderCalendar(year, month, type) {
    const container = document.getElementById('weeks-container'); container.innerHTML = "";
    let firstDay = new Date(year, month, 1); let dayOffset = firstDay.getDay() || 7; 
    let currentDay = 1; let daysInMonth = new Date(year, month + 1, 0).getDate();
    let labelExtra = (type.includes('ELO')) ? 'Eloignement' : (type.includes('IGD') ? 'IGD' : 'Nb TR');

    for (let w = 0; w < 6; w++) {
        if (currentDay > daysInMonth) break;
        let wrapper = document.createElement('div'); wrapper.className = "table-wrapper"; 
        let table = document.createElement('table');
        let html = `<tr><th style="width:150px"></th><th>Lun</th><th>Mar</th><th>Mer</th><th>Jeu</th><th>Ven</th><th>Sam</th><th>Dim</th><th style="width:60px">Hebdo.</th></tr>`;
        let rDate = `<tr><td class="row-label">Date</td>`;
        let rCode = `<tr><td class="row-label">Codes</td>`;
        let rVal = `<tr><td class="row-label">${type==='DHAM'?'Heures':'Jours'}</td>`;
        let rExtra = `<tr><td class="row-label">${labelExtra}</td>`;

        for (let d = 1; d <= 7; d++) {
            if ((w === 0 && d < dayOffset) || currentDay > daysInMonth) {
                const c = `<td></td>`; rDate += c; rCode += c; rVal += c; rExtra += c;
            } else {
                let id = currentDay;
                rDate += `<td>${id}</td>`;
                rCode += `<td><select class="code-select" id="c-${id}" data-day="${id}" onchange="handleUpdate('${type}', ${id}, ${w})"><option value=""></option>${Object.keys(allCodes).map(c=>`<option value="${c}">${c}</option>`).join('')}</select></td>`;
                rVal += `<td id="v-${id}">0</td>`;
                rExtra += `<td id="e-${id}">0</td>`; 
                currentDay++;
            }
        }
        table.innerHTML = html + rDate + `<td>Total</td></tr>` + rCode + `<td>-</td></tr>` + rVal + `<td id="tv-w${w}">0</td></tr>` + rExtra + `<td id="te-w${w}">0</td></tr>`;
        wrapper.appendChild(table); container.appendChild(wrapper);
    }
}

function handleUpdate(type, id, w) {
    const code = document.getElementById(`c-${id}`).value;
    let v = 0; if (code === "P" || code === "TT" || code === "JF") v = (type==='DHAM'?7:1); else if (code === "Demi P") v = (type==='DHAM'?3.5:0.5);
    document.getElementById(`v-${id}`).innerText = v;
    let e = (code === "P" || code === "TT") ? 1 : 0;
    document.getElementById(`e-${id}`).innerText = e;
    sumWeek(w); updateRecap();
}

function initSignature(id) {
    const canvas = document.getElementById(id); const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2; ctx.lineCap = 'round'; let paint = false;
    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect(); const cx = e.clientX || (e.touches ? e.touches[0].clientX : 0);
        const cy = e.clientY || (e.touches ? e.touches[0].clientY : 0);
        return { x: (cx - rect.left) * (canvas.width / rect.width), y: (cy - rect.top) * (canvas.height / rect.height) };
    };
    const start = (e) => { paint = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move = (e) => { if(!paint) return; if(e.cancelable) e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', () => paint = false);
    canvas.addEventListener('touchstart', start, {passive:false}); canvas.addEventListener('touchmove', move, {passive:false});
}

function sumWeek(w) {
    const tables = document.querySelectorAll('.table-wrapper table');
    let sv = 0, se = 0;
    tables[w].querySelectorAll(`[id^='v-']`).forEach(el => sv += parseFloat(el.innerText) || 0);
    tables[w].querySelectorAll(`[id^='e-']`).forEach(el => se += parseFloat(el.innerText) || 0);
    document.getElementById(`tv-w${w}`).innerText = sv;
    document.getElementById(`te-w${w}`).innerText = se;
}

function initRecapTables() {
    const b1 = document.getElementById('recap-body-1'); const b2 = document.getElementById('recap-body-2');
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
    document.getElementById('count-TR').innerText = tr;
}

function autoRemplir() {
    const year = parseInt(globalConfig.year); const month = parseInt(globalConfig.month);
    document.querySelectorAll('.code-select').forEach(select => {
        const day = parseInt(select.getAttribute('data-day'));
        const dayOfWeek = new Date(year, month, day).getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { select.value = "P"; handleUpdate(globalConfig.type, day, 0); }
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
        const el = document.getElementById(id); if (el) { if(el.tagName === 'TD') el.innerText = data.values[id]; else el.value = data.values[id]; }
    }
    document.getElementById('nav-yes').checked = data.nav.yes; document.getElementById('nav-hebdo').checked = data.nav.h;
    document.getElementById('nav-mens').checked = data.nav.m; document.getElementById('nav-ann').checked = data.nav.a;
    const ctx = document.getElementById('canvas-emp').getContext('2d'); const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = data.sigSalarie;
    for(let i=0; i<6; i++) sumWeek(i); updateRecap();
}

async function partagerJson() {
    const vals = {}; document.querySelectorAll('input, select, textarea, [id^="v-"], [id^="e-"]').forEach(el => { if(el.id) vals[el.id] = (el.tagName === 'TD') ? el.innerText : el.value; });
    const data = { config: globalConfig, values: vals, sigSalarie: document.getElementById('canvas-emp').toDataURL(), nav: { yes: document.getElementById('nav-yes').checked, h: document.getElementById('nav-hebdo').checked, m: document.getElementById('nav-mens').checked, a: document.getElementById('nav-ann').checked } };
    const jsonStr = JSON.stringify(data);
    const fileName = `Rapport_${months[globalConfig.month]}_${globalConfig.year}.json`;
    if (navigator.share) {
        try {
            const file = new File([jsonStr], fileName, { type: "application/json" });
            await navigator.share({ files: [file], title: 'Mon Rapport ETF', text: 'Partage du rapport JSON.' });
        } catch (err) { console.error(err); }
    } else { alert("Partage non supporté."); }
}
function clearCanvas(id) { document.getElementById(id).getContext('2d').clearRect(0,0,400,200); }