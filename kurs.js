function wyswietldymek(h,m,typ,event) {
	// h = godzina; m = minuta; typ = typ kursu; i_p = ilosc przystanków
	// 0 = trasa podstawowa ; 1 = trasa wariantowa
	// a = trasa do celu z pierwszego przystanku ; b = trasa powrotna

	var i_p = 0;
	var offset = 0;
	// ---Linia 2---------
	if (typ == '2a') i_p = 19;
	if (typ == '2a_1') i_p = 24;
	if (typ == '2b') {i_p = 21; offset = 28};
	if (typ == '2b_1') {i_p = 26; offset= 23};
	// ---Linia 4---------	
	if (typ == '4a') i_p = 13;
	if (typ == '4b') i_p = 16;
	// ---Linia 5---------
	if (typ == '5a') i_p = 22;
	if (typ == '5a_1') i_p = 25;
	if (typ == '5b') i_p = 22;
	if (typ == '5b_1') i_p = 24;
	// ---Linia 7---------
	if (typ == '7a') i_p = 20; // centrum handlowe
	if (typ == '7a_1') i_p = 18; // dworzec pkp
	if (typ == '7a_2') i_p = 25; // strefa ekonomiczna
	if (typ == '7b') i_p = 20; // z centrum handlowe
	if (typ == '7b_1') i_p = 20; // z dworca pkp
	if (typ == '7b_2') i_p = 25; // z strefa ekonomiczna
	// ---Linia 11---------
	if (typ == '11a') i_p = 17; // czarnowo
	if (typ == '11a_1') i_p = 17; // celinki
	if (typ == '11a_2') i_p = 12; // bartoszewo rolna
	if (typ == '11b') i_p = 17; // z czarnowa
	if (typ == '11b_1') i_p = 19; // z celinek


	// ---Pobieranie danych----------
	tablica_przystanki=[];
	tablica_minuty=[];
	for(var i = 0 + offset; i < i_p+offset; i++) {
		if (i<=i_p-2+offset) tablica_przystanki[i]=document.getElementById("pr"+i).innerText;
		if (i == i_p-1+offset) tablica_przystanki[i]=document.getElementById("pr"+i+"_end").innerText;
	}
	//console.log(tablica_przystanki);
	i = 0;
	
	for(i = 0 + offset; i < i_p-1+offset; i++) {
		tablica_minuty[i]=document.getElementById("mi"+i).innerText;
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
	//console.log(dymek);
	for (let i = 1+offset; i < i_p+offset; i++) {
    // Pobierz czas przejazdu między przystankami
    let czas_przejazdu = parseInt(tablica_minuty[i-1]);
    
    // Dodaj czas przejazdu do bieżącej minuty
    m += czas_przejazdu;

    // Obsłuż przekroczenie 60 minut
    if (m >= 60) {
        h += Math.floor(m / 60); // Dodaj odpowiednią ilość godzin
        m = m % 60;             // Oblicz pozostałe minuty
    }
    // Dodaj dane do "dymka"
    dymek.innerHTML += "<b>" + h + ":" + (m < 10 ? "0" + m : m) + " </b>" + tablica_przystanki[i] + "<br>";
	//console.log(dymek);
	}
	
	//kolorowanie nż i -
    const updatedContent = dymek.innerHTML.replace(/(nż|-)/g, '<span class="red-text">$1</span>');
    dymek.innerHTML = updatedContent;
}