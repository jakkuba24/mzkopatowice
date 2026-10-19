document.querySelector('header').insertAdjacentHTML('beforeend', `
    <a href="index.html">Strona główna</a>
    <a href="changelog.html">Historia</a>
    <img src="css/dark.png" style="filter: invert(1)"><input type="checkbox" role="switch" id="zmianaMotywu" onclick="ZmienMotyw()"><img src="css/light.png">
`);
document.querySelector('header').insertAdjacentHTML('afterend', `
    <div>
        <a href="index.html"><img src="zdjecia/mzk1.png" alt="Logo MZK" class="logo" style="float:left"></a>
        <div class="div_wybor_linii">
            <a href="linia_2ws.html" class="linia_miejska">2</a>
            <a href="linia_4ws.html" class="linia_miejska">4</a>
            <a href="linia_6ws.html" class="linia_miejska">6</a>
            <a href="linia_9ws.html" class="linia_miejska">9</a>
            <a href="linia_13ws.html" class="linia_miejska">13</a>
            <a href="linia_16ws.html" class="linia_miejska">16</a>
            <a href="linia_23ws.html" class="linia_podmiejska">23</a>
            <a href="linia_25ws.html" class="linia_podmiejska">25</a>
            <a href="linia_29ws.html" class="linia_podmiejska">29</a>
            <a href="linia_44ws.html" class="linia_nocna">44</a>
        </div>
    </div>
`);
przycisk_motyw();
