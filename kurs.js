function wyswietldymek(h,m,typ,event) {
	// h = godzina; m = minuta; typ = typ kursu; i_p = ilosc przystanków
	// xa_1 = trasa wariantowa
	// a = trasa do celu z pierwszego przystanku ; b = trasa powrotna

	var i_p = 0;
	var offset = 0;
	// ---Linia 1---
	if (typ == '1a') i_p = 17;
	if (typ == '1a_1') {i_p = 16; offset = 20;}
	if (typ == '1b') {i_p = 21; offset = 40;}
	if (typ == '1b_1') {i_p = 20; offset = 65;}
	// ---Linia 2---
	if (typ == '2a') i_p = 17;
	if (typ == '2a_1') i_p = 12;
	if (typ == '2b') {i_p = 18; offset = 17};
	if (typ == '2b_1') {i_p = 13; offset = 22};
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
	if (typ == '6a_1') {i_p = 18; offset = 30;} // big - pkp
	if (typ == '6a_2') i_p = 24; // ue - strefa
	if (typ == '6a_3') {i_p = 25; offset = 30;} // big - strefa
	if (typ == '6a_4') {i_p = 9; offset = 8;} // wawozowa - pkp
	if (typ == '6a_5') {i_p = 16; offset = 8;} // wawozowa - strefa
	if (typ == '6b') {i_p = 15; offset = 60;} //pkp - ue
	if (typ == '6b_1') {i_p = 17; offset = 60;} // pkp - big
	if (typ == '6b_2') {i_p = 22; offset = 80;} // strefa - ue
	if (typ == '6b_3') {i_p = 24; offset = 80;} // strefa - big
	if (typ == '6b_4') {i_p = 8; offset = 60;} // pkp - wawozowa
	// ---Linia 8---
	if (typ == '8a') i_p = 19;
	if (typ == '8b') {i_p = 20; offset = 20};
	// ---Linia 9---
	if (typ == '9a') i_p = 18;
	if (typ == '9a_1') i_p = 19;
	if (typ == '9b') {i_p = 19; offset = 40};
	if (typ == '9b_1') {i_p = 20; offset = 60};
	// ---Linia 11---
	if (typ == '11a') i_p = 23;
	if (typ == '11b') {i_p = 24; offset = 25};
	// ---Linia 16---
	if (typ == '16a') i_p = 25;
	if (typ == '16b') {i_p = 27; offset = 30};
	// ---Linia 23---
	if (typ == '23a') i_p = 16;
	if (typ == '23a_1') i_p = 14;
	if (typ == '23b') {i_p = 16; offset = 20};
	if (typ == '23b_1') {i_p = 15; offset = 40};
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
	if (typ == '37a') i_p = 25;
	if (typ == '37b') {i_p = 23; offset = 25};
	// ---Linia 40---
	if (typ == '40a') {i_p = 28; offset = 11}; // polnoc - bukowe
	if (typ == '40a_1') i_p = 39; // lubelskiej - bukowe
	if (typ == '40b') {i_p = 27; offset = 39}; // bukowe - polnoc
	if (typ == '40b_1') {i_p = 37; offset = 39}; // bukowe - lubelskiej
	// ---Linia 44---
	if (typ == '44a') i_p = 22;
	if (typ == '44a_1') {i_p = 30; offset=-8;}
	if (typ == '44b') {i_p = 21; offset = 25};
	if (typ == '44b_1') {i_p = 28; offset = 25};
/*

*/

	// ---Pobieranie danych----------
	tablica_przystanki=[];
	tablica_minuty=[];
	for(var i = 0 + offset; i < i_p+offset; i++) {
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
	
	
	dymek.innerHTML = "<b>"+h+":"+(m < 10 ? "0" + m : m)+" </b>"+tablica_przystanki[0+offset] + "<br>";
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
		dymek.innerHTML += "<b>" + h + ":" + (m < 10 ? "0" + m : m) + " </b>" + tablica_przystanki[i] + "<br>";
		//console.log(dymek);
	}
	
	//kolorowanie nż i -
    const updatedContent = dymek.innerHTML.replace(/(nż|-)/g, '<span class="red-text">$1</span>');
    dymek.innerHTML = updatedContent;
}