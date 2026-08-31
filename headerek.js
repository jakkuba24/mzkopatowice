const header = document.querySelector('header');

header.insertAdjacentHTML('beforeend', `
    <a href="index.html">Strona główna</a>
    <a href="changelog.html">Historia</a>
    <img src="css/dark.png" style="filter: invert(1)"><input type="checkbox" role="switch" id="zmianaMotywu" onclick="ZmienMotyw()"><img src="css/light.png">
`);

przycisk_motyw();

header.insertAdjacentHTML('afterend', `
    <div>
        <a href="index.html"><img src="zdjecia/mzk1.png" alt="Logo MZK" class="logo" style="float:left"></a>
        <div class="div_wybor_linii">
            <a href="linia_1.html" class="linia_miejska">1</a>
            <a href="linia_2.html" class="linia_miejska">2</a>
            <a href="linia_4.html" class="linia_miejska">4</a>
            <a href="linia_6.html" class="linia_miejska">6</a>
            <a href="linia_8.html" class="linia_miejska">8</a>
            <a href="linia_9o.html" class="linia_miejska objazd">9</a>
            <a href="linia_12.html" class="linia_miejska">12</a>
            <a href="linia_13.html" class="linia_miejska">13</a>
            <a href="linia_14.html" class="linia_miejska">14</a>
            <a href="linia_15.html" class="linia_miejska">15</a>
            <a href="linia_16.html" class="linia_miejska">16</a>
            <a href="linia_23o.html" class="linia_podmiejska objazd">23</a>
            <a href="linia_29.html" class="linia_podmiejska">29</a>
            <a href="linia_37.html" class="linia_pospieszna">37</a>
            <a href="linia_38.html" class="linia_pospieszna">38</a>
            <a href="linia_40o.html" class="linia_nocna objazd">40</a>
            <a href="linia_44.html" class="linia_nocna">44</a>
        </div>
    </div>
`);