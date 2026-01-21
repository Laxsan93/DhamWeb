const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const codes1 = { "P": "Présence", "TT": "Télétravail", "CP": "Congés payés", "RTT": "RTT", "M": "Maladie", "AT/MP": "Accident Travail", "EV": "Événement familial" };
const codes2 = { "AA": "Absence autorisée", "ANA": "Absence non autorisée", "N": "Nuits travaillées", "Demi P": "Demi-journée", "FORM": "Formation", "SCO": "Ecole", "JF": "Jour férié" };

let selectedDocType = "";

const mSelect = document.getElementById('monthSelect');
if(mSelect) months.forEach((m, i) => mSelect.innerHTML += `<option value="${i}">${m}</option>`);

function selectDoc(type, el) {
    selectedDocType = type;
    document.querySelectorAll('.doc-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    const btn = document.getElementById('mainLaunchBtn');
    btn.classList.remove('disabled');
    btn.disabled = false;
}

function generateDocument() {
    const month = parseInt(document.getElementById('monthSelect').value);
    const year = parseInt(document.getElementById('yearInput').value);
    const type = selectedDocType;

    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('document-container').style.display = 'block';
    document.getElementById('monthYearHeader').innerText = `${months[month]} ${year}`;
    if(type === "DHAM") document.getElementById('docHeaderTitle').innerText = "DHAM - SUIVI DES HEURES DE TRAVAIL";

    renderCalendar(year, month, type);
    initRecapTables();
    initSignature('canvas-emp');
    initSignature('canvas-mgr');
}

function renderCalendar(year, month, type) {
    const container = document.getElementById('weeks-container');
    container.innerHTML = "";
    let first = new Date(year, month, 1);
    let offset = first.getDay() || 7; 
    let current = 1;
    let days = new Date(year, month + 1, 0).getDate();
    let lbl = { v: (type === 'DHAM') ? 'Nb Heures' : 'Nb jours', e: (type.includes('ELO')) ? 'Eloignement' : (type.includes('IGD') ? 'IGD' : 'Nb tickets resto') };

    for (let w = 0; w < 6; w++) {
        if (current > days) break;
        let table = document.createElement('table');
        let rDate = `<tr class="date-header"><td class="row-label">Date</td>`;
        let rCode = `<tr><td class="row-label">(1) Codes</td>`;
        let rVal = `<tr><td class="row-label">${lbl.v}</td>`;
        let rExtra = `<tr><td class="row-label">${lbl.e}</td>`;

        for (let d = 1; d <= 7; d++) {
            if ((w === 0 && d < offset) || current > days) {
                [rDate, rCode, rVal, rExtra].forEach((_, i) => { let c = `<td class="weekend"></td>`; if(i===0) rDate += c; if(i===1) rCode += c; if(i===2) rVal += c; if(i===3) rExtra += c; });
            } else {
                let id = current; let isWE = d >= 6;
                rDate += `<td class="${isWE?'weekend':''}">${id} ${months[month].substring(0,3)}</td>`;
                rCode += `<td class="${isWE?'weekend':''}"><select class="code-select" data-day="${id}" onchange="updateCalc('${type}', ${id}, ${w})"><option value=""></option>${Object.keys({...codes1,...codes2}).map(c=>`<option value="${c}">${c}</option>`).join('')}</select></td>`;
                if (type === 'DHAM') rVal += `<td class="${isWE?'weekend':''}"><input type="number" step="0.5" class="val-input" id="v-${id}" oninput="sumWeek(${w})"></td>`;
                else rVal += `<td id="v-${id}" class="${isWE?'weekend':''}">0</td>`;
                rExtra += `<td id="e-${id}" class="${isWE?'weekend':''}">0</td>`;
                current++;
            }
        }
        table.innerHTML = `<tr><th style="width:150px"></th><th>Lun</th><th>Mar</th><th>Mer</th><th>Jeu</th><th>Ven</th><th>Sam</th><th>Dim</th><th class="total-col">Hebdo.</th></tr>` + rDate + `<td class="total-col">Total</td></tr>` + rCode + `<td>-</td></tr>` + rVal + `<td id="tv-w${w}" class="total-col">0</td></tr>` + rExtra + `<td id="te-w${w}" class="total-col">0</td></tr>`;
        container.appendChild(table);
    }
}

function updateCalc(type, id, w) {
    const code = document.querySelector(`select[data-day="${id}"]`).value;
    let v = 0; let e = 0;
    if (["P", "TT", "FORM"].includes(code)) { v = (type === 'DHAM' ? 9 : 1); e = 1; }
    else if (code === "JF") v = (type === 'DHAM' ? 9 : 1);
    else if (["CP", "RTT", "M"].includes(code)) v = (type === 'DHAM' ? 0 : 1);

    if (type !== 'DHAM') document.getElementById(`v-${id}`).innerText = v;
    else if(v > 0) document.getElementById(`v-${id}`).value = v;

    document.getElementById(`e-${id}`).innerText = e;
    sumWeek(w); updateRecaps();
}

function sumWeek(w) {
    const tables = document.querySelectorAll('table:not(.recap-half)');
    let sv = 0, se = 0;
    tables[w].querySelectorAll(`[id^='v-']`).forEach(el => sv += (el.tagName === 'INPUT' ? parseFloat(el.value) : parseFloat(el.innerText)) || 0);
    tables[w].querySelectorAll(`[id^='e-']`).forEach(td => se += parseFloat(td.innerText) || 0);
    document.getElementById(`tv-w${w}`).innerText = sv;
    document.getElementById(`te-w${w}`).innerText = se;
}

function initRecapTables() {
    const b1 = document.getElementById('recap-body-1'); const b2 = document.getElementById('recap-body-2');
    b1.innerHTML = ""; b2.innerHTML = "";
    for (let c in codes1) b1.innerHTML += `<tr><td><strong>${c}</strong></td><td style="text-align:left; padding-left:10px">${codes1[c]}</td><td id="count-${c}">0</td></tr>`;
    for (let c in codes2) b2.innerHTML += `<tr><td><strong>${c}</strong></td><td style="text-align:left; padding-left:10px">${codes2[c]}</td><td id="count-${c}">0</td></tr>`;
}

function updateRecaps() {
    const all = {...codes1, ...codes2};
    for (let c in all) {
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

function toggleFullScreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen();
    else if (document.exitFullscreen) document.exitFullscreen();
}