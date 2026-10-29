
/*
<script src="komunikaty.js"></script>

{
        linie: [],
        tytul: "",
        tresc: ""
        }
*/

/* BAZA KOMUNIKATÓW */
const KOMUNIKATY = {
    objazd: [
        {
        linie: [9],
        tytul: "Objazd od 20.07.2026",
        tresc: "W związku z przebudową ul. Młyńskiej zostaje wprowadzony objazd przez ul. Monte Cassino i Zwycięstwa. Z obsługi zostają wyłączone przystanki Plac Kilińskiego i Biblioteka (w kierunku Działkowa Działki). Na trasie objazdu obowiązują wszystkie przystanki."
        },
        {
        linie: [23],
        tytul: "Objazd od 20.07.2026",
        tresc: "W związku z przebudową ul. Młyńskiej zostaje wprowadzony objazd przez ul. Kutrzeby, Gierczak, Kwiatkowskiego i Batalionów Chłopskich. Z obsługi zostają wyłączone przystanki Biblioteka, Plac Kilińskiego i Wańkowicza (w kierunku Niekłonic). Na trasie objazdu obowiązują wszystkie przystanki."
        },
        {
        linie: [40],
        tytul: "Objazd od 20.07.2026",
        tresc: "W związku z przebudową ul. Młyńskiej zostaje wprowadzony objazd przez ul. Monte Cassino. Z obsługi zostają wyłączone przystanki Plac Kilińskiego, Lutyków i Poprzeczna. Na trasie objazdu obowiązują wszystkie przystanki."
        }
    //...
    ],
    zmiana: [
    //...
    ]
};





/* MECHANIZM GENEROWANIA KOMUNIKATÓW */

/* Znajdujemy numer linii na podstawie nazwy pliku. */
function pobierzNumerLinii() {
    const sciezka = window.location.pathname;
    const nazwaPliku = sciezka.substring(sciezka.lastIndexOf("/") + 1);
    const wynik = nazwaPliku.match(/^linia_(\d+)/i);

    if (!wynik) return null;

    return Number(wynik[1]);
}

/* Tworzy pojedynczy komunikat. */
function utworzKomunikat(komunikat) {
    const element = document.createElement("div");
    element.className = `${komunikat.typ}-info`;

    const ikona = document.createElement("div");
    ikona.className = `${komunikat.typ}-info-ikona`;

    const tytul = document.createElement("div");
    tytul.className = "info-tytul";
    tytul.textContent = komunikat.tytul;

    const tresc = document.createElement("div");
    tresc.className = "info-tresc";
    tresc.textContent = komunikat.tresc;

    element.appendChild(ikona);
    element.appendChild(tytul);
    element.appendChild(tresc);

    return element;
}


/* Generuje wszystkie komunikaty dla aktualnej linii. */
function generujKomunikaty() {
    const numerLinii = pobierzNumerLinii();

    // Jeżeli skrypt został użyty na stronie, gdzie nazwa nie pasuje do linia_x.html, to niczego nie generujemy.
    if (numerLinii === null) return;
    // Tablica wszystkich komunikatów dotyczących aktualnej linii.
    const komunikatyLinii = [];

    // Przechodzimy przez wszystkie działy:
    Object.entries(KOMUNIKATY).forEach(([typ, komunikaty]) => {
        komunikaty.forEach(komunikat => {
            if (komunikat.linie.includes(numerLinii)) {
                komunikatyLinii.push({...komunikat, typ: typ});
            }
        });
    });

    // Brak komunikatów to nie tworzymy .info.
    if (komunikatyLinii.length === 0) return;

    // Główny kontener.
    const kontener = document.createElement("div");
    kontener.className = "info";
    // Dodajemy wszystkie komunikaty do jednego .info.
    komunikatyLinii.forEach(komunikat => {
        const element = utworzKomunikat(komunikat);
        kontener.appendChild(element);
    });

    // Wstawiamy .info bezpośrednio pod <script>.
    const skrypt = document.currentScript;
    if (skrypt && skrypt.parentNode) skrypt.parentNode.insertBefore(kontener, skrypt.nextSibling);
}

/* Uruchomienie generatora. */
generujKomunikaty();