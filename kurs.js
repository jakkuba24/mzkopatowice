/* Skrypty do generowania tabliczek */

const daneRozkladowPromise = (() => {
	if (typeof ODJAZDY !== 'undefined' && typeof TRASY !== 'undefined') {
		return Promise.resolve();
	}

	const adresSilnika = document.currentScript?.src || document.baseURI;
	const skryptBazy = document.createElement('script');
	skryptBazy.src = new URL('kurs_rozklady.js', adresSilnika).href;
	return new Promise((resolve, reject) => {
		skryptBazy.addEventListener('load', resolve, { once: true });
		skryptBazy.addEventListener('error', () => reject(new Error(
			`Nie udało się załadować bazy rozkładów: ${skryptBazy.src}`
		)), { once: true });
		document.head.appendChild(skryptBazy);
	});
})();

function normalizujNazwePrzystanku(tekst) {
	return String(tekst ?? '')
		.replace(/\u00a0/g, ' ')
		.replace(/\s+/g, ' ')
		.replace(/n(?:\u017c|\u0139\u013d)/gi, '')
		.replace(/nż/gi, '')
		.replace(/^\s*-\s*/, '')
		.trim();
}

/* Identyfikator pozostaje w nazwie wewnętrznej, ale nie jest prezentowany. */
function pobierzNazweWyswietlana(tekst) {
	return normalizujNazwePrzystanku(tekst).replace(/\s+\d{2}$/, '').trim();
}

function pobierzIdPrzystanku(tekst) {
	return normalizujNazwePrzystanku(tekst).match(/\s(\d{2})$/)?.[1] || null;
}

function czyTaSamaNazwaPrzystanku(a, b) {
	const nazwaA = normalizujNazwePrzystanku(a);
	const nazwaB = normalizujNazwePrzystanku(b);
	return nazwaA === nazwaB || pobierzNazweWyswietlana(nazwaA) === pobierzNazweWyswietlana(nazwaB);
}

/* Przy wyborze konkretnego wpisu identyfikator ma pierwszeństwo przed nazwą. */
function czyWybranyPrzystanekPasuje(element, wybrany) {
	const identyfikator = pobierzIdPrzystanku(wybrany);
	return identyfikator
		? normalizujNazwePrzystanku(element) === normalizujNazwePrzystanku(wybrany)
		: czyTaSamaNazwaPrzystanku(element, wybrany);
}

function pobierzNumerLinii() {
	const plik = window.location.pathname.split('/').pop();
	const wynik = plik.match(/^linia_(.+)\.html$/i);
	return wynik ? wynik[1] : null;
}

function pobierzKluczTrasyDlaKierunku(numerLinii, kierunek) {
	const trasyLinii = TRASY[numerLinii];
	if (!trasyLinii) return null;
	return trasyLinii[kierunek] ? kierunek : null;
}

/* Zwraca końcowe segmenty odpowiadające zagnieżdżonemu odgałęzieniu z listy. */
function pobierzSegmentyKoncoweZElementu(element, segmenty) {
	if (!element.matches('[data-wariant-start]') && !element.querySelector('.wariant-start')) {
		return null;
	}

	const nazwyKoncow = [...element.closest('ul').querySelectorAll('[data-wariant-koniec]')]
		.map((koniec) => koniec.dataset.nazwaWewnetrzna || normalizujNazwePrzystanku(koniec.textContent));
	if (!nazwyKoncow.length) return null;

	const segmentyKoncowe = Object.entries(segmenty)
		.filter(([nazwa, dane]) => {
			if (!nazwa.startsWith('do')) return false;
			const przystanki = rozbijSegmentTrasy(dane);
			const ostatni = normalizujNazwePrzystanku(przystanki.at(-1)?.nazwa || '');
			return nazwyKoncow.some((nazwaKoncowa) => czyTaSamaNazwaPrzystanku(ostatni, nazwaKoncowa));
		})
		.map(([nazwa]) => nazwa);

	return segmentyKoncowe.length ? segmentyKoncowe : null;
}

/* Zamienia wygodny zapis segmentu na jednolity zapis przystanków. */
function rozbijSegmentTrasy(segment) {
	const przystanki = [];
	let czasPrzedNastepnym = null;

	for (let i = 0; i < (segment || []).length; i++) {
		const wpis = segment[i];
		if (typeof wpis === 'number' || (typeof wpis === 'string' && /^\d+$/.test(wpis))) {
			czasPrzedNastepnym = Number(wpis);
			continue;
		}

		if (typeof wpis === 'string') {
			if (wpis.trim() === '') continue;
			const nastepny = segment[i + 1];
			const maCzasPoNazwie = typeof nastepny === 'string' && /^\d+$/.test(nastepny);
			przystanki.push({
				nazwa: wpis,
				czasOdPoprzedniego: czasPrzedNastepnym,
				czasDoNastepnego: maCzasPoNazwie ? Number(nastepny) : null,
				opcje: {}
			});
			if (maCzasPoNazwie) i++;
			czasPrzedNastepnym = null;
			continue;
		}

		if (Array.isArray(wpis)) {
			let czasPrzedNazwa = czasPrzedNastepnym;
			let nazwa;
			let czas;
			let opcje = {};

			// Obsługiwane są oba skróty:
			// ["Przystanek", {nz:true}] oraz
			// ["1", "Przystanek", "1", {nz:true}].
			if (/^\d+$/.test(String(wpis[0])) && typeof wpis[1] === 'string' && !/^\d+$/.test(wpis[1])) {
				czasPrzedNazwa = Number(wpis[0]);
				nazwa = wpis[1];
				czas = typeof wpis[2] === 'object' ? null : wpis[2];
				opcje = Object.assign({}, ...wpis.slice(2).filter((element) => element && typeof element === 'object' && !Array.isArray(element)));
			} else {
				nazwa = wpis[0];
				czas = typeof wpis[1] === 'object' ? null : wpis[1];
				opcje = Object.assign({}, ...wpis.slice(1).filter((element) => element && typeof element === 'object' && !Array.isArray(element)));
			}

			przystanki.push({
				nazwa,
				czasOdPoprzedniego: czasPrzedNazwa,
				czasDoNastepnego: czas == null ? null : Number(czas),
				opcje
			});
			czasPrzedNastepnym = null;
		}
	}

	return przystanki;
}

function czySegmentDoPosredni(segmenty, nazwaSegmentu) {
	if (!nazwaSegmentu?.startsWith('do')) return false;
	const ostatni = rozbijSegmentTrasy(segmenty[nazwaSegmentu]).at(-1);
	if (!ostatni) return false;

	return Object.keys(segmenty).some((nazwa) =>
		/^odcinekWspolny\d+$/.test(nazwa) &&
		normalizujNazwePrzystanku(rozbijSegmentTrasy(segmenty[nazwa])[0]?.nazwa || '') ===
		normalizujNazwePrzystanku(ostatni.nazwa)
	);
}

function pobierzKolejnoscSegmentow(segmenty) {
	return Object.keys(segmenty || {}).sort((a, b) => {
		const grupa = (nazwa) => {
			if (nazwa.startsWith('z')) return 1;
			if (nazwa === 'odcinekWspolny') return 2;
			if (/^odcinekPodstawowy\d*$/.test(nazwa)) return 3;
			if (nazwa.startsWith('wariant')) return 4;
			if (czySegmentDoPosredni(segmenty, nazwa)) return 5;
			if (/^odcinekWspolny\d+$/.test(nazwa)) return 5;
			if (nazwa.startsWith('do')) return 6;
			return 7;
		};
		const roznicaGrup = grupa(a) - grupa(b);
		if (roznicaGrup) return roznicaGrup;

		const numer = (nazwa) => Number(nazwa.match(/(\d+)$/)?.[1] || 0);
		return numer(a) - numer(b);
	});
}

/* Składa segmenty zapisane w kierunku w kolejności przejazdu. */
function zbudujTraseKierunku(segmenty, { przystanekPoczatkowy = null, segmentPoczatkowy = null, segmentKoncowy = null, warianty = [] } = {}) {
	const kolejnosc = pobierzKolejnoscSegmentow(segmenty);
	const podstawoweDoPominiecia = new Set();
	const wybraneWarianty = new Set(warianty);
	if (segmentKoncowy?.startsWith('wariant')) wybraneWarianty.add(segmentKoncowy);
	wybraneWarianty.forEach((wariant) => {
		const indeksWariantu = kolejnosc.indexOf(wariant);
		if (indeksWariantu < 0) return;

		for (let indeks = indeksWariantu - 1; indeks >= 0; indeks--) {
			if (/^odcinekPodstawowy\d*$/.test(kolejnosc[indeks])) {
				podstawoweDoPominiecia.add(kolejnosc[indeks]);
				break;
			}
			if (kolejnosc[indeks] === 'odcinekWspolny' || /^odcinekWspolny\d+$/.test(kolejnosc[indeks])) break;
		}
	});
	const pierwszyPrzystanek = (nazwaSegmentu) => {
		const pierwszy = rozbijSegmentTrasy(segmenty[nazwaSegmentu])[0];
		return pierwszy ? normalizujNazwePrzystanku(pierwszy.nazwa) : null;
	};
	const wybraneSegmentyPoczatkowe = kolejnosc.filter((nazwa) =>
		nazwa.startsWith('z') && czyWybranyPrzystanekPasuje(pierwszyPrzystanek(nazwa), przystanekPoczatkowy)
	);
	const segmentyZPrzystankiem = wybraneSegmentyPoczatkowe.length
		? wybraneSegmentyPoczatkowe
		: kolejnosc.filter((nazwa) =>
			nazwa.startsWith('z') && rozbijSegmentTrasy(segmenty[nazwa])
			.some((element) => czyWybranyPrzystanekPasuje(element.nazwa, przystanekPoczatkowy))
		);
	// Ten sam przystanek może występować w kilku alternatywnych segmentach
	// początkowych. Do zbudowania przebiegu wybieramy podstawowy (ostatni
	// w ustalonej kolejności), a warianty końcowe nadal dobieramy osobno.
	const segmentyDoZbudowania = segmentPoczatkowy && segmentyZPrzystankiem.includes(segmentPoczatkowy)
		? [segmentPoczatkowy]
		: segmentyZPrzystankiem.length > 1
			? [segmentyZPrzystankiem[segmentyZPrzystankiem.length - 1]]
			: segmentyZPrzystankiem;
	const wybranySegmentKoncowy = segmentKoncowy?.startsWith('do')
		? segmentKoncowy
		: kolejnosc.find((nazwa) => nazwa.startsWith('do') && !czySegmentDoPosredni(segmenty, nazwa));
	const indeksKoncowy = wybranySegmentKoncowy ? kolejnosc.indexOf(wybranySegmentKoncowy) : -1;

	return kolejnosc
		.filter((nazwa) => {
			const indeksSegmentu = kolejnosc.indexOf(nazwa);
			if (indeksKoncowy >= 0 && czySegmentDoPosredni(segmenty, wybranySegmentKoncowy) && indeksSegmentu > indeksKoncowy) {
				return false;
			}
			if (nazwa.startsWith('z')) return segmentyDoZbudowania.includes(nazwa);
			if (/^odcinekPodstawowy\d*$/.test(nazwa)) return !podstawoweDoPominiecia.has(nazwa);
			if (nazwa.startsWith('do')) return nazwa === wybranySegmentKoncowy;
			if (nazwa.startsWith('wariant')) return warianty.includes(nazwa);
			return true;
		})
		.flatMap((nazwa) => rozbijSegmentTrasy(segmenty[nazwa])
			.map((element) => ({ ...element, segmentTrasy: nazwa })));
}

function pobierzDaneKierunkuOdjazdow(numerLinii, kierunek) {
	return ODJAZDY[numerLinii]?.[kierunek] || null;
}

function pobierzListeDni(daneKierunku) {
	const kolejnosc = ['Dzień powszedni', 'Sobota', 'Niedziela', 'Niedziela i Święta', 'Święta'];
	const dni = new Set();

	Object.entries(daneKierunku || {}).forEach(([nazwa, dane]) => {
		if (nazwa === 'objasnienia' || !dane || typeof dane !== 'object') return;
		Object.keys(dane).forEach((dzien) => dni.add(dzien));
	});

	return [...dni].sort((a, b) => {
		const indeksA = kolejnosc.indexOf(a);
		const indeksB = kolejnosc.indexOf(b);
		return (indeksA < 0 ? 99 : indeksA) - (indeksB < 0 ? 99 : indeksB);
	});
}

function pobierzOznaczenieOdjazdu(wpis) {
	const dopasowanie = String(wpis).trim().match(/^(\d{1,2})([A-Za-z]*)$/);
	if (!dopasowanie) return null;

	return {
		minuta: Number(dopasowanie[1]),
		oznaczenie: dopasowanie[2] || null
	};
}

function znajdzSegmentWariantu(segmenty, oznaczenie, objasnienia, przystanekBazowy = null) {
	if (!oznaczenie) {
		return Object.keys(segmenty).find((nazwa) =>
			nazwa.startsWith('do') && !czySegmentDoPosredni(segmenty, nazwa)
		) || null;
	}

	const bezposredni = `wariant${oznaczenie}`;
	if (segmenty[bezposredni]) return bezposredni;
	const zgodneObjasnienia = Object.entries(objasnienia || {}).filter(([, opis]) =>
		new RegExp(`^${oznaczenie}\\s*-`, 'i').test(String(opis))
	);
	const pelneTrasy = [...new Set(zgodneObjasnienia
		.map(([nazwa]) => segmenty[nazwa] ? nazwa : segmenty[`z${nazwa}`] ? `z${nazwa}` : null)
		.filter(Boolean))];
	if (pelneTrasy.length > 1 && przystanekBazowy) {
		const dopasowanaTrasa = pelneTrasy.find((nazwa) => {
			const pierwszy = rozbijSegmentTrasy(segmenty[nazwa])[0]?.nazwa;
			return pierwszy && czyWybranyPrzystanekPasuje(pierwszy, przystanekBazowy);
		});
		return dopasowanaTrasa || null;
	}

		const wpisObjasnienia = Object.entries(objasnienia || {})
		.find(([, opis]) => new RegExp(`^${oznaczenie}\\s*-`, 'i').test(String(opis)));
		const nazwaKoncowa = wpisObjasnienia?.[0];
		if (!nazwaKoncowa) return null;
		const segmentPoczatkowy = nazwaKoncowa.startsWith('z')
			? nazwaKoncowa
			: `z${nazwaKoncowa}`;
		if (segmenty[segmentPoczatkowy]) return segmentPoczatkowy;

		return Object.keys(segmenty).find((nazwa) => {
			if (!nazwa.startsWith('do') && !nazwa.startsWith('wariant')) return false;
			// Opis może mieć nazwę wariantu, a nie nazwę ostatniego przystanku,
			// np. "Sianowska przez Dzierżęcino".
			if (nazwa === `do${nazwaKoncowa}` || nazwa === `wariant${nazwaKoncowa}`) return true;
			const przystanki = rozbijSegmentTrasy(segmenty[nazwa]);
		const ostatni = przystanki[przystanki.length - 1];
		return ostatni && czyTaSamaNazwaPrzystanku(ostatni.nazwa, nazwaKoncowa);
	}) || null;
}

function znajdzZlozonaTraseWariantu(segmenty, oznaczenie, objasnienia) {
	if (!oznaczenie) return null;
	const wpis = Object.entries(objasnienia || {}).find(([, opis]) =>
		new RegExp(`^${oznaczenie}\\s*-`, 'i').test(String(opis))
	);
	if (!wpis) return null;
	const nazwa = wpis[0];
	const poczatki = Object.keys(segmenty)
		.filter((segment) => segment.startsWith('z') && nazwa.startsWith(`${segment} `))
		.sort((a, b) => b.length - a.length);
	for (const segmentPoczatkowy of poczatki) {
		const segmentKoncowy = nazwa.slice(segmentPoczatkowy.length + 1);
		if (segmentKoncowy.startsWith('do') && segmenty[segmentKoncowy]) {
			return { segmentPoczatkowy, segmentKoncowy };
		}
	}
	return null;
}

function pobierzDomyslnySegmentPoczatkowy(segmenty, przystanekPoczatkowy, objasnienia) {
	const pasujace = Object.keys(segmenty).filter((nazwa) =>
		nazwa.startsWith('z') && czyWybranyPrzystanekPasuje(
			rozbijSegmentTrasy(segmenty[nazwa])[0]?.nazwa || '',
			przystanekPoczatkowy
		)
	);
	if (pasujace.length < 2) return pasujace[0] || null;

	const oznaczone = new Set(Object.keys(objasnienia || {}).map((nazwa) => {
		const klucz = nazwa.startsWith('z') ? nazwa : `z${nazwa}`;
		return segmenty[klucz] ? klucz : null;
	}).filter(Boolean));
	return pasujace.find((nazwa) => !oznaczone.has(nazwa)) || pasujace.at(-1);
}

function zastosujIgnorowanePrzystanki(trasa, dzien) {
	const wynik = trasa.map((element) => ({ ...element, opcje: { ...(element.opcje || {}) } }));
	for (let i = wynik.length - 1; i >= 0; i--) {
		const opcje = wynik[i].opcje;
		if (!opcje.ignoruj || opcje.ignoruj !== dzien) continue;

		if (opcje.alternatywny) {
			const alternatywny = typeof opcje.alternatywny === 'string'
				? {
					nazwa: opcje.alternatywny,
					czasOdPoprzedniego: opcje.czasAlternatywnyOdPoprzedniego,
					czasDoNastepnego: opcje.czasAlternatywnyDoNastepnego
				}
				: opcje.alternatywny;
			const nazwaAlternatywna = alternatywny?.nazwa ?? alternatywny?.przystanek;
			if (nazwaAlternatywna) {
				wynik[i] = {
					...wynik[i],
					nazwa: nazwaAlternatywna,
					czasOdPoprzedniego: alternatywny.czasOdPoprzedniego ?? wynik[i].czasOdPoprzedniego,
					czasDoNastepnego: alternatywny.czasDoNastepnego ?? wynik[i].czasDoNastepnego,
					opcje: {
						...alternatywny.opcje,
						...opcje,
						nz: alternatywny.nz ?? alternatywny.opcje?.nz ?? opcje.nz
					}
				};
				delete wynik[i].opcje.ignoruj;
				delete wynik[i].opcje.czas;
				delete wynik[i].opcje.czasAlternatywnyOdPoprzedniego;
				delete wynik[i].opcje.czasAlternatywnyDoNastepnego;
				delete wynik[i].opcje.alternatywny;
				if (wynik[i].opcje.nz == null) delete wynik[i].opcje.nz;
				continue;
			}
		}

		if (i > 0) {
			const czasNadpisany = opcje.czas ?? opcje.czasPrzejazdu ?? opcje.czasDoNastepnego;
			if (czasNadpisany != null) wynik[i - 1].czasDoNastepnego = Number(czasNadpisany);
		}
		wynik.splice(i, 1);
	}
	return wynik;
}

function znajdzCzasDoPrzystanku(trasa, przystanek, dzien) {
	trasa = zastosujIgnorowanePrzystanki(trasa, dzien);
	przystanek = normalizujNazwePrzystanku(przystanek);
	// Jeżeli oba wpisy mają identyfikator, musi on rozstrzygać między
	// przystankami o tej samej nazwie, np. Chełmoniewo 01 i 02.
	const indeksDokladny = trasa.findIndex((element) =>
		normalizujNazwePrzystanku(element.nazwa) === przystanek
	);
	if (pobierzIdPrzystanku(przystanek) && indeksDokladny < 0) return null;
	const indeks = indeksDokladny >= 0
		? indeksDokladny
		: trasa.findIndex((element) => czyTaSamaNazwaPrzystanku(element.nazwa, przystanek));
	if (indeks < 0) return null;

	let czas = 0;
	for (let i = 1; i <= indeks; i++) {
		const czasOdcinka = pobierzCzasOdcinka(trasa, i - 1);
		if (czasOdcinka == null) return null;
		czas += czasOdcinka;
	}
	return czas;
}

function czyKursKonczySieNaPrzystanku(trasa, przystanek) {
	const nazwa = normalizujNazwePrzystanku(przystanek);
	const indeksDokladny = trasa.findIndex((element) =>
		normalizujNazwePrzystanku(element.nazwa) === nazwa
	);
	const indeks = indeksDokladny >= 0
		? indeksDokladny
		: trasa.findIndex((element) => czyTaSamaNazwaPrzystanku(element.nazwa, przystanek));
	if (indeks < 0 || indeks !== trasa.length - 1) return false;
	return !trasa[indeks].opcje?.nieKoncowy;
}

function pobierzOdjazdyDlaPrzystanku({ numerLinii, kierunek, przystanek, dzien, segmenty }) {
	const daneKierunku = pobierzDaneKierunkuOdjazdow(numerLinii, kierunek);
	if (!daneKierunku) return [];

	const objasnienia = daneKierunku.objasnienia || {};
	const odjazdy = [];

	Object.entries(daneKierunku).forEach(([przystanekBazowy, danePrzystanku]) => {
		if (przystanekBazowy === 'objasnienia' || !danePrzystanku?.[dzien]) return;

		Object.entries(danePrzystanku[dzien]).forEach(([godzina, minuty]) => {
			String(minuty).split(',').forEach((wpis) => {
				const daneOdjazdu = pobierzOznaczenieOdjazdu(wpis);
				if (!daneOdjazdu) return;

				const zlozonaTrasa = znajdzZlozonaTraseWariantu(
					segmenty,
					daneOdjazdu.oznaczenie,
					objasnienia
				);
				const segmentWariantu = zlozonaTrasa?.segmentKoncowy || znajdzSegmentWariantu(
					segmenty,
					daneOdjazdu.oznaczenie,
					objasnienia,
					przystanekBazowy
				);
				const segmentPoczatkowy = zlozonaTrasa?.segmentPoczatkowy || (segmentWariantu?.startsWith('z')
					? segmentWariantu
					: !daneOdjazdu.oznaczenie
						? pobierzDomyslnySegmentPoczatkowy(segmenty, przystanekBazowy, objasnienia)
						: null);
				const trasa = zbudujTraseKierunku(segmenty, {
					przystanekPoczatkowy: przystanekBazowy,
					segmentPoczatkowy,
					segmentKoncowy: segmentWariantu,
					warianty: segmentWariantu?.startsWith('wariant') ? [segmentWariantu] : []
				});
				if (czyKursKonczySieNaPrzystanku(trasa, przystanek)) return;
				const czasDoPrzystanku = znajdzCzasDoPrzystanku(trasa, przystanek, dzien);
				if (czasDoPrzystanku == null) return;

				const czas = Number(godzina) * 60 + daneOdjazdu.minuta + czasDoPrzystanku;
				odjazdy.push({
					dzien,
					godzina: Math.floor(czas / 60) % 24,
					minuta: czas % 60,
					czasDoPrzystanku,
					oznaczenie: daneOdjazdu.oznaczenie,
					segmentWariantu,
					segmentPoczatkowy,
					przystanekBazowy
				});
			});
		});
	});

	const najdalszeOdjazdy = new Map();
	odjazdy.forEach((odjazd) => {
		const klucz = `${odjazd.godzina}:${odjazd.minuta}`;
		const poprzedni = najdalszeOdjazdy.get(klucz);
		if (!poprzedni || odjazd.czasDoPrzystanku > poprzedni.czasDoPrzystanku) {
			najdalszeOdjazdy.set(klucz, odjazd);
		}
	});

	return [...najdalszeOdjazdy.values()]
		.sort((a, b) => (a.godzina * 60 + a.minuta) - (b.godzina * 60 + b.minuta));
}

function czyLiniaNocna(kontener) {
	return Boolean(kontener.querySelector('table.rozklad_nocne'));
}

function ustawNaglowkiGodzin(tabela, godziny) {
	const wiersz = tabela.querySelector('tr:nth-child(2)');
	if (!wiersz) return;

	wiersz.innerHTML = '<th></th>' + godziny.map((godzina) => `<th>${godzina}</th>`).join('');
}

function generujWierszeOdjazdow(tabela, odjazdy, dni, godziny) {
	const wierszObowiazuje = tabela.querySelector('tr.obowiazuje');
	if (!wierszObowiazuje) return;
	const fragment = document.createDocumentFragment();

	dni.forEach((dzien) => {
		const odjazdyDnia = odjazdy.filter((odjazd) => odjazd.dzien === dzien);
		if (!odjazdyDnia.length) return;
		const maksymalnaLiczbaWierszy = Math.max(1, ...godziny.map((godzina) =>
			odjazdyDnia.filter((odjazd) => odjazd.godzina === godzina).length
		));

		const wiersze = Array.from({ length: maksymalnaLiczbaWierszy }, () => document.createElement('tr'));
		wiersze.forEach((wiersz, indeksWiersza) => {
			wiersz.dataset.generowane = 'true';
			if (godziny.some((godzina) => odjazdyDnia.filter((odjazd) => odjazd.godzina === godzina).length > indeksWiersza + 1)) {
				wiersz.classList.add('linie');
			}
			if (indeksWiersza === 0) {
				const etykieta = document.createElement('th');
				etykieta.rowSpan = maksymalnaLiczbaWierszy;
				etykieta.style.textAlign = 'left';
				etykieta.textContent = dzien;
				wiersz.appendChild(etykieta);
			}

			godziny.forEach((godzina) => {
				const wpisy = odjazdyDnia.filter((odjazd) => odjazd.godzina === godzina);
				const odjazd = wpisy[indeksWiersza];
				const komorka = document.createElement('td');
				if (odjazd) {
					komorka.textContent = `${String(odjazd.minuta).padStart(2, '0')}${odjazd.oznaczenie || ''}`;
					komorka.dataset.godzina = odjazd.godzina;
					komorka.dataset.minuta = odjazd.minuta;
					komorka.dataset.dzien = odjazd.dzien;
					komorka.dataset.wariant = odjazd.segmentWariantu || '';
					komorka.dataset.segmentPoczatkowy = odjazd.segmentPoczatkowy || '';
					komorka.dataset.przystanekBazowy = odjazd.przystanekBazowy;
					komorka.dataset.przystanek = tabela.closest('.tables-container')?.dataset.przystanek || '';
					komorka.addEventListener('mouseenter', (event) => wyswietlDymekZBazy(komorka, event));
					komorka.addEventListener('mouseleave', ukryjDymek);
				}
				wiersz.appendChild(komorka);
			});

			fragment.appendChild(wiersz);
		});
	});

	wierszObowiazuje.parentElement.insertBefore(fragment, wierszObowiazuje);
}

function generujObjasnienia(tabela, odjazdy, objasnienia, dodatkoweInformacje = []) {
	const wierszeObjasnien = [...tabela.querySelectorAll('tr.objasnienia')];
	const naglowek = wierszeObjasnien[0];
	if (!naglowek) return;

	wierszeObjasnien.slice(1).forEach((wiersz) => wiersz.remove());
	const informacje = Array.isArray(dodatkoweInformacje)
		? dodatkoweInformacje.filter((informacja) => typeof informacja === 'string' && informacja.trim())
		: [];
	if (informacje.length) {
		const czyWierszOdstepu = (wiersz) =>
			!wiersz.classList.contains('objasnienia') &&
			wiersz.children.length === 1 &&
			!wiersz.textContent.trim();
		let poNaglowku = false;
		[...tabela.querySelectorAll('tr')].forEach((wiersz) => {
			if (wiersz === naglowek) {
				poNaglowku = true;
				return;
			}
			if (poNaglowku && czyWierszOdstepu(wiersz)) wiersz.remove();
		});
	}
	const nocna = tabela.classList.contains('rozklad_nocne');
	const colspan = nocna ? 7 : 18;
	const komorkaNaglowka = naglowek.querySelector('th, td:last-child');
	if (komorkaNaglowka) komorkaNaglowka.colSpan = nocna ? 7 : 15;

	const uzywaneOznaczenia = new Set(odjazdy.map((odjazd) => odjazd.oznaczenie).filter(Boolean));
	const oznaczenia = [...new Map(Object.entries(objasnienia || {})
		.filter(([, opis]) => {
			const oznaczenie = String(opis).match(/^([A-Za-z]+)\s*-/)?.[1];
			return oznaczenie && uzywaneOznaczenia.has(oznaczenie);
		})
		.map(([, opis]) => [String(opis).trim(), String(opis).trim()])).values()];
	const miejsceWstawienia = naglowek.nextElementSibling;

	oznaczenia.forEach((opis) => {
		if (!opis) return;

		const wiersz = document.createElement('tr');
		wiersz.className = 'objasnienia';
		wiersz.dataset.generowane = 'true';
		wiersz.innerHTML = `<td></td><td colspan="${colspan}"></td>`;
		wiersz.querySelector('td:last-child').textContent = opis;
		naglowek.parentElement.insertBefore(wiersz, miejsceWstawienia);
	});

	if (informacje.length) {
		const liczbaOdstepow = oznaczenia.length ? 1 : 2;
		for (let indeks = 0; indeks < liczbaOdstepow; indeks++) {
			const odstep = document.createElement('tr');
			odstep.dataset.generowane = 'true';
			odstep.innerHTML = '<td style="border: 1px solid var(--table-border-niewidoczny)"><br></td>';
			naglowek.parentElement.appendChild(odstep);
		}
	}
	informacje.forEach((tekst) => {

		const wiersz = document.createElement('tr');
		wiersz.className = 'objasnienia';
		wiersz.dataset.generowane = 'true';
		wiersz.innerHTML = `<td></td><td colspan="${colspan}"></td>`;
		const pogrubienie = document.createElement('b');
		pogrubienie.textContent = tekst;
		wiersz.querySelector('td:last-child').appendChild(pogrubienie);
		naglowek.parentElement.appendChild(wiersz);
	});
}

function escapeHtml(tekst) {
	return String(tekst)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function pobierzElementPrzystankuZListy(nazwa, kontener) {
	const kierunek = normalizujNazwePrzystanku(kontener?.dataset.kierunek || '');
	const kolumna = [...document.querySelectorAll('.div_kierunki .kierunek-kolumna')]
		.find((element) => normalizujNazwePrzystanku(
			element.querySelector('h2')?.textContent.replace(/^Kierunek:\s*/i, '') || ''
		) === kierunek);
	if (!kolumna) return null;

	return [...kolumna.querySelectorAll('li')]
		.find((przystanek) => czyTaSamaNazwaPrzystanku(przystanek.dataset.nazwaWewnetrzna || przystanek.textContent, nazwa)) || null;
}

function czyPrzystanekObjazdowy(nazwa, kontener) {
	const przystanek = pobierzElementPrzystankuZListy(nazwa, kontener);
	return Boolean(przystanek?.classList.contains('objazd-text') || przystanek?.parentElement?.classList.contains('objazd-text'));
}

function pobierzGlownyPrzystanekKierunku(kierunek, atrybut) {
	const kolumna = [...document.querySelectorAll('.div_kierunki .kierunek-kolumna')]
		.find((element) => normalizujNazwePrzystanku(
			element.querySelector('h2')?.textContent.replace(/^Kierunek:\s*/i, '') || ''
		) === normalizujNazwePrzystanku(kierunek || ''));
	const przystanek = kolumna?.querySelector(`li[${atrybut}]`);
	return przystanek
		? (przystanek.dataset.nazwaWewnetrzna || normalizujNazwePrzystanku(przystanek.textContent))
		: null;
}

function pobierzGlownySegmentKoncowy(segmenty, kierunek) {
	const nazwaKoncowego = pobierzGlownyPrzystanekKierunku(kierunek, 'data-glowna-koniec');
	const segmentyKoncowe = pobierzKolejnoscSegmentow(segmenty).filter((nazwa) =>
		nazwa.startsWith('do') && !czySegmentDoPosredni(segmenty, nazwa)
	);
	return segmentyKoncowe.find((nazwa) => {
		const koniec = rozbijSegmentTrasy(segmenty[nazwa]).at(-1)?.nazwa;
		return nazwaKoncowego && czyTaSamaNazwaPrzystanku(koniec || '', nazwaKoncowego);
	}) || segmentyKoncowe[0] || null;
}

function pobierzWierszeTrasyDoWidoku(segmenty, przystanek, opcjeTrasy = {}, kierunek = null) {
	// Tabela zawsze opisuje cały przebieg. Opcje kliknięcia służą do wybrania
	// kursu w rozkładzie, nie do obcinania listy przystanków.
	const segmentKoncowy = null;
	const warianty = [];
	const segmentyKoncowe = null;
	const kolejnosc = pobierzKolejnoscSegmentow(segmenty);
	const wariantMaOdcinekPodstawowy = (nazwaWariantu) => {
		const indeksWariantu = kolejnosc.indexOf(nazwaWariantu);
		return indeksWariantu >= 0 && kolejnosc
			.slice(0, indeksWariantu)
			.some((nazwa) => /^odcinekPodstawowy\d*$/.test(nazwa));
	};
	// In this mode each "z" segment is a full route; matching stop IDs keeps branches distinct.
	if (Object.keys(segmenty).some((nazwa) => /^z.+\sdo.+/.test(nazwa))) {
		const pelneTrasy = Object.keys(segmenty)
			.filter((nazwa) => nazwa.startsWith('z'))
			.map((nazwa) => ({
				nazwa,
				przystanki: rozbijSegmentTrasy(segmenty[nazwa]),
				podstawowa: !/\sdo/.test(nazwa)
			}))
			.sort((a, b) => Number(b.podstawowa) - Number(a.podstawowa))
			.filter((trasa) => trasa.przystanki.some((element) =>
				czyWybranyPrzystanekPasuje(element.nazwa, przystanek)
			));
		if (pelneTrasy.length) {
			const korzen = { dzieci: new Map(), trasy: new Set(), koncowe: false, czasyNastepne: new Map(), element: null };
			pelneTrasy.forEach((trasa) => {
			const przystanki = trasa.przystanki;
			let wezel = korzen;
			przystanki.forEach((element, indeks) => {
				const klucz = normalizujNazwePrzystanku(element.nazwa);
				if (!wezel.dzieci.has(klucz)) {
					wezel.dzieci.set(klucz, {
						dzieci: new Map(),
						trasy: new Set(),
						podstawowe: new Set(),
						koncowe: false,
						czasyNastepne: new Map(),
						element
					});
				}
				const dziecko = wezel.dzieci.get(klucz);
				dziecko.trasy.add(trasa.nazwa);
				if (trasa.podstawowa) dziecko.podstawowe.add(trasa.nazwa);
				if (indeks === przystanki.length - 1) {
					dziecko.koncowe = !element.opcje?.nieKoncowy;
				} else {
					const nastepny = przystanki[indeks + 1];
					const czas = nastepny.czasOdPoprzedniego ?? element.czasDoNastepnego;
					if (czas != null) dziecko.czasyNastepne.set(trasa.nazwa, {
						nazwaNastepnego: normalizujNazwePrzystanku(nastepny.nazwa),
						czas
					});
				}
				wezel = dziecko;
			});
		});

		const wynik = [];
		const przejdz = (wezel, poziom) => {
			const dzieci = [...wezel.dzieci.values()];
			const podstawoweDziecko = dzieci.find((dziecko) => dziecko.podstawowe.size) || dzieci[0];
			dzieci.forEach((dziecko) => {
				const poziomWiersza = poziom + (dzieci.length > 1 && dziecko !== podstawoweDziecko ? 1 : 0);
				const przejscia = [...dziecko.czasyNastepne.values()];
				const nastepnePrzystanki = new Set(przejscia.map((przejscie) => przejscie.nazwaNastepnego));
				wynik.push({
					element: dziecko.element,
					poziom: poziomWiersza,
					koncowy: dziecko.koncowe,
					czasWyswietlany: nastepnePrzystanki.size > 1
						? przejscia.map((przejscie) => przejscie.czas).join('/')
						: undefined,
					segmentyKoncowe: [...dziecko.trasy]
				});
				const poziomDzieci = poziomWiersza + (dziecko.koncowe ? 1 : 0);
				przejdz(dziecko, poziomDzieci);
			});
		};
		przejdz(korzen, pelneTrasy.some((trasa) => trasa.podstawowa) ? 0 : 1);
		return wynik;
	}
	}
	if (segmentyKoncowe) {
		const ograniczoneSegmenty = Object.fromEntries(Object.entries(segmenty)
			.filter(([nazwa]) =>
				(!nazwa.startsWith('do') && (!nazwa.startsWith('wariant') || !warianty.length || warianty.includes(nazwa))) ||
				segmentyKoncowe.includes(nazwa)
			));
		return pobierzWierszeTrasyDoWidoku(ograniczoneSegmenty, przystanek);
	}
	if (segmentKoncowy || warianty.length) {
		const trasa = usunPowtorzonePrzystanki(zbudujTraseKierunku(segmenty, {
			przystanekPoczatkowy: przystanek,
			segmentKoncowy,
			warianty
		}));
		const indeksStartowy = trasa.findIndex((element) =>
			normalizujNazwePrzystanku(element.nazwa) === normalizujNazwePrzystanku(przystanek)
		);
		const trasaOdPrzystanku = indeksStartowy < 0 ? trasa : trasa.slice(indeksStartowy);
		const poziom = segmentKoncowy?.startsWith('wariant')
			? (wariantMaOdcinekPodstawowy(segmentKoncowy) ? 2 : 1)
			: segmentKoncowy?.startsWith('do') && segmentKoncowy !== 'doStrefa' ? 1 : 0;

		return trasaOdPrzystanku.map((element, indeks) => ({
			element,
			poziom,
			koncowy: indeks === trasaOdPrzystanku.length - 1 && !element.opcje?.nieKoncowy,
			segmentKoncowy,
			warianty
		}));
	}

	const przystanekJestWeWspolnymOdcinku = kolejnosc.some((nazwa) =>
		/^odcinekWspolny\d*$/.test(nazwa) && rozbijSegmentTrasy(segmenty[nazwa])
			.some((element) => czyWybranyPrzystanekPasuje(element.nazwa, przystanek))
	);
	const segmentyZ = kolejnosc.filter((nazwa) => nazwa.startsWith('z'));
	const glownyPoczatek = pobierzGlownyPrzystanekKierunku(kierunek, 'data-glowna-start');
	const nazwaGlownegoSegmentuDo = pobierzGlownySegmentKoncowy(segmenty, kierunek);
	const glownySegmentZ = segmentyZ.find((nazwa) =>
		czyWybranyPrzystanekPasuje(rozbijSegmentTrasy(segmenty[nazwa])[0]?.nazwa || '', glownyPoczatek)
	) || null;
	const przystanekJestNaTrasieGlownej = przystanekJestWeWspolnymOdcinku ||
		[glownySegmentZ, nazwaGlownegoSegmentuDo].filter(Boolean).some((nazwa) =>
			rozbijSegmentTrasy(segmenty[nazwa]).some((element) =>
				czyWybranyPrzystanekPasuje(element.nazwa, przystanek)
			)
		);
	const zZWybranymPrzystankiem = segmentyZ.filter((nazwa) =>
		nazwa === glownySegmentZ || przystanekJestNaTrasieGlownej ||
		nazwa.startsWith('z') && rozbijSegmentTrasy(segmenty[nazwa])
			.some((element) => czyWybranyPrzystanekPasuje(element.nazwa, przystanek))
	);
	const bazowySegmentZ = glownySegmentZ || zZWybranymPrzystankiem[0] || null;
	const zajeteNazwyZ = new Set((bazowySegmentZ ? rozbijSegmentTrasy(segmenty[bazowySegmentZ]) : [])
		.map((element) => normalizujNazwePrzystanku(element.nazwa)));
	const wierszeDodatkowychZ = zZWybranymPrzystankiem
		.filter((nazwa) => nazwa !== bazowySegmentZ)
		.sort((a, b) => rozbijSegmentTrasy(segmenty[b]).length - rozbijSegmentTrasy(segmenty[a]).length)
		.flatMap((nazwa) => rozbijSegmentTrasy(segmenty[nazwa])
			.filter((element) => {
				const klucz = normalizujNazwePrzystanku(element.nazwa);
				if (zajeteNazwyZ.has(klucz)) return false;
				zajeteNazwyZ.add(klucz);
				return true;
			})
			.map((element) => ({ element, poziom: 1, koncowy: false, segmentKoncowy: null, warianty: [] })));
	const segmentyWidoku = kolejnosc
		.filter((nazwa) => !nazwa.startsWith('z') || nazwa === bazowySegmentZ)
		.map((nazwa) => {
			const poziom = nazwa.startsWith('wariant') ? (wariantMaOdcinekPodstawowy(nazwa) ? 2 : 1) : /^odcinekPodstawowy\d*$/.test(nazwa) ? 1 : 0;
			return { nazwa, poziom, przystanki: rozbijSegmentTrasy(segmenty[nazwa]) };
		})
		.filter((segment) => segment.przystanki.length > 0);
	const segmentyKoncoweWidoku = segmentyWidoku.filter((segment) =>
		segment.nazwa.startsWith('do') && !czySegmentDoPosredni(segmenty, segment.nazwa)
	);
	const podstawowySegmentDo = segmentyKoncoweWidoku.find((segment) =>
		segment.nazwa === nazwaGlownegoSegmentuDo
	) || segmentyKoncoweWidoku[0];
	const indeksPodstawowegoDo = podstawowySegmentDo
		? segmentyWidoku.indexOf(podstawowySegmentDo)
		: -1;
	const dolaczWariantyZ = (wiersze) => {
		if (!wierszeDodatkowychZ.length) return wiersze;
		const poczatekBazowegoZ = bazowySegmentZ
			? normalizujNazwePrzystanku(rozbijSegmentTrasy(segmenty[bazowySegmentZ])[0]?.nazwa || '')
			: null;
		const indeksPoczatku = poczatekBazowegoZ
			? wiersze.findIndex((wiersz) => normalizujNazwePrzystanku(wiersz.element.nazwa) === poczatekBazowegoZ)
			: -1;
		wiersze.splice(indeksPoczatku < 0 ? 0 : indeksPoczatku + 1, 0, ...wierszeDodatkowychZ);
		return wiersze;
	};
	if (indeksPodstawowegoDo < 0) {
		const nazwaOstatniegoSegmentu = segmentyWidoku.at(-1)?.nazwa;
		const segmentyPodstawowe = segmentyWidoku.filter((segment) => !segment.nazwa.startsWith('wariant'));
		const segmentyWariantowe = segmentyWidoku.filter((segment) => segment.nazwa.startsWith('wariant'));
		const wstawienia = new Map();
		const nadpisaniaCzasu = new Map();
		const wariantyBezPunktuWstawienia = [];

		segmentyWariantowe.forEach((wariant) => {
			const indeksWariantu = segmentyWidoku.indexOf(wariant);
			const indeksPodstawowegoOdcinka = [...segmentyWidoku.slice(0, indeksWariantu)]
				.map((segment) => segment.nazwa)
				.map((nazwa, indeks) => ({ nazwa, indeks }))
				.reverse()
				.find(({ nazwa }) => /^odcinekPodstawowy\d*$/.test(nazwa))?.indeks;
			const poprzedniSegment = indeksPodstawowegoOdcinka == null
				? [...segmentyWidoku.slice(0, indeksWariantu)]
					.reverse()
					.find((segment) => !segment.nazwa.startsWith('wariant'))
				: [...segmentyWidoku.slice(0, indeksPodstawowegoOdcinka)]
					.reverse()
					.find((segment) => !segment.nazwa.startsWith('wariant'));
			const punktWstawienia = poprzedniSegment?.przystanki.at(-1);
			if (!punktWstawienia) {
				wariantyBezPunktuWstawienia.push(wariant);
				return;
			}

			const klucz = normalizujNazwePrzystanku(punktWstawienia.nazwa);
			const czasy = [
				punktWstawienia.czasDoNastepnego,
				wariant.przystanki[0]?.czasOdPoprzedniego
			].filter((czas) => czas != null);
			if (czasy.length) nadpisaniaCzasu.set(klucz, czasy.join('/'));
			wstawienia.set(klucz, [...(wstawienia.get(klucz) || []), wariant]);
		});

		const wynik = [];
		wariantyBezPunktuWstawienia.forEach((wariant) => {
			wariant.przystanki.forEach((element, indeks) => wynik.push({
				element,
				poziom: wariantMaOdcinekPodstawowy(wariant.nazwa) ? 2 : 1,
				koncowy: false,
				segmentKoncowy: null,
				warianty: [wariant.nazwa]
			}));
		});
		segmentyPodstawowe.forEach((segment) => {
			segment.przystanki.forEach((element, indeks) => {
				const klucz = normalizujNazwePrzystanku(element.nazwa);
				wynik.push({
					element,
					poziom: /^odcinekPodstawowy\d*$/.test(segment.nazwa) ? 1 : 0,
					koncowy: segment.nazwa === nazwaOstatniegoSegmentu && indeks === segment.przystanki.length - 1 && !element.opcje?.nieKoncowy,
					segmentKoncowy: null,
					warianty: [],
					czasWyswietlany: nadpisaniaCzasu.get(klucz)
				});

				(wstawienia.get(klucz) || []).forEach((wariant) => {
					wariant.przystanki.forEach((wariantowyElement, wariantowyIndeks) => wynik.push({
						element: wariantowyElement,
						poziom: wariantMaOdcinekPodstawowy(wariant.nazwa) ? 2 : 1,
						koncowy: segment.nazwa === nazwaOstatniegoSegmentu && wariantowyIndeks === wariant.przystanki.length - 1 && !wariantowyElement.opcje?.nieKoncowy,
						segmentKoncowy: null,
						warianty: [wariant.nazwa]
					}));
				});
			});
		});
		return dolaczWariantyZ(wynik);
	}

	const podstawoweDo = segmentyWidoku[indeksPodstawowegoDo].przystanki;
	const segmentyPodstawowe = segmentyWidoku.filter((segment, indeks) =>
		!segment.nazwa.startsWith('do') || indeks === indeksPodstawowegoDo
	);
	const wariantyKoncowe = segmentyWidoku.filter((segment, indeks) =>
		segment.nazwa.startsWith('do') && indeks !== indeksPodstawowegoDo
	).sort((a, b) => b.przystanki.length - a.przystanki.length);
	const wstawienia = new Map();
	const nadpisaniaCzasu = new Map();
	const zrodlaCzasuWariantu = new Map();
	const dodanePunktyRozgalezienia = new Set();
	const pierwszePrzystankiOdcinkowPodstawowych = new Set();
	const dodajCzasNaRozgalezieniu = (nazwa, czasy) => {
		const poprawneCzasy = czasy.filter((czas) => czas != null);
		if (!poprawneCzasy.length) return;
		const klucz = normalizujNazwePrzystanku(nazwa);
		const poprzednie = nadpisaniaCzasu.get(klucz) || [];
		nadpisaniaCzasu.set(klucz, [...new Set([...poprzednie, ...poprawneCzasy])]);
	};
	/* Początek odcinkaPodstawowego należy do poprzedniego wspólnego
	 * przystanku, a nie do pierwszego przystanku tego odcinka. */
	segmentyPodstawowe.forEach((segment, indeks) => {
		if (!/^odcinekPodstawowy\d*$/.test(segment.nazwa)) return;
		const poprzedni = segmentyPodstawowe[indeks - 1]?.przystanki.at(-1);
		const pierwszy = segment.przystanki[0];
		if (!poprzedni || !pierwszy) return;
		pierwszePrzystankiOdcinkowPodstawowych.add(normalizujNazwePrzystanku(pierwszy.nazwa));
		dodajCzasNaRozgalezieniu(poprzedni.nazwa, [
			poprzedni.czasDoNastepnego,
			pierwszy.czasOdPoprzedniego
		]);
		/* Podział nie może być wyświetlany ponownie na pierwszym
		 * przystanku równoległego odcinka. */
		nadpisaniaCzasu.delete(normalizujNazwePrzystanku(pierwszy.nazwa));
	});
	const zajeteNazwyDo = new Set(podstawoweDo.map((element) =>
		normalizujNazwePrzystanku(element.nazwa)
	));
	const dodajCzasWariantu = (nazwa, wpisy) => {
		if (pierwszePrzystankiOdcinkowPodstawowych.has(normalizujNazwePrzystanku(nazwa))) return;
		const poprawneWpisy = wpisy.filter((wpis) => wpis.czas != null);
		if (!poprawneWpisy.length) return;
		const klucz = normalizujNazwePrzystanku(nazwa);
		const poprzednie = nadpisaniaCzasu.get(klucz) || [];
		const zrodla = zrodlaCzasuWariantu.get(klucz) || new Set();
		poprawneWpisy.forEach(({ id, czas }) => {
			if (zrodla.has(id)) return;
			zrodla.add(id);
			poprzednie.push(czas);
		});
		zrodlaCzasuWariantu.set(klucz, zrodla);
		nadpisaniaCzasu.set(klucz, poprzednie);
	};
	wariantyKoncowe.forEach((wariant) => {
		if (wariant.przystanki.every((element) =>
			zajeteNazwyDo.has(normalizujNazwePrzystanku(element.nazwa))
		)) return;

		let wspolnyPoczatek = 0;
		while (
			wspolnyPoczatek < podstawoweDo.length &&
			wspolnyPoczatek < wariant.przystanki.length &&
			normalizujNazwePrzystanku(podstawoweDo[wspolnyPoczatek].nazwa) ===
				normalizujNazwePrzystanku(wariant.przystanki[wspolnyPoczatek].nazwa)
		) {
			wspolnyPoczatek++;
		}

		let przystankiWariantu = wariant.przystanki.slice(wspolnyPoczatek);
		let nazwaPunktuWstawienia;
		let czasPodstawowy;
		let czasWariantu;
		if (!przystankiWariantu.length) {
			przystankiWariantu = [wariant.przystanki.at(-1)];
			nazwaPunktuWstawienia = wariant.przystanki[wspolnyPoczatek - 2]?.nazwa;
			czasPodstawowy = podstawoweDo[wspolnyPoczatek - 2]?.czasDoNastepnego;
			czasWariantu = wariant.przystanki[wspolnyPoczatek - 2]?.czasDoNastepnego;
		} else if (wspolnyPoczatek <= 1) {
			const poprzedniSegment = segmentyPodstawowe[segmentyPodstawowe.findIndex((segment) =>
				segment.nazwa === segmentyWidoku[indeksPodstawowegoDo].nazwa
			) - 1];
			nazwaPunktuWstawienia = poprzedniSegment?.przystanki.at(-1)?.nazwa;
			przystankiWariantu = wariant.przystanki;
			czasPodstawowy = podstawoweDo[0]?.czasOdPoprzedniego;
			czasWariantu = wariant.przystanki[0]?.czasOdPoprzedniego;
		} else {
			nazwaPunktuWstawienia = wariant.przystanki[wspolnyPoczatek - 1]?.nazwa;
			czasPodstawowy = podstawoweDo[wspolnyPoczatek - 1]?.czasDoNastepnego;
			czasWariantu = wariant.przystanki[wspolnyPoczatek - 1]?.czasDoNastepnego
				?? wariant.przystanki[wspolnyPoczatek]?.czasOdPoprzedniego;
		}
		const pierwszyPunktWariantu = wariant.przystanki[wspolnyPoczatek]?.nazwa || wariant.przystanki[0]?.nazwa || '';
		const kluczPunktuRozgalezienia = `${normalizujNazwePrzystanku(nazwaPunktuWstawienia || '')}|${normalizujNazwePrzystanku(pierwszyPunktWariantu)}`;
		if (!dodanePunktyRozgalezienia.has(kluczPunktuRozgalezienia)) {
			const nazwaGlownegoDo = segmentyWidoku[indeksPodstawowegoDo].nazwa;
			dodajCzasWariantu(nazwaPunktuWstawienia || '', [
				{ id: `podstawowy:${nazwaGlownegoDo}`, czas: czasPodstawowy },
				{ id: `wariant:${wariant.nazwa}`, czas: czasWariantu }
			]);
			dodanePunktyRozgalezienia.add(kluczPunktuRozgalezienia);
		}

		const wiersze = przystankiWariantu.map((element, indeks) => ({
			element,
			poziom: wariantMaOdcinekPodstawowy(wariant.nazwa) ? 2 : 1,
			koncowy: indeks === przystankiWariantu.length - 1 && !element.opcje?.nieKoncowy,
			segmentKoncowy: wariant.nazwa,
			warianty: []
		}));
		wiersze.forEach((wiersz) => zajeteNazwyDo.add(normalizujNazwePrzystanku(wiersz.element.nazwa)));
		const klucz = normalizujNazwePrzystanku(nazwaPunktuWstawienia || '');
		wstawienia.set(klucz, [...(wstawienia.get(klucz) || []), wiersze]);
	});

	// Zwykłe przejścia dodajemy tylko w punktach, w których nie ma już
	// wpisu wariantowego. Zapobiega to powieleniu czasu podstawowego, np.
	// 1/1/1 zamiast 1/1.
	segmentyPodstawowe.forEach((segment, indeks) => {
		const poprzedniSegment = segmentyPodstawowe[indeks - 1];
		const pierwszyPrzystanek = segment.przystanki[0];
		const ostatniPoprzedniego = poprzedniSegment?.przystanki.at(-1);
		const klucz = normalizujNazwePrzystanku(ostatniPoprzedniego?.nazwa || '');
		if (pierwszyPrzystanek?.czasOdPoprzedniego != null && ostatniPoprzedniego && !wstawienia.has(klucz)) {
			dodajCzasWariantu(ostatniPoprzedniego.nazwa, [
				{ id: `segment:${poprzedniSegment.nazwa}`, czas: ostatniPoprzedniego.czasDoNastepnego },
				{ id: `segment:${segment.nazwa}`, czas: pierwszyPrzystanek.czasOdPoprzedniego }
			]);
		}
	});

	const wynik = [];
	segmentyPodstawowe.forEach((segment) => {
		segment.przystanki.forEach((element, indeks) => {
			wynik.push({
				element,
				poziom: /^odcinekPodstawowy\d*$/.test(segment.nazwa)
					? 1
					: segment.nazwa.startsWith('do') ? 0 : segment.poziom,
			koncowy: segment.nazwa.startsWith('do') && indeks === segment.przystanki.length - 1 && !element.opcje?.nieKoncowy,
				czasWyswietlany: nadpisaniaCzasu.get(normalizujNazwePrzystanku(element.nazwa))?.join('/'),
				segmentKoncowy: segment.nazwa.startsWith('wariant')
					? podstawoweDo ? segmentyWidoku[indeksPodstawowegoDo].nazwa : null
					: segmentyWidoku[indeksPodstawowegoDo].nazwa,
				warianty: segment.nazwa.startsWith('wariant') ? [segment.nazwa] : []
			});
			wynik.push(...scalWspolneWarianty(wstawienia.get(normalizujNazwePrzystanku(element.nazwa)) || []));
		});
	});

	return dolaczWariantyZ(wynik);
}

/* Scala wspólne prefiksy wariantów, zachowując osobne identyfikatory. */
function scalWspolneWarianty(grupy) {
	if (grupy.length < 2) return grupy[0] || [];
	const polaczCzasy = (pierwszy, drugi) => [...new Set(
		`${pierwszy ?? ''}/${drugi ?? ''}`
			.split('/')
			.map((czas) => czas.trim())
			.filter(Boolean)
	)].join('/');

	const korzen = { wiersz: null, dzieci: new Map(), konczySieTutaj: false, liczbaTras: 0 };
	grupy.forEach((grupa) => {
		let wezel = korzen;
		wezel.liczbaTras++;
		grupa.forEach((wiersz) => {
			const klucz = normalizujNazwePrzystanku(wiersz.element.nazwa);
			if (!wezel.dzieci.has(klucz)) {
				wezel.dzieci.set(klucz, {
					wiersz: { ...wiersz },
					dzieci: new Map(),
					konczySieTutaj: false,
					liczbaTras: 0
				});
			} else {
				const istniejacy = wezel.dzieci.get(klucz).wiersz;
				istniejacy.koncowy = istniejacy.koncowy || wiersz.koncowy;
				const czas = polaczCzasy(
					istniejacy.czasWyswietlany ?? istniejacy.element.czasDoNastepnego,
					wiersz.czasWyswietlany ?? wiersz.element.czasDoNastepnego
				);
				if (czas) istniejacy.czasWyswietlany = czas;
				istniejacy.element = {
					...istniejacy.element,
					opcje: { ...(istniejacy.element.opcje || {}), ...(wiersz.element.opcje || {}) }
				};
			}
			wezel = wezel.dzieci.get(klucz);
			wezel.liczbaTras++;
		});
		wezel.konczySieTutaj = true;
	});

	const wynik = [];
	const przejdz = (wezel, poziom) => {
		const dzieci = [...wezel.dzieci.values()]
			.sort((a, b) => a.liczbaTras - b.liczbaTras);
		dzieci.forEach((dziecko, indeks) => {
			const wiersz = { ...dziecko.wiersz };
			wiersz.poziom = poziom
				+ (wezel.konczySieTutaj ? 1 : 0)
				+ (dzieci.length > 1 ? indeks : 0);
			wynik.push(wiersz);
			przejdz(dziecko, wiersz.poziom);
		});
	};
	przejdz(korzen, 1);
	return wynik;
}

function generujTabeleTrasy(kontener, segmenty, przystanek, opcjeTrasy = {}, kierunek = null) {
	const tabela = kontener.querySelector('table[class^="przystanki_"]');
	if (!tabela) return;

	const wierszNaglowka = tabela.querySelector('tr:first-child');
	if (!wierszNaglowka) return;

	[...tabela.querySelectorAll('tr')].slice(1).forEach((wiersz) => wiersz.remove());
	const fragment = document.createDocumentFragment();
	const wierszeTrasy = pobierzWierszeTrasyDoWidoku(segmenty, przystanek, opcjeTrasy, kierunek);

	wierszeTrasy.forEach(({ element, poziom, koncowy, czasWyswietlany, segmentKoncowy, warianty, segmentyKoncowe }) => {
			const wiersz = document.createElement('tr');
			wiersz.dataset.generowane = 'true';
			if (czyPrzystanekObjazdowy(element.nazwa, kontener)) wiersz.classList.add('objazd-text');

			const nazwa = document.createElement('td');
			const trescNazwy = document.createElement(koncowy ? 'span' : 'a');
			if (!koncowy) {
				trescNazwy.href = '#';
					trescNazwy.addEventListener('click', (event) => {
						event.preventDefault();
						document.querySelector('.div_kierunki').style.display = 'none';
						kontener.style.display = 'block';
						const dostepneSegmentyKoncowe = pobierzDostepneSegmentyKoncowe(
							segmenty,
							element.nazwa,
							kontener.dataset.kierunek
						);
						const opcjeKliknietejTrasy = segmentyKoncowe?.length
							? { segmentyKoncowe }
							: dostepneSegmentyKoncowe?.length
							? { segmentyKoncowe: dostepneSegmentyKoncowe }
							: { segmentKoncowy, warianty };
						przygotujTabliczke(
							normalizujNazwePrzystanku(element.nazwa),
							kontener.dataset.kierunek,
							kontener,
							Boolean(element.opcje?.nz),
							opcjeKliknietejTrasy
						);
					});
			}
			const margines = poziom * 10;
			if (margines > 0) {
				const odsuniecie = document.createElement('span');
				odsuniecie.style.display = 'inline-block';
				odsuniecie.style.width = `${margines}px`;
				trescNazwy.appendChild(odsuniecie);
			}

			if (koncowy) {
				const minus = document.createElement('span');
				minus.className = 'red-text';
				minus.textContent = ' - ';
				trescNazwy.appendChild(minus);
			}

			trescNazwy.appendChild(document.createTextNode(pobierzNazweWyswietlana(element.nazwa)));
			if (element.opcje?.nz) {
				const oznaczenie = document.createElement('span');
				oznaczenie.className = 'red-text';
				oznaczenie.textContent = ' nż';
				trescNazwy.appendChild(oznaczenie);
			}
			nazwa.appendChild(trescNazwy);

			const czas = document.createElement('td');
			// czasOdPoprzedniego oznacza dojazd do pierwszego punktu wariantu,
			// nie czas przejazdu z przystanku końcowego.
			czas.textContent = czasWyswietlany ?? element.czasDoNastepnego ?? '';
			wiersz.append(nazwa, czas);
			fragment.appendChild(wiersz);
	});

	tabela.appendChild(fragment);
}

function pobierzDostepneSegmentyKoncowe(segmenty, przystanek, kierunek = null) {
	const kolejnosc = pobierzKolejnoscSegmentow(segmenty);
	const podstawowy = pobierzGlownySegmentKoncowy(segmenty, kierunek);
	if (!podstawowy) return null;
	const przystanekZnormalizowany = normalizujNazwePrzystanku(przystanek);
	const pasujePrzystanekLubAlternatywa = (element) => {
		const alternatywny = element.opcje?.alternatywny;
		const nazwaAlternatywna = typeof alternatywny === 'string'
			? alternatywny
			: alternatywny?.nazwa ?? alternatywny?.przystanek;
		return czyWybranyPrzystanekPasuje(element.nazwa, przystanekZnormalizowany) ||
			Boolean(nazwaAlternatywna && czyWybranyPrzystanekPasuje(nazwaAlternatywna, przystanekZnormalizowany));
	};
	const bezposrednioPasujace = kolejnosc.filter((nazwa) => {
		if (!nazwa.startsWith('do') || czySegmentDoPosredni(segmenty, nazwa)) return false;
		const przystanki = rozbijSegmentTrasy(segmenty[nazwa]);
		const indeks = przystanki.findIndex(pasujePrzystanekLubAlternatywa);
		return indeks >= 0 && indeks < przystanki.length - 1;
	});

	const dostepne = kolejnosc.filter((nazwa) => {
		if (!nazwa.startsWith('do') || czySegmentDoPosredni(segmenty, nazwa)) return false;
		const trasa = zbudujTraseKierunku(segmenty, {
			przystanekPoczatkowy: przystanek,
			segmentKoncowy: nazwa
		});
		const indeks = trasa.findIndex(pasujePrzystanekLubAlternatywa);
		const indeksWSegmencie = rozbijSegmentTrasy(segmenty[nazwa]).findIndex(pasujePrzystanekLubAlternatywa);
		// Wariant jest dostępny od wybranego przystanku wtedy, gdy jego
		// rzeczywisty przebieg zawiera ten przystanek. Dzięki temu ostatni
		// wspólny przystanek (np. Grecka) zachowuje wszystkie warianty,
		// a wariant znika dopiero po faktycznym rozjechaniu tras.
		if (indeksWSegmencie >= 0) {
			const przystankiSegmentu = rozbijSegmentTrasy(segmenty[nazwa]);
			return indeksWSegmencie < przystankiSegmentu.length - 1;
		}
		return indeks >= 0 && indeks < trasa.length - 1;
	});

	return [...new Set([...dostepne, ...bezposrednioPasujace])];
}

function pobierzPoczatkowyPrzystanekTrasy(segmenty) {
	const segment = segmenty.odcinekWspolny || Object.values(segmenty).find((element) => Array.isArray(element));
	return rozbijSegmentTrasy(segment)?.[0]?.nazwa || null;
}

function czyPrzystanekMaWymuszonyKlik(segmenty, nazwa) {
	const szukanaNazwa = normalizujNazwePrzystanku(nazwa);
	return Object.values(segmenty || {}).some((segment) =>
		Array.isArray(segment) && rozbijSegmentTrasy(segment).some((element) =>
			normalizujNazwePrzystanku(element.nazwa) === szukanaNazwa && element.opcje?.nieKoncowy
		)
	);
}

function czyPrzystanekJestZaRozdzieleniem(segmenty, wariant, przystanek) {
	const podstawowy = pobierzKolejnoscSegmentow(segmenty).find((nazwa) =>
		nazwa.startsWith('do') && !czySegmentDoPosredni(segmenty, nazwa)
	);
	if (!podstawowy || !segmenty[wariant]) return false;

	const poczatek = pobierzPoczatkowyPrzystanekTrasy(segmenty);
	const trasaPodstawowa = zbudujTraseKierunku(segmenty, {
		przystanekPoczatkowy: poczatek,
		segmentKoncowy: podstawowy
	});
	const trasaWariantu = zbudujTraseKierunku(segmenty, {
		przystanekPoczatkowy: poczatek,
		segmentKoncowy: podstawowy,
		warianty: [wariant]
	});

	let wspolnyPoczatek = 0;
	while (
		wspolnyPoczatek < trasaPodstawowa.length &&
		wspolnyPoczatek < trasaWariantu.length &&
		normalizujNazwePrzystanku(trasaPodstawowa[wspolnyPoczatek].nazwa) ===
			normalizujNazwePrzystanku(trasaWariantu[wspolnyPoczatek].nazwa)
	) {
		wspolnyPoczatek++;
	}
	if (wspolnyPoczatek === 0 || wspolnyPoczatek >= trasaPodstawowa.length) return false;

	const indeksPrzystanku = trasaPodstawowa.findIndex((element) =>
		czyWybranyPrzystanekPasuje(element.nazwa, przystanek)
	);
	const indeksPrzystankuWariantu = trasaWariantu.findIndex((element) =>
		czyWybranyPrzystanekPasuje(element.nazwa, przystanek)
	);
	/* Ostatni wspólny przystanek nadal obsługuje wszystkie warianty.
	   Wariant znika dopiero od pierwszego przystanku po rozdzieleniu tras. */
	// Przystanek na granicy rozdzielenia jest jeszcze wspólny dla wszystkich
	// tras. Wariant ukrywamy dopiero od następnego przystanku.
	if (indeksPrzystanku <= wspolnyPoczatek) return false;
	if (indeksPrzystankuWariantu >= 0) {
		const dalszaTrasaPodstawowa = trasaPodstawowa.slice(indeksPrzystanku);
		const dalszaTrasaWariantu = trasaWariantu.slice(indeksPrzystankuWariantu);
		const dalszyPrzebiegJestWspolny = dalszaTrasaPodstawowa.length === dalszaTrasaWariantu.length &&
			dalszaTrasaPodstawowa.every((element, indeks) =>
				czyWybranyPrzystanekPasuje(element.nazwa, dalszaTrasaWariantu[indeks]?.nazwa)
			);
		if (dalszyPrzebiegJestWspolny) return false;
	}
	return true;
}

function filtrujOdjazdyWedlugWybranejTrasy(odjazdy, segmenty, przystanek, opcjeTrasy = {}, kierunek = null) {
	const { segmentKoncowy, segmentyKoncowe } = opcjeTrasy;
	if (segmentyKoncowe) {
		return odjazdy.filter((odjazd) => {
			if (segmentyKoncowe.includes(odjazd.segmentWariantu) ||
				segmentyKoncowe.includes(odjazd.segmentPoczatkowy)) return true;
			if (odjazd.segmentPoczatkowy) {
				const trasa = zbudujTraseKierunku(segmenty, {
					przystanekPoczatkowy: odjazd.przystanekBazowy,
					segmentPoczatkowy: odjazd.segmentPoczatkowy,
					segmentKoncowy: odjazd.segmentWariantu,
					warianty: odjazd.segmentWariantu?.startsWith('wariant') ? [odjazd.segmentWariantu] : []
				});
				return trasa.some((element) => czyWybranyPrzystanekPasuje(element.nazwa, przystanek)) &&
					!czyKursKonczySieNaPrzystanku(trasa, przystanek);
			}
			if (!odjazd.segmentWariantu?.startsWith('wariant')) return false;
			/*
			 * segmentyKoncowe zawiera końcowe segmenty do..., ale kursy
			 * przez wariant środkowy (np. U) nadal należą do tych tras.
			 * Wariant odrzucamy dopiero po faktycznym rozdzieleniu tras.
			 */
			return !czyPrzystanekJestZaRozdzieleniem(
				segmenty,
				odjazd.segmentWariantu,
				przystanek
			);
		});
	}
	if (!segmentKoncowy?.startsWith('do')) return odjazdy;

	const podstawowySegment = pobierzGlownySegmentKoncowy(segmenty, kierunek);
	if (segmentKoncowy !== podstawowySegment) {
		return odjazdy.filter((odjazd) => odjazd.segmentWariantu === segmentKoncowy);
	}

	return odjazdy.filter((odjazd) =>
		odjazd.segmentWariantu !== 'doPKP' ||
		!czyPrzystanekJestZaRozdzieleniem(segmenty, 'doPKP', przystanek)
	);
}

function wyczyscWygenerowanaTabliczke(tabela) {
	tabela.querySelectorAll('[data-generowane="true"]').forEach((element) => element.remove());
}

function ustawNaglowekTabliczki(tabela, przystanek, kierunek, naZadanie = false) {
	const opis = tabela.querySelector('table tr:first-child td[colspan]');
	if (!opis) return;

	przystanek = pobierzNazweWyswietlana(przystanek);
	const objazd = czyPrzystanekObjazdowy(przystanek, tabela.closest('.tables-container'));
	const klasaNazwy = objazd ? ' class="objazd-text"' : '';
	const oznaczenie = naZadanie ? ' <span class="red-text">nż</span>' : '';
	opis.innerHTML = `<b>Przystanek:</b> <span${klasaNazwy}>${escapeHtml(przystanek)}</span>${oznaczenie}<br><br><b>Kierunek:</b> ${escapeHtml(kierunek)}`;
}

function przygotujTabliczke(przystanek, kierunek, kontener, naZadanie = false, opcjeTrasy = {}) {
	wyczyscWygenerowanaTabliczke(kontener);
	kontener.dataset.przystanek = normalizujNazwePrzystanku(przystanek);
	kontener.dataset.kierunek = kierunek;
	ustawNaglowekTabliczki(kontener, przystanek, kierunek, naZadanie);

	const numerLinii = pobierzNumerLinii();
	const kierunki = TRASY[numerLinii];
	const indeksKierunku = [...document.querySelectorAll('.div_kierunki .kierunek-kolumna')]
		.findIndex((kolumna) => normalizujNazwePrzystanku(kolumna.querySelector('h2')?.textContent.replace(/^Kierunek:\s*/i, '') || '') === kierunek);
	const kluczTrasy = pobierzKluczTrasyDlaKierunku(numerLinii, kierunek);
	const daneTrasy = kierunki?.[kluczTrasy];
	kontener.dataset.trasa = kluczTrasy || '';

	if (!daneTrasy) {
		console.warn(`Brak trasy dla linii ${numerLinii} i kierunku ${kierunek}`);
		return;
	}
	const dostepneSegmentyKoncowe = pobierzDostepneSegmentyKoncowe(daneTrasy, przystanek, kierunek);
	const wybranoKontekstTrasy = Object.keys(opcjeTrasy).length > 0;
	const opcjeAktywnejTrasy = wybranoKontekstTrasy
		? opcjeTrasy
		: dostepneSegmentyKoncowe ? { segmentyKoncowe: dostepneSegmentyKoncowe } : {};

	const trasa = zbudujTraseKierunku(daneTrasy, {
		przystanekPoczatkowy: przystanek
	});
	const indeksWybranegoPrzystanku = trasa.findIndex((element) =>
		normalizujNazwePrzystanku(element.nazwa) === normalizujNazwePrzystanku(przystanek)
	);
	const trasaOdWybranegoPrzystanku = indeksWybranegoPrzystanku < 0
		? trasa
		: trasa.slice(indeksWybranegoPrzystanku);

	const daneKierunkuOdjazdow = pobierzDaneKierunkuOdjazdow(numerLinii, kierunek);
	const dni = pobierzListeDni(daneKierunkuOdjazdow);
	const odjazdy = dni.flatMap((dzien) => pobierzOdjazdyDlaPrzystanku({
		numerLinii,
		kierunek,
		przystanek,
		dzien,
		segmenty: daneTrasy
	}));
	const odjazdyDlaWybranejTrasy = filtrujOdjazdyWedlugWybranejTrasy(
		odjazdy,
		daneTrasy,
		przystanek,
		wybranoKontekstTrasy ? opcjeAktywnejTrasy : {},
		kierunek
	);
	const tabelaOdjazdow = kontener.querySelector('table.rozklad_miejskie, table.rozklad_nocne, table.rozklad_podmiejskie, table.rozklad_pospieszne, table.rozklad_specjalne');
	if (!tabelaOdjazdow) return;

	const godziny = czyLiniaNocna(kontener)
		? [23, 0, 1, 2, 3, 4, 5]
		: Array.from({ length: 19 }, (_, indeks) => indeks + 5);
	ustawNaglowkiGodzin(tabelaOdjazdow, godziny);
	generujWierszeOdjazdow(tabelaOdjazdow, odjazdyDlaWybranejTrasy, dni, godziny);
	generujObjasnienia(
		tabelaOdjazdow,
		odjazdyDlaWybranejTrasy,
		daneKierunkuOdjazdow?.objasnienia,
		daneKierunkuOdjazdow?.dodatkoweInformacje
	);
	generujTabeleTrasy(kontener, daneTrasy, normalizujNazwePrzystanku(przystanek), opcjeAktywnejTrasy, kierunek);
	/* DEBUG: odkomentuj poniższą linię, aby włączyć informacje diagnostyczne w konsoli. */
	 console.info('Przygotowana trasa i odjazdy:', {
		numerLinii,
		przystanek,
		kierunek,
		trasa: trasaOdWybranegoPrzystanku,
		odjazdy
	}); 
}

function zamienOznaczenieNaCzerwone(root, wyrazenie) {
	[...root.childNodes]
	.filter((wezel) => wezel.nodeType === Node.TEXT_NODE)
	.forEach((wezelTekstowy) => {
		const tekst = wezelTekstowy.nodeValue;
		const flags = wyrazenie.flags.includes('g') ? wyrazenie.flags : `${wyrazenie.flags}g`;
		const regex = new RegExp(wyrazenie.source, flags);
		if (!regex.test(tekst)) return;
		regex.lastIndex = 0;

		const fragment = document.createDocumentFragment();
		let ostatniIndeks = 0;
		let dopasowanie;
		while ((dopasowanie = regex.exec(tekst))) {
			fragment.append(tekst.slice(ostatniIndeks, dopasowanie.index));
			const oznaczenie = document.createElement('span');
			oznaczenie.className = 'red-text';
			oznaczenie.textContent = dopasowanie[0];
			fragment.append(oznaczenie);
			ostatniIndeks = dopasowanie.index + dopasowanie[0].length;
		}
		fragment.append(tekst.slice(ostatniIndeks));
		wezelTekstowy.replaceWith(fragment);
	});
}

function pokolorujOznaczeniaPrzystanku(przystanek) {
	const link = przystanek.querySelector(':scope > a');
	if (link) {
		zamienOznaczenieNaCzerwone(link, /nż/gi);
		zamienOznaczenieNaCzerwone(link, /^\s*-\s*/g);
	} else {
		zamienOznaczenieNaCzerwone(przystanek, /nż/gi);
	}

	/* Końcowy myślnik może znajdować się poza linkiem, ale tylko na początku li. */
	zamienOznaczenieNaCzerwone(przystanek, /^\s*-\s*/g);
	[...przystanek.children]
		.filter((element) => !element.classList.contains('red-text') && /^\s*-\s*$/.test(element.textContent))
		.forEach((element) => element.classList.add('red-text'));
}

function ukryjIdPrzystanku(element) {
	/* Nie nadpisuj poprawnego ID nazwą z już oczyszczonego tekstu. */
	if (!element.dataset.nazwaWewnetrzna) {
		element.dataset.nazwaWewnetrzna = normalizujNazwePrzystanku(element.textContent);
	}
	const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
	const wezly = [];
	let wezel;
	while ((wezel = walker.nextNode())) wezly.push(wezel);
	wezly.forEach((wezelTekstowy) => {
		wezelTekstowy.nodeValue = wezelTekstowy.nodeValue.replace(/\s\d{2}(?=\s*$)/, '');
	});
}

function ustawObslugePrzystankow() {
	const tabliczka = document.querySelector('.tables-container');
	if (!tabliczka) return;

	document.querySelectorAll('.div_kierunki .kierunek-kolumna').forEach((kolumna) => {
		const naglowek = kolumna.querySelector('h2');
		const kierunek = normalizujNazwePrzystanku(naglowek?.textContent.replace(/^Kierunek:\s*/i, '') || '');

		kolumna.querySelectorAll('li').forEach((przystanek) => {
			pokolorujOznaczeniaPrzystanku(przystanek);

			/* Terminal może być zapisany bez <a>, więc klasyfikujemy go przed obsługą kliknięcia. */
			const jestKoncowy = /^\s*-\s*/.test(przystanek.textContent);
			if (jestKoncowy) {
				przystanek.classList.add('przystanek-koncowy');
			}

			const naZadanie = /nż/i.test(przystanek.textContent);
			if (naZadanie) {
				przystanek.classList.add('przystanek-na-zadanie');
			}
			ukryjIdPrzystanku(przystanek);
			const nazwa = przystanek.dataset.nazwaWewnetrzna || normalizujNazwePrzystanku(przystanek.textContent);
			const numerLinii = pobierzNumerLinii();
			const segmentyPrzystanku = TRASY[numerLinii]?.[pobierzKluczTrasyDlaKierunku(numerLinii, kierunek)];
			if (jestKoncowy && !czyPrzystanekMaWymuszonyKlik(segmentyPrzystanku, nazwa)) return;

			przystanek.classList.add('przystanek-klikalny');
			przystanek.onclick = () => {
				document.querySelector('.div_kierunki').style.display = 'none';
				tabliczka.style.display = 'block';
				const segmenty = TRASY[numerLinii]?.[pobierzKluczTrasyDlaKierunku(numerLinii, kierunek)];
				const segmentyKoncowe = segmenty
					? pobierzSegmentyKoncoweZElementu(przystanek, segmenty)
					: null;
				const podstawowySegment = segmenty && Object.keys(segmenty)
					.find((nazwaSegmentu) => nazwaSegmentu.startsWith('do'));
				const poOdgal =
					!segmentyKoncowe && przystanek.previousElementSibling?.tagName === 'UL';
				const opcjeTrasy = segmentyKoncowe
					? { segmentyKoncowe }
					: poOdgal && podstawowySegment
						? { segmentKoncowy: podstawowySegment }
						: {};
				przygotujTabliczke(
					nazwa,
					kierunek,
					tabliczka,
					naZadanie,
					opcjeTrasy
				);
			};
		});
	});
}





/* Skrypt do generowania kresek na trasie linii */
function ustawDlugoscLinii() {
	/* Wyznacz początki i końce ciągłych grup objazdowych zapisanych na li. */
	document.querySelectorAll('.lista-przystankow, .lista-przystankow ul').forEach((lista) => {
		const elementy = [...lista.children];
		elementy.forEach((element) => element.classList.remove('objazd-start', 'objazd-koniec'));
		let grupa = [];
		const zapiszGrupe = () => {
			if (grupa.length > 1) {
				grupa[0].classList.add('objazd-start');
				grupa.at(-1).classList.add('objazd-koniec');
			}
			grupa = [];
		};
		elementy.forEach((element) => {
			if (element.matches('li.objazd-text')) grupa.push(element);
			else zapiszGrupe();
		});
		zapiszGrupe();
	});

	document.querySelectorAll('.objazd-start').forEach((start) => {
		const end = start.parentElement?.querySelector(':scope > .objazd-koniec');
		if (!end) return;

		let trasa = start.parentElement;
		while (trasa && !trasa.contains(end)) trasa = trasa.parentElement;
		if (!trasa) return;
		trasa.classList.add('objazd-aktywny');

		const trasaRect = trasa.getBoundingClientRect();
		const center = (element) => {
			const rect = element.getBoundingClientRect();
			return rect.top + rect.height / 2 - trasaRect.top;
		};

		trasa.style.setProperty('--objazd-linia-top', `${center(start) - 2}px`);
		trasa.style.setProperty('--objazd-linia-bottom', `${trasaRect.height - center(end) - 2}px`);
	});

	document.querySelectorAll('.lista-przystankow').forEach((lista) => {
		const start = lista.querySelector('[data-glowna-start]');
		const end = lista.querySelector('[data-glowna-koniec]');
		if (!start || !end) return;

		const listaTop = lista.getBoundingClientRect().top;
		const center = (element) => {
			const rect = element.getBoundingClientRect();
			return rect.top + rect.height / 2 - listaTop;
		};

		lista.style.setProperty('--glowna-linia-top', `${center(start) - 2}px`);
		lista.style.setProperty('--glowna-linia-bottom', `${lista.getBoundingClientRect().height - center(end) - 2}px`);
	});
	document.querySelectorAll('.lista-przystankow ul').forEach((wariant) => {
		const start = wariant.querySelector(':scope > li[data-wariant-start]');
		const end = wariant.querySelector(':scope > li[data-wariant-koniec]');
		if (!start || !end) return;

		const wariantTop = wariant.getBoundingClientRect().top;
		const center = (element) => {
			const rect = element.getBoundingClientRect();
			return rect.top + rect.height / 2 - wariantTop;
		};

		wariant.style.setProperty('--wariant-linia-top', `${center(start)}px`);
		wariant.style.setProperty('--wariant-linia-bottom', `${wariant.getBoundingClientRect().height - center(end)}px`);
	});
}

function ustawKolorLinii() {
	const plik = window.location.pathname.split('/').pop();
	const linkLinii = document.querySelector(`.div_wybor_linii a[href="${plik}"]`);
	if (!linkLinii) return;

	const kategorie = [
		['linia_miejska', '--linia_miejska-border-color', '--rozklad_miejskie_th-background-color'],
		['linia_podmiejska', '--linia_podmiejska-border-color', '--rozklad_podmiejskie_th-background-color'],
		['linia_pospieszna', '--linia_pospieszna-border-color', '--rozklad_pospieszne_th-background-color'],
		['linia_nocna', '--linia_nocna-border-color', '--rozklad_nocne_th-background-color'],
		['linia_specjalna', '--linia_specjalna-border-color', '--rozklad_specjalne_th-background-color']
	];
	const kategoria = kategorie.find(([klasa]) => linkLinii.classList.contains(klasa));
	if (!kategoria) return;

	document.documentElement.style.setProperty('--kolor-linii-glowna', `var(${kategoria[1]})`);
	document.documentElement.style.setProperty('--kolor-linii-wariant', `var(${kategoria[2]})`);
}

function uruchomObslugeRozkladu() {
	ustawObslugePrzystankow();
	ustawDlugoscLinii();
	ustawKolorLinii();
}

daneRozkladowPromise
	.then(() => {
		if (document.readyState === 'loading') {
			document.addEventListener('DOMContentLoaded', uruchomObslugeRozkladu, { once: true });
		} else {
			uruchomObslugeRozkladu();
		}
	})
	.catch((blad) => console.error(blad));





/* Dymek */
function pobierzDymek() {
	let dymek = document.getElementById('dymek');
	if (!dymek) {
		dymek = document.createElement('div');
		dymek.id = 'dymek';
		document.body.appendChild(dymek);
	}
	return dymek;
}

function ukryjDymek() {
	const dymek = document.getElementById('dymek');
	if (dymek) dymek.style.display = 'none';
}

function pobierzCzasNastepnegoPrzystanku(trasa, indeks) {
	return pobierzCzasOdcinka(trasa, indeks);
}

function pobierzCzasOdcinka(trasa, indeks) {
	const element = trasa[indeks];
	const nastepny = trasa[indeks + 1];
	if (!element || !nastepny) return null;

	const elementJestWariantem = element.segmentTrasy?.startsWith('wariant');
	const nastepnyJestWariantem = nastepny.segmentTrasy?.startsWith('wariant');
	if (!elementJestWariantem && nastepnyJestWariantem) {
		return nastepny.czasOdPoprzedniego ?? element.czasDoNastepnego ?? null;
	}
	if (elementJestWariantem && !nastepnyJestWariantem) {
		return nastepny.czasOdPoprzedniego ?? element.czasDoNastepnego ?? null;
	}
	return nastepny.czasOdPoprzedniego ?? element.czasDoNastepnego ?? null;
}

function usunPowtorzonePrzystanki(trasa) {
	return trasa.reduce((wynik, element) => {
		const poprzedni = wynik.at(-1);
		if (poprzedni && normalizujNazwePrzystanku(poprzedni.nazwa) === normalizujNazwePrzystanku(element.nazwa)) {
			wynik[wynik.length - 1] = {
				...poprzedni,
				czasDoNastepnego: element.czasDoNastepnego ?? poprzedni.czasDoNastepnego,
				opcje: element.opcje || poprzedni.opcje
			};
			return wynik;
		}
		wynik.push(element);
		return wynik;
	}, []);
}

function ustawNazweDymku(element, koncowy, kontener, wczesniejszy = false) {
	const nazwa = escapeHtml(pobierzNazweWyswietlana(element.nazwa));
	const klasyNazwy = ['dymek-nazwa'];
	if (wczesniejszy) klasyNazwy.push('dymek-wczesniejszy');
	if (czyPrzystanekObjazdowy(element.nazwa, kontener)) klasyNazwy.push('objazd-text');
	const minus = koncowy ? '<span class="red-text"> - </span>' : '';
	const nz = element.opcje?.nz ? ' <span class="red-text">nż</span>' : '';
	return `${minus}<span class="${klasyNazwy.join(' ')}">${nazwa}${nz}</span>`;
}

function wyswietlDymekZBazy(komorka, event) {
	const kontener = komorka.closest('.tables-container');
	const numerLinii = pobierzNumerLinii();
	const routeKey = kontener?.dataset.trasa;
	const segmenty = TRASY[numerLinii]?.[routeKey];
	if (!kontener || !segmenty) return;

	const segmentWariantu = komorka.dataset.wariant || null;
	const trasa = zastosujIgnorowanePrzystanki(usunPowtorzonePrzystanki(zbudujTraseKierunku(segmenty, {
		przystanekPoczatkowy: komorka.dataset.przystanekBazowy,
		segmentPoczatkowy: komorka.dataset.segmentPoczatkowy || null,
		segmentKoncowy: segmentWariantu,
		warianty: segmentWariantu?.startsWith('wariant') ? [segmentWariantu] : []
	})), komorka.dataset.dzien);
	const przystanek = normalizujNazwePrzystanku(kontener.dataset.przystanek || '');
	const indeksStartowy = trasa.findIndex((element) =>
		czyWybranyPrzystanekPasuje(element.nazwa, przystanek)
	);
	if (indeksStartowy < 0) return;

	const dymek = pobierzDymek();
	const wysokoscDokumentu = Math.max(
		document.documentElement.scrollHeight,
		document.body?.scrollHeight || 0
	);
	const czasy = [];
	czasy[indeksStartowy] = Number(komorka.dataset.godzina) * 60 + Number(komorka.dataset.minuta);
	for (let indeks = indeksStartowy - 1; indeks >= 0; indeks--) {
		const czasOdcinka = pobierzCzasNastepnegoPrzystanku(trasa, indeks);
		czasy[indeks] = czasy[indeks + 1] - (czasOdcinka == null ? 0 : Number(czasOdcinka));
	}
	for (let indeks = indeksStartowy + 1; indeks < trasa.length; indeks++) {
		const czasOdcinka = pobierzCzasNastepnegoPrzystanku(trasa, indeks - 1);
		czasy[indeks] = czasy[indeks - 1] + (czasOdcinka == null ? 0 : Number(czasOdcinka));
	}

	const wiersze = [];
	for (let indeks = 0; indeks < trasa.length; indeks++) {
		const element = trasa[indeks];
		const czas = ((czasy[indeks] % 1440) + 1440) % 1440;
		const klasaCzasu = indeks < indeksStartowy ? ' class="dymek-wczesniejszy"' : '';
		wiersze.push(`<b${klasaCzasu}>${String(Math.floor(czas / 60))}:${String(czas % 60).padStart(2, '0')} </b>${ustawNazweDymku(element, indeks === trasa.length - 1, kontener, indeks < indeksStartowy)}`);
	}

	dymek.innerHTML = wiersze.join('<br>');
	dymek.style.display = 'block';
	const rect = (event.currentTarget || komorka).getBoundingClientRect();
	const lewaKrawedz = rect.left + window.scrollX + 43;
	const domyslnaGornaKrawedz = rect.top + window.scrollY + 25;
	const marginesDolu = 5;
	const domyslnaDolnaKrawedz = domyslnaGornaKrawedz + dymek.offsetHeight;
	const gornaKrawedz = domyslnaDolnaKrawedz > wysokoscDokumentu
		? Math.max(marginesDolu, wysokoscDokumentu - dymek.offsetHeight - marginesDolu)
		: domyslnaGornaKrawedz;

	dymek.style.left = `${lewaKrawedz}px`;
	dymek.style.top = `${gornaKrawedz}px`;

	const ramka = komorka.closest('table')?.querySelector('.ramka_miejskie, .ramka_podmiejskie, .ramka_pospieszne, .ramka_nocne, .ramka_specjalne');
	if (ramka) dymek.style.borderColor = getComputedStyle(ramka).borderColor;
}

function wyswietldymek(h,m,typ,event) {
	// h = godzina; m = minuta; typ = typ kursu; i_p = ilosc przystanków
	// xa_1 = trasa wariantowa
	// a = trasa do celu z pierwszego przystanku ; b = trasa powrotna

	var i_p = 0;
	var offset = 0;
	// ---Linia 1---
	if (typ == '1a') i_p = 21;
	if (typ == '1a_1') {i_p = 12; offset = 20;}
	if (typ == '1b') {i_p = 24; offset = 50;}
	if (typ == '1b_1') {i_p = 15; offset = 75;}
	// ---Linia 2---
	if (typ == '2a') {i_p = 17; offset = 8;} //chelmoniewo - strefa
	if (typ == '2a_1') {i_p = 20; offset = 5;} //dzierzecino - strefa
	if (typ == '2a_2') i_p = 25; //lubiatowo - strefa
	if (typ == '2a_3') {i_p = 19; offset = 30;} //sianowska - strefa
	if (typ == '2b_13') {i_p = 2; offset = 30}; //sianowska - hospicjum
	if (typ == '2a_4') {i_p = 20; offset = 55;} //hospicjum - strefa
	if (typ == '2a_5') {i_p = 12; offset = 8;}   //chelmoniewo - laksa
	if (typ == '2a_6') {i_p = 15; offset = 5;} //dzierzecino - laksa
	if (typ == '2a_7') i_p = 20; //lubiatowo - laksa
	if (typ == '2a_8') {i_p = 10; offset = 8;}   //chelmoniewo - pkp
	if (typ == '2a_9') {i_p = 13; offset = 5;} //dzierzecino - pkp
	if (typ == '2a_10') i_p = 18; //lubiatowo - pkp
	if (typ == '2a_11') {i_p = 15; offset = 55;} //hospicjum - laksa
	if (typ == '2b') {i_p = 18; offset = 100}; //strefa - chelmoniewo
	if (typ == '2b_1') {i_p = 21; offset = 100}; //strefa - dzierzecino
	if (typ == '2b_2') {i_p = 26; offset = 100}; //strefa - lubiatowo
	if (typ == '2b_3') {i_p = 20; offset = 150}; //strefa - sianowska
	if (typ == '2b_4') {i_p = 21; offset = 150}; //strefa - hospicjum
	if (typ == '2b_5') {i_p = 13; offset = 105};   //laksa - chelmoniewo
	if (typ == '2b_6') {i_p = 16; offset = 105}; //laksa - dzierzecino
	if (typ == '2b_7') {i_p = 21; offset = 105}; //laksa - lubiatowo
	if (typ == '2b_8') {i_p = 15; offset = 155}; //laksa - sianowska
	if (typ == '2b_9') {i_p = 16; offset = 155}; //laksa - hospicjum
	if (typ == '2b_10') {i_p = 25; offset = 200};   //strefa - sianowska p Dzierzecino
	if (typ == '2b_11') {i_p = 20; offset = 205}; //laksa - sianowska p Dzierzecino
	if (typ == '2b_12') {i_p = 5; offset = 220}; //dzierżęcino - sianowska p Dzierzecino
	if (typ == '2b_14') {i_p = 11; offset = 250}; //pkp - chelmoniewo
	if (typ == '2b_15') {i_p = 14; offset = 250}; //pkp - dzierzecino
	if (typ == '2b_16') {i_p = 19; offset = 250}; //pkp - lubiatowo
	if (typ == '2b_17') {i_p = 14; offset = 280}; //pkp - hospicjum
	// ---Linia 4---
	if (typ == '4a') i_p = 23;
	if (typ == '4a_1') {i_p = 24; offset = 23};
	if (typ == '4b') {i_p = 22; offset = 50};
	if (typ == '4b_1') {i_p = 23; offset = 72};
	// ---Linia 5---
	if (typ == '5a') i_p = 19;
	if (typ == '5b') {i_p = 19; offset = 20};
	// ---Linia 6---
	if (typ == '6a') i_p = 17; //ue - pkp
	if (typ == '6a_1') i_p = 24; // ue - strefa
	if (typ == '6a_2') {i_p = 25; offset = 30;} // jamno - pkp
	if (typ == '6a_3') {i_p = 32; offset = 30;} // jamno - strefa
	if (typ == '6a_4') {i_p = 24; offset = 150;} // N jamno - pkp
	if (typ == '6a_5') {i_p = 31; offset = 150;} // N jamno - strefa
	if (typ == '6a_6') {i_p = 18; offset = 37;} // big - pkp
	if (typ == '6a_7') {i_p = 25; offset = 37;} // big - strefa
	if (typ == '6a_8') {i_p = 9; offset = 8;} // wawozowa - pkp
	if (typ == '6a_9') {i_p = 16; offset = 8;} // wawozowa - strefa
	if (typ == '6a_10') {i_p = 20; offset = 30;} // jamno - wankowicza
	if (typ == '6a_11') {i_p = 19; offset = 150;} // N jamno - wankowicza
	if (typ == '6a_12') {i_p = 13; offset = 37;} // big - wankowicza
	if (typ == '6a_13') {i_p = 4; offset = 46;} // wawozowa - wankowicza
	if (typ == '6b') {i_p = 15; offset = 70;} //pkp - ue
	if (typ == '6b_1') {i_p = 17; offset = 70;} // pkp - big
	if (typ == '6b_2') {i_p = 23; offset = 70;} // pkp - jamno
	if (typ == '6b_3') {i_p = 22; offset = 200;} // N pkp - jamno
	if (typ == '6b_4') {i_p = 8; offset = 70;} // pkp - wawozowa
	if (typ == '6b_5') {i_p = 22; offset = 100;} // strefa - ue
	if (typ == '6b_6') {i_p = 24; offset = 100;} // strefa - big
	if (typ == '6b_7') {i_p = 30; offset = 100;} // strefa - jamno
	if (typ == '6b_8') {i_p = 29; offset = 230;} // N strefa - jamno
	// ---Linia 8---
	if (typ == '8a') i_p = 20;
	if (typ == '8b') {i_p = 20; offset = 20};
	// ---Linia 9---
	if (typ == '9a') i_p = 19; //lasem - dzialki
	if (typ == '9a_1') {i_p = 18; offset = 30}; //lasem - bukowe
	if (typ == '9a_2') {i_p = 15; offset = 60}; //sloneczna - dzialki
	if (typ == '9a_3') {i_p = 14; offset = 80}; //sloneczna - bukowe
	if (typ == '9b') {i_p = 21; offset = 100}; //dzialki - lasem
	if (typ == '9b_1') {i_p = 16; offset = 100}; //dzialki - szpital
	if (typ == '9b_2') {i_p = 20; offset = 130}; //bukowe - lasem
	if (typ == '9b_3') {i_p = 15; offset = 130}; //bukowe - szpital
	// ---Linia 12---
	if (typ == '12a') i_p = 29;
	if (typ == '12a_1') i_p = 32;
	if (typ == '12b') {i_p = 29; offset = 54};
	if (typ == '12b_1') {i_p = 33; offset = 50};
	// ---Linia 13---
	if (typ == '13a') i_p = 26;
	if (typ == '13a_1') i_p = 17;
	if (typ == '13b') {i_p = 29; offset = 50};
	if (typ == '13b_1') {i_p = 17; offset = 62};
	// ---Linia 14---
	if (typ == '14a') i_p = 20;
	if (typ == '14b') {i_p = 20; offset = 30};
	if (typ == '14b_1') {i_p = 22; offset = 60};
	// ---Linia 15---
	if (typ == '15a') i_p = 26;
	if (typ == '15b') {i_p = 26; offset = 50};
	// ---Linia 16---
	if (typ == '16a') i_p = 25;
	if (typ == '16b') {i_p = 27; offset = 30};
	// ---Linia 23---
	if (typ == '23a') i_p = 20;
	if (typ == '23a_1') i_p = 18;
	if (typ == '23b') {i_p = 20; offset = 20};
	if (typ == '23b_1') {i_p = 19; offset = 40};
	if (typ == '23b_2') {i_p = 13; offset = 20}; // wies - biblioteka
	if (typ == '23b_3') {i_p = 12; offset = 40}; // dzialki - biblioteka
	// ---Linia 29---
	if (typ == '29a') i_p = 17; // czarnowo
	if (typ == '29a_1') {i_p = 17; offset = 17;} // celinki
	if (typ == '29a_2') {i_p = 12; offset = 17;} // bartoszewo rolna
	if (typ == '29b') {i_p = 17; offset = 34;} // z czarnowa
	if (typ == '29b_1') {i_p = 17; offset = 70;} // z celinek
	if (typ == '29b_2') {i_p = 10; offset = 120;} // z celinek bezpośredni
	// ---Linia 37---
	if (typ == '37a') {i_p = 22; offset = 50};
	if (typ == '37a_1') i_p = 27;
	if (typ == '37b') {i_p = 24; offset = 150};
	if (typ == '37b_1') {i_p = 29; offset = 100};
	// ---Linia 38---
	if (typ == '38a') i_p = 26;
	if (typ == '38b') {i_p = 27; offset = 50};
	// ---Linia 40---
	if (typ == '40a') {i_p = 28; offset = 11}; // polnoc - bukowe
	if (typ == '40a_1') i_p = 39; // lubelskiej - bukowe
	if (typ == '40b') {i_p = 27; offset = 39}; // bukowe - polnoc
	if (typ == '40b_1') {i_p = 38; offset = 39}; // bukowe - lubelskiej
	// ---Linia 44---
	if (typ == '44a') i_p = 22;
	if (typ == '44a_1') {i_p = 30; offset=-8;}
	if (typ == '44b') {i_p = 21; offset = 25};
	if (typ == '44b_1') {i_p = 28; offset = 25};
	// ---Linia 51---
	if (typ == '51a') i_p = 25;
	if (typ == '51b') {i_p = 25; offset = 50};
	// ---Linia 1S---
	if (typ == '1Sa') i_p = 3;
	if (typ == '1Sa_1') {i_p = 2; offset = 1};
	if (typ == '1Sb') {i_p = 2; offset = 5};
	if (typ == '1Sb_1') {i_p = 2; offset = 10};


	// ---Pobieranie danych----------
	tablica_przystanki=[];
	tablica_minuty=[];
	for(var i = 0 + offset; i < i_p+offset; i++) {
		//console.log(i);
		if (i <= i_p-2+offset) tablica_przystanki[i]=document.getElementById("pr"+i).innerText;
		if (i == i_p-1+offset) tablica_przystanki[i]=document.getElementById("pr"+i+"_end").innerText;
	}
	//console.log(tablica_przystanki);
	i = 0;
	
	for(i = 0 + offset; i < i_p-1+offset; i++) {
		if (i <= i_p-3+offset) tablica_minuty[i]=document.getElementById("mi"+i).innerText;
		if (i == i_p-2+offset) tablica_minuty[i]=document.getElementById("mi"+i+"_end").innerText;
	}
	//console.log(tablica_minuty);
	i = 0;
	
	
	// działanie dymka, wyświetlenie
	//dymek statyczny
	var dymek = document.getElementById('dymek');
	dymek.style.display="block";
	var element = event.target;
	var rect = element.getBoundingClientRect();
	var x = rect.left+window.scrollX;
	var y = rect.top+window.scrollY;
	//console.log(x,y)
	document.getElementById("dymek").style.left=x+43+"px";
	document.getElementById("dymek").style.top=y+25+"px";
	//dymek dynamiczny
	/*document.addEventListener('mousemove', (event) => {
	var x = event.pageX;
    var y = event.pageY;
	document.getElementById("dymek").style.left=x+"px";
	document.getElementById("dymek").style.top=y+"px";
	 });*/
	
	
	dymek.innerHTML = "<b>" + h + ":" + (m < 10 ? "0" + m : m) + " </b>" + pobierzNazwePrzystanku(0 + offset, false) + "<br>";
	for (let i = 1+offset; i < i_p+offset; i++) {
		let czas_przejazdu = parseInt(tablica_minuty[i-1]); // Pobierz czas przejazdu między przystankami
		m += czas_przejazdu; // Dodaj czas przejazdu do bieżącej minuty
		
		// Obsłuż przekroczenie 60 minut
		if (m >= 60) {
			h += Math.floor(m / 60); // Dodaj odpowiednią ilość godzin
			m = m % 60;             // Oblicz pozostałe minuty
		}
		if (h > 23) h = 0; // Zmiana godziny 24 -> 0
		// Dodaj dane do "dymka"
		// Czy to ostatni przystanek wybranego wariantu?
		let koncowy = (i == i_p + offset - 1);
		dymek.innerHTML += "<b>" + h + ":" + (m < 10 ? "0" + m : m) + " </b>" + pobierzNazwePrzystanku(i, koncowy) + "<br>";
		//console.log(dymek);
	}
	//kolorowanie nż i - i border dymku
    dymek.innerHTML = dymek.innerHTML.replace(/(<[^>]+>)|(\bnż\b)|(-)/g, function(match, tag) {
        if (tag) return tag;
        return '<span class="red-text">' + match + '</span>';
    });
	//kolorowanie ramki przez border numeru linii
	const ramka = event.target.closest("table")?.querySelector(".ramka_miejskie, .ramka_podmiejskie, .ramka_pospieszne, .ramka_nocne, .ramka_specjalne");
	if (ramka) dymek.style.borderColor = getComputedStyle(ramka).borderColor;


//funkcja pomocnicza do kolorowania i kolorowanie objazdu
function pobierzNazwePrzystanku(i, koncowy = false) {
    let przystanek;

    if (koncowy) {
        przystanek = document.getElementById("pr" + i + "_end");
        if (!przystanek) {przystanek = document.getElementById("pr" + i);}
    } else {
        przystanek = document.getElementById("pr" + i);
    }
	
    if (!przystanek) return "";
    
    let nazwa = przystanek.innerHTML; // Kopia zawartości przystanku

    // Usunięcie technicznych spanów z margin-left
    nazwa = nazwa.replace(/<span\s+style=["'][^"']*margin-left\s*:[^"']*["']>\s*<\/span>/gi,"");

    // Jeżeli <tr> ma objazd, obejmij nazwę dodatkowym spanem
    if (przystanek.parentElement.classList.contains("objazd-text")) nazwa = '<span class="objazd-text">' + nazwa + '</span>';

    return nazwa;
}
}
