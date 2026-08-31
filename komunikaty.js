
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
        tytul: "Zmiany w kursowaniu autobusów na liniach nr 1, 2, 4, 6, 9, 12, 13, 14, 15, 23, 37 i 38 od 31 sierpnia 2026r.",
        tresc: "Linia nr 1: W dni powszednie nabiera szkolnego charakteru - godziny odjazdów zostaną dostosowane do godzin dzwonków w szkołach podstawowych, a dodatkowo zostanie skierowana przez Os. Unii Eurpejskiej; W soboty będzie kursowała wyłącznie na trasie Os. Bukowe - BIG Opatowice; W niedziele linia nie będzie kursować."
        },
        {
        linie: [2],
        tytul: "Zmiany w kursowaniu autobusów na liniach nr 1, 2, 4, 6, 9, 12, 13, 14, 15, 23, 37 i 38 od 31 sierpnia 2026r.",
        tresc: "Linia nr 2: Zwiększenie częstotliwości kursów w niedziele do 30 minut, skrócenie części kursów do Dworca PKP oraz drobna korekta rozkładu jazdy."
        },
        {
        linie: [4],
        tytul: "Zmiany w kursowaniu autobusów na liniach nr 1, 2, 4, 6, 9, 12, 13, 14, 15, 23, 37 i 38 od 31 sierpnia 2026r.",
        tresc: "Linia nr 4: Usunięcie kursów przez CH Laksa w niedziele."
        },
        {
        linie: [6],
        tytul: "Zmiany w kursowaniu autobusów na liniach nr 1, 2, 4, 6, 9, 12, 13, 14, 15, 23, 37 i 38 od 31 sierpnia 2026r.",
        tresc: "Linia nr 6: Zmiana trasy: Strefa Ekonomiczna/Dworzec PKP <-> ... <-> Os. Unii Europejskiej <-> BIG Opatowice <-> Zagroda Jamneńska; zmiana rozkładu jazdy: Kursy nawet co 10 minut w dni powszednie, co 20 minut w soboty. Dojazd do Jamna co 30 minut w godzinach szczytu, co 60 minut poza szczytem, w soboty i w niedziele."
        },
        {
        linie: [9],
        tytul: "Zmiany w kursowaniu autobusów na liniach nr 1, 2, 4, 6, 9, 12, 13, 14, 15, 23, 37 i 38 od 31 sierpnia 2026r.",
        tresc: "Linia nr 9: Zmiana trasy: Osiedle Bukowe/Działkowa Działki <-> ... <-> Szpital <-> Lechicka <-> Leśna <-> Osiedle Pod Lasem; zmiana rozkładu jazdy: kursy co 30 minut w dni powszednie, kursy do Działkowej Działki co 60 minut."
        },
        {
        linie: [12],
        tytul: "Zmiany w kursowaniu autobusów na liniach nr 1, 2, 4, 6, 9, 12, 13, 14, 15, 23, 37 i 38 od 31 sierpnia 2026r.",
        tresc: "Linia nr 12: Zwiększenie częstotliwości kursów w soboty do 60 minut."
        },
        {
        linie: [13,14],
        tytul: "Zmiany w kursowaniu autobusów na liniach nr 1, 2, 4, 6, 9, 12, 13, 14, 15, 23, 37 i 38 od 31 sierpnia 2026r.",
        tresc: "Linia nr 13 i 14: Cofnięcie wszystkich kursów w dni powszednie o 3 minuty w celu lepszej synchronizacji na Osiedlu Morskim oraz z linią nr 2."
        },
        {
        linie: [15],
        tytul: "Zmiany w kursowaniu autobusów na liniach nr 1, 2, 4, 6, 9, 12, 13, 14, 15, 23, 37 i 38 od 31 sierpnia 2026r.",
        tresc: "Linia nr 15: Dodanie kursów w międzyszczycie przewozowym co 60 minut."
        },
        {
        linie: [23],
        tytul: "Zmiany w kursowaniu autobusów na liniach nr 1, 2, 4, 6, 9, 12, 13, 14, 15, 23, 37 i 38 od 31 sierpnia 2026r.",
        tresc: "Linia nr 23: Korekta kursu z 5:27 na 5:24 realizowanego w dni powszednie z Niekłonic Wsi."
        },
        {
        linie: [37,38],
        tytul: "Zmiany w kursowaniu autobusów na liniach nr 1, 2, 4, 6, 9, 12, 13, 14, 15, 23, 37 i 38 od 31 sierpnia 2026r.",
        tresc: "Linia nr 37 i 38: Korekta rozkładu jazdy."
        }
    //...
    ]
};





/* MECHANIZM GENEROWANIA KOMUNIKATÓW */

// Kolejność kategorii komunikatów.
//const KOLEJNOSC_KATEGORII = ["awaria", "objazd", "zmiana"];

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

    // Jeżeli skrypt został użyty na stronie, gdzie nazwa nie pasuje do linia_x.html  to niczego nie generujemy.
    if (numerLinii === null) {
        console.warn("komunikaty.js: nie udało się odczytać numeru linii z nazwy pliku.");
        return;
    }
    // Tablica wszystkich komunikatów dotyczącychaktualnej linii.
    const komunikatyLinii = [];

    // Przechodzimy przez wszystkie działy:
    Object.entries(KOMUNIKATY).forEach(([typ, komunikaty]) => {
        komunikaty.forEach(komunikat => {
            if (komunikat.linie.includes(numerLinii)) {
                komunikatyLinii.push({...komunikat, typ: typ});
            }
        });
    });

    // Brak komunikatów = nie tworzymy .info.
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
    else console.warn("komunikaty.js: nie udało się znaleźć elementu <script>.");
}

/* Uruchomienie generatora. */
generujKomunikaty();