const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const codesPart1 = { "P": "Présence", "TT": "Télétravail", "CP": "Congés payés", "RTT": "RTT", "M": "Maladie", "AT/MP": "Accident Travail", "EV": "Événement familial" };
const codesPart2 = { "AA": "Absence autorisée", "ANA": "Absence non autorisée", "N": "Nuits travaillées", "Demi P": "Demi-journée", "FORM": "Formation", "SCO": "Ecole", "JF": "Jour férié" };

let globalConfig = null;

window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('data');

    if (sharedData) {
        try {
            const data = JSON.parse(decodeURIComponent(escape(atob(sharedData))));
            globalConfig = data.config;
            initFormulaire(globalConfig);
            setTimeout(() => restaurerDonnees(data), 200);
        } catch(e) { alert("Lien invalide."); window.location.href='index.html'; }
    } else {
        const configStr = localStorage.getItem('etf_config');
        if (!configStr) { window.location.href = 'index.html'; }
        else { 
            globalConfig = JSON.parse(configStr);
            initFormulaire(globalConfig); 
        }
    }
};

function initFormulaire(config) {
    document.getElementById('monthYearHeader').innerText = `${months[config.month]} ${config.year}`;
    if(config.type.includes("DHAM")) document.getElementById('docHeaderTitle').innerText = "DHAM - SUIVI DES HEURES DE TRAVAIL";
    renderCalendar(parseInt(config.year), parseInt(config.month), config.type);
    initRecapTables();
    initSignature('canvas-emp');
    initSignature('canvas-mgr');
}

function renderCalendar(year, month, type) {
    const container = document.getElementById('weeks-container');
    container.innerHTML = "";
    let firstDay = new Date(year, month, 1);
    let dayOffset = firstDay.getDay() || 7; 
    let currentDay = 1;
    let daysInMonth = new Date(year, month + 1, 0).getDate();
    let labels = { v: (type === 'DHAM') ? 'Nb Heures' : 'Nb jours', e: (type.includes('ELO')) ? 'Eloignement' : (type.includes('IGD') ? 'IGD' : 'Nb tickets resto') };

    for (let w = 0; w < 6; w++) {
        if (currentDay > daysInMonth) break;
        let table = document.createElement('table');
        let html = `<tr><th style="width:160px"></th><th>Lun</th><th>Mar</th><th>Mer</th><th>Jeu</th><th>Ven</th><th>Sam</th><th>Dim</th><th class="total-col">Hebdo.</th></tr>`;
        let rDate = `<tr><td class="row-label">Date</td>`;
        let rCode = `<tr><td class="row-label">Codes</td>`;
        let rVal = `<tr><td class="row-label">${labels.v}</td>`;
        let rExtra = `<tr><td class="row-label">${labels.e}</td>`;

        for (let d = 1; d <= 7; d++) {
            if ((w === 0 && d < dayOffset) || currentDay > daysInMonth) {
                const c = `<td></td>`; rDate += c; rCode += c; rVal += c; rExtra += c;
            } else {
                let id = currentDay;
                rDate += `<td>${id}</td>`;
                rCode += `<td><select class="code-select" id="c-${id}" data-day="${id}" onchange="handleUpdate('${type}', ${id}, ${w})"><option value=""></option>${Object.keys(codesPart1).concat(Object.keys(codesPart2)).map(c=>`<option value="${c}">${c}</option>`).join('')}</select></td>`;
                if (type === 'DHAM') { rVal += `<td><input type="number" step="0.5" class="val-input" id="v-${id}" oninput="sumWeek(${w})"></td>`; }
                else { rVal += `<td id="v-${id}">0</td>`; }
                rExtra += `<td id="e-${id}">0</td>`;
                currentDay++;
            }
        }
        table.innerHTML = html + rDate + `<td>-</td></tr>` + rCode + `<td>-</td></tr>` + rVal + `<td id="tv-w${w}" class="total-col">0</td></tr>` + rExtra + `<td id="te-w${w}" class="total-col">0</td></tr>`;
        container.appendChild(table);
    }
}

function autoRemplir() {
    const selects = document.querySelectorAll('.code-select');
    const year = parseInt(globalConfig.year);
    const month = parseInt(globalConfig.month);

    selects.forEach(select => {
        const day = parseInt(select.getAttribute('data-day'));
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay(); 
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            select.value = "P";
            handleUpdate(globalConfig.type, day, 0); 
        }
    });
    for(let i=0; i<6; i++) sumWeek(i);
    updateRecaps();
}

function handleUpdate(type, id, w) {
    const code = document.getElementById(`c-${id}`).value;
    let v = 0; let e = 0;
    if (code === "P" || code === "TT" || code === "JF") { v = (type.includes('DHAM') ? 7 : 1); e = (code !== "JF" ? 1 : 0); }
    else if (["CP", "RTT", "M"].includes(code)) { v = (type.includes('DHAM') ? 0 : 1); }

    const vCell = document.getElementById(`v-${id}`);
    if (vCell) { if(type.includes('DHAM')) vCell.value = v; else vCell.innerText = v; }
    if (document.getElementById(`e-${id}`)) document.getElementById(`e-${id}`).innerText = e;

    sumWeek(w); updateRecaps();
}

function sumWeek(w) {
    const tables = document.querySelectorAll('table:not(.recap-half)');
    let sv = 0, se = 0;
    if(tables[w]) {
        tables[w].querySelectorAll(`[id^='v-']`).forEach(el => { let val = (el.tagName === 'INPUT') ? parseFloat(el.value) : parseFloat(el.innerText); sv += val || 0; });
        tables[w].querySelectorAll(`[id^='e-']`).forEach(td => se += parseFloat(td.innerText) || 0);
        if(document.getElementById(`tv-w${w}`)) document.getElementById(`tv-w${w}`).innerText = sv;
        if(document.getElementById(`te-w${w}`)) document.getElementById(`te-w${w}`).innerText = se;
    }
}

function genererLienPartage() {
    const values = {};
    document.querySelectorAll('input[type="text"], textarea, .val-input, .code-select').forEach(el => { if(el.id) values[el.id] = el.value || el.innerText; });
    const data = {
        config: globalConfig,
        values: values,
        sigSalarie: document.getElementById('canvas-emp').toDataURL(),
        nav: { yes: document.getElementById('nav-yes').checked, h: document.getElementById('nav-hebdo').checked, m: document.getElementById('nav-mens').checked, a: document.getElementById('nav-ann').checked }
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    const url = window.location.origin + window.location.pathname + '?data=' + encoded;
    navigator.clipboard.writeText(url).then(() => alert("Lien de partage copié !"));
}

function restaurerDonnees(data) {
    for (let id in data.values) {
        const el = document.getElementById(id);
        if (el) { if(el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.tagName === 'TEXTAREA') el.value = data.values[id]; else el.innerText = data.values[id]; }
    }
    document.getElementById('nav-yes').checked = data.nav.yes;
    document.getElementById('nav-hebdo').checked = data.nav.h;
    document.getElementById('nav-mens').checked = data.nav.m;
    document.getElementById('nav-ann').checked = data.nav.a;
    const canvas = document.getElementById('canvas-emp');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = data.sigSalarie;
    for(let i=0; i<6; i++) sumWeek(i);
    updateRecaps();
}

function initRecapTables() {
    const b1 = document.getElementById('recap-body-1'); const b2 = document.getElementById('recap-body-2');
    b1.innerHTML = ""; b2.innerHTML = "";
    for (let c in codesPart1) b1.innerHTML += `<tr><td><strong>${c}</strong></td><td style="text-align:left; padding-left:10px">${codesPart1[c]}</td><td id="count-${c}">0</td></tr>`;
    for (let c in codesPart2) b2.innerHTML += `<tr><td><strong>${c}</strong></td><td style="text-align:left; padding-left:10px">${codesPart2[c]}</td><td id="count-${c}">0</td></tr>`;
}

function updateRecaps() {
    const allCodes = {...codesPart1, ...codesPart2};
    for (let c in allCodes) {
        let count = 0;
        document.querySelectorAll('.code-select').forEach(s => { if(s.value === c) count++; });
        const el = document.getElementById(`count-${c}`); if(el) el.innerText = count;
    }
}

function initSignature(id) {
    const canvas = document.getElementById(id); const ctx = canvas.getContext('2d'); ctx.lineWidth = 2; let paint = false;
    const getPos = (e) => { const rect = canvas.getBoundingClientRect(); const cx = e.clientX || (e.touches ? e.touches[0].clientX : 0); const cy = e.clientY || (e.touches ? e.touches[0].clientY : 0); return { x: cx - rect.left, y: cy - rect.top }; };
    canvas.addEventListener('mousedown', (e) => { paint = true; ctx.beginPath(); let p = getPos(e); ctx.moveTo(p.x, p.y); });
    canvas.addEventListener('mousemove', (e) => { if(!paint) return; let p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); });
    window.addEventListener('mouseup', () => paint = false);
    canvas.addEventListener('touchstart', (e) => { paint = true; ctx.beginPath(); let p = getPos(e); ctx.moveTo(p.x, p.y); });
    canvas.addEventListener('touchmove', (e) => { if(!paint) return; let p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); });
}

function clearCanvas(id) { document.getElementById(id).getContext('2d').clearRect(0, 0, 400, 200); }