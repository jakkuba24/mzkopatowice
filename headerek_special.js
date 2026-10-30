document.querySelector('header').insertAdjacentHTML('beforeend', `
    <a href="index.html">Strona główna</a>
    <a href="changelog.html">Historia</a>
    <img src="css/dark.png" style="filter: invert(1)"><input type="checkbox" role="switch" id="zmianaMotywu" onclick="ZmienMotyw()"><img src="css/light.png">
`);
document.querySelector('header').insertAdjacentHTML('afterend', `
    <div>
        <h2 style="color: red; text-align: center; margin-bottom:0">Rozkłady jazdy obowiązujące 31 października i 1 listopada 2026 roku</h2>
        <a href="index.html"><img src="zdjecia/mzk1.png" alt="Logo MZK" class="logo" style="float:left"></a>
        <div class="div_wybor_linii">
            <a href="linia_2ws.html" class="linia_miejska">2</a>
            <a href="linia_4ws.html" class="linia_miejska">4</a>
            <a href="linia_6ws.html" class="linia_miejska">6</a>
            <a href="linia_8ws.html" class="linia_miejska">8</a>
            <a href="linia_12ws.html" class="linia_miejska">12</a>
            <a href="linia_13ws.html" class="linia_miejska">13</a>
            <a href="linia_14ws.html" class="linia_miejska">14</a>
            <a href="linia_16ws.html" class="linia_miejska">16</a>
            <a href="linia_23ws.html" class="linia_podmiejska">23</a>
            <a href="linia_25ws.html" class="linia_podmiejska">25</a>
            <a href="linia_29ws.html" class="linia_podmiejska">29</a>
            <a href="linia_44ws.html" class="linia_nocna">44</a>
            <a href="linia_53ws.html" class="linia_specjalna">53</a>
        </div>
    </div>
`);
przycisk_motyw();
