const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const mSelect = document.getElementById('monthSelect');
if(mSelect) { months.forEach((m, i) => { mSelect.innerHTML += `<option value="${i}">${m}</option>`; }); }
function lancerSaisie() {
    const config = { month: document.getElementById('monthSelect').value, year: document.getElementById('yearInput').value, type: document.getElementById('docType').value };
    localStorage.removeItem('etf_import_full');
    localStorage.setItem('etf_config', JSON.stringify(config));
    window.location.href = 'formulaire.html';
}
function importerRapportAccueil(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            localStorage.setItem('etf_import_full', JSON.stringify(data));
            window.location.href = 'formulaire.html';
        } catch (err) { alert("Fichier invalide."); }
    };
    reader.readAsText(file);
}