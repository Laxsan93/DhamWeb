const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const allCodes = {
    "P": "Présence", "TT": "Télétravail", "CP": "Congés payés", "RTT": "RTT", 
    "M": "Maladie", "AT/MP": "Accident Travail", "EV": "Événement familial", 
    "AA": "Absence autorisée", "ANA": "Absence non autorisée", "N": "Nuits travaillées", 
    "Demi P": "Demi-journée", "FORM": "Formation", "SCO": "Ecole", "JF": "Jour férié"
};

const monthSelect = document.getElementById('monthSelect');
months.forEach((m, i) => { monthSelect.innerHTML += `<option value="${i}">${m}</option>`; });

function generateDocument() {
    const month = parseInt(document.getElementById('monthSelect').value);
    const year = parseInt(document.getElementById('yearInput').value);
    const type = document.getElementById('docType').value;

    document.getElementById('setup-screen').style.display = 'none';
    document.getElementById('document-container').style.display = 'block';
    document.getElementById('monthYearHeader').innerText = `${months[month]} ${year}`;
    if(type.includes("DHAM")) document.getElementById('docHeaderTitle').innerText = "DHAM - SUIVI DES HEURES DE TRAVAIL";

    renderCalendar(year, month, type);
    initRecapTable();
    initSignature('canvas-emp');
    initSignature('canvas-mgr');
}

function renderCalendar(year, month, type) {
    const container = document.getElementById('weeks-container');
    container.innerHTML = "";
    let firstDay = new Date(year, month, 1);
    let dayOffset = firstDay.getDay() || 7; // 1 (Lun) à 7 (Dim)
    let currentDay = 1;
    let daysInMonth = new Date(year, month + 1, 0).getDate();

    let labels = { 
        v: (type === 'DHAM') ? 'Nb Heures' : 'Nb jours', 
        e: (type.includes('ELO')) ? 'Eloignement' : (type.includes('IGD') ? 'IGD' : 'Nb tickets resto') 
    };

    for (let w = 0; w < 6; w++) {
        if (currentDay > daysInMonth) break;
        
        let table = document.createElement('table');
        let html = `<tr><th style="width:150px"></th><th>Lun</th><th>Mar</th><th>Mer</th><th>Jeu</th><th>Ven</th><th>Sam</th><th>Dim</th><th class="total-col">Hebdo.</th></tr>`;
        let rDate = `<tr class="date-header"><td class="row-label">Date</td>`;
        let rCode = `<tr><td class="row-label">(1) Codes</td>`;
        let rVal = `<tr><td class="row-label">${labels.v}</td>`;
        let rExtra = `<tr><td class="row-label">${labels.e}</td>`;

        for (let d = 1; d <= 7; d++) {
            if ((w === 0 && d < dayOffset) || currentDay > daysInMonth) {
                [rDate, rCode, rVal, rExtra].forEach((_, i) => {
                    let cell = `<td class="weekend"></td>`;
                    if(i===0) rDate += cell; if(i===1) rCode += cell; if(i===2) rVal += cell; if(i===3) rExtra += cell;
                });
            } else {
                let id = currentDay;
                let isWE = d >= 6;
                rDate += `<td class="${isWE?'weekend':''}">${id} ${months[month].substring(0,3)}</td>`;
                rCode += `<td class="${isWE?'weekend':''}">
                    <select class="code-select" data-day="${id}" onchange="handleUpdate('${type}', ${id}, ${w})">
                        <option value=""></option>${Object.keys(allCodes).map(c=>`<option value="${c}">${c}</option>`).join('')}
                    </select></td>`;
                
                if (type === 'DHAM') {
                    rVal += `<td class="${isWE?'weekend':''}"><input type="number" step="0.5" class="val-input" id="v-${id}" oninput="sumWeek(${w})"></td>`;
                } else {
                    rVal += `<td id="v-${id}" class="${isWE?'weekend':''}">0</td>`;
                }
                
                rExtra += `<td id="e-${id}" class="${isWE?'weekend':''}">0</td>`;
                currentDay++;
            }
        }
        table.innerHTML = html + rDate + `<td class="total-col">Total</td></tr>` + rCode + `<td>-</td></tr>` + rVal + `<td id="tv-w${w}" class="total-col">0</td></tr>` + rExtra + `<td id="te-w${w}" class="total-col">0</td></tr>`;
        container.appendChild(table);
    }
}

function handleUpdate(type, id, w) {
    const code = document.querySelector(`select[data-day="${id}"]`).value;
    let v = 0; let e = 0;

    if (code === "P" || code === "TT") { v = (type === 'DHAM' ? 9 : 1); e = 1; }
    else if (code === "JF") { v = (type === 'DHAM' ? 9 : 1); }
    else if (["CP", "RTT", "M"].includes(code)) { v = (type === 'DHAM' ? 0 : 1); }

    if (type !== 'DHAM') { document.getElementById(`v-${id}`).innerText = v; }
    else { if(v > 0) document.getElementById(`v-${id}`).value = v; } 

    document.getElementById(`e-${id}`).innerText = e;
    sumWeek(w);
    updateRecap();
}

function sumWeek(w) {
    const tables = document.querySelectorAll('table:not(#recap-table)');
    let sv = 0, se = 0;
    tables[w].querySelectorAll(`[id^='v-']`).forEach(el => {
        let val = (el.tagName === 'INPUT') ? parseFloat(el.value) : parseFloat(el.innerText);
        sv += val || 0;
    });
    tables[w].querySelectorAll(`[id^='e-']`).forEach(td => se += parseFloat(td.innerText) || 0);
    document.getElementById(`tv-w${w}`).innerText = sv;
    document.getElementById(`te-w${w}`).innerText = se;
}

function initRecapTable() {
    const body = document.getElementById('recap-body');
    body.innerHTML = "";
    for (let c in allCodes) {
        body.innerHTML += `<tr><td><strong>${c}</strong></td><td style="text-align:left; padding-left:10px">${allCodes[c]}</td><td id="count-${c}">0</td></tr>`;
    }
}

function updateRecap() {
    for (let c in allCodes) {
        let count = 0;
        document.querySelectorAll('.code-select').forEach(s => { if(s.value === c) count++; });
        document.getElementById(`count-${c}`).innerText = count;
    }
}

function initSignature(id) {
    const canvas = document.getElementById(id);
    const ctx = canvas.getContext('2d');
    let paint = false;
    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        return { x: (e.clientX || (e.touches ? e.touches[0].clientX : 0)) - rect.left, y: (e.clientY || (e.touches ? e.touches[0].clientY : 0)) - rect.top };
    };
    const start = (e) => { paint = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); };
    const move = (e) => { if(!paint) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); };
    canvas.addEventListener('mousedown', start); canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', () => paint = false);
    canvas.addEventListener('touchstart', start); canvas.addEventListener('touchmove', move);
    canvas.addEventListener('touchend', () => paint = false);
}

function clearCanvas(id) {
    const c = document.getElementById(id);
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
}