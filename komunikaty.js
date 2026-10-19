
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
        {
        linie: [1],
        tytul: "Zmiany rozkładów jazdy od dnia 19.10.2026 r.",
        tresc: "Linia nr 1: Wszystkie kursy będą obsługiwały przystanek BIG Opatowice. W porannym szczycie kursy do Jamna i w popołudniowym szczycie kursy do Os. Bukowego bez przejazdu przez Os. Unii Europejskiej."
        },
        {
        linie: [2],
        tytul: "Zmiany rozkładów jazdy od dnia 19.10.2026 r.",
        tresc: "Linia nr 2: Przesunięcie kursu z Lubiatowa z godz. 5:16 na 5:06 oraz z Sianowskiej z godz. 5:53 na 5:48. Dodanie kursu z Strefy Ekonomicznej do Chełmoniewa o godz. 5:45."
        },
        {
        linie: [6],
        tytul: "Zmiany rozkładów jazdy od dnia 19.10.2026 r.",
        tresc: "Linia nr 6: Przystanek BIG Opatowice będzie obsługiwany przez linię nr 6 co 20 minut, a także przez kursy linii nr 1.",
        },
        {
        linie: [8],
        tytul: "Zmiany rozkładów jazdy od dnia 19.10.2026 r.",
        tresc: "Linia nr 8: Dodanie nowych kursów z Osiedla Unii Lubelskiej: w dniu powszednim o godzinie 5:10, w soboty o 5:30 oraz w niedziele i święta o 6:30.",
        },
        {
        linie: [14],
        tytul: "Zmiany rozkładów jazdy od dnia 19.10.2026 r.",
        tresc: "Linia nr 14: Kursy o godz. 23:02 w dniu powszednim i w sobotę oraz o 22:02 w niedziele będą przejeżdżać przez ul. Krańcową."
        }
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