let motyw = localStorage.getItem('motyw') || 'ciemny';
const przycisk = document.getElementById('ZmianaMotywu');

// Funkcja do ustawiania stanu przycisku na podstawie aktualnego motywu
function przycisk_motyw() {
    if (motyw == "jasny") document.getElementById('zmianaMotywu').checked = true;
    else document.getElementById('zmianaMotywu').checked = false;
}
// Funkcja do zmiany motywu
function ZmienMotyw() {
    if (motyw == "ciemny") {
        // Pobierz aktualny motyw
        const aktualnyMotyw = document.documentElement.getAttribute('theme');
        // Zmień na przeciwny
        const nowyMotyw = aktualnyMotyw === 'ciemny' ? 'jasny' : 'ciemny';
        // Zastosuj nowy motyw na stronie
        document.documentElement.setAttribute('theme', nowyMotyw);
        // Zapisz wybór w pamięci przeglądarki na przyszłość
        localStorage.setItem('motyw', nowyMotyw);
        motyw = "jasny";
    } else {
        const aktualnyMotyw = document.documentElement.getAttribute('theme');
        const nowyMotyw = aktualnyMotyw === 'jasny' ? 'ciemny' : 'jasny';
        document.documentElement.setAttribute('theme', nowyMotyw);
        localStorage.setItem('motyw', nowyMotyw);
        motyw = "ciemny";
    }
    if (document.getElementById("jasnosc")) aktualizujPrzyciskJasnosciMapy();
}
// czyszczenie localStorage po odświeżeniu strony
window.addEventListener("DOMContentLoaded", () => {
    const nav = performance.getEntriesByType("navigation")[0];
    if (nav && nav.type === "reload") {
        motyw = "ciemny";
        document.documentElement.setAttribute('theme', motyw);
        localStorage.clear('motyw');
        przycisk_motyw();
    }
});

function aktualizujPrzyciskJasnosciMapy() {
    const przycisk = document.getElementById("jasnosc");
    const ciemnyMotyw = document.documentElement.getAttribute("theme") === "ciemny";

    przycisk.disabled = !ciemnyMotyw;
}