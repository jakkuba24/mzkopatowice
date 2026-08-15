let motyw = localStorage.getItem('motyw') || 'ciemny';
const przycisk = document.getElementById('ZmianaMotywu');

// Funkcja do ustawiania stanu przycisku na podstawie aktualnego motywu
function przycisk_motyw() {
    console.log(motyw);
if (motyw == "jasny") {
    console.log('b');
    document.getElementById('zmianaMotywu').checked = true;
} else {
    console.log('c');
    document.getElementById('zmianaMotywu').checked = false;
}
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