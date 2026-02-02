const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const mSelect = document.getElementById('monthSelect');

if(mSelect) {
    months.forEach((m, i) => { mSelect.innerHTML += `<option value="${i}">${m}</option>`; });
}

function lancerSaisie() {
    const config = {
        month: document.getElementById('monthSelect').value,
        year: document.getElementById('yearInput').value,
        type: document.getElementById('docType').value
    };
    localStorage.setItem('etf_config', JSON.stringify(config));
    window.location.href = 'formulaire.html';
}