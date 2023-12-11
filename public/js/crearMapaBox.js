// mapbox correo = vier_98@hotmail.com
// mapbox usuario = alexer98
// mapbox contraseña = XavierEsmeralda2021$

export const crearMapaBox = function (mapaDiv) {
  const locaciones = JSON.parse(mapaDiv.dataset.mislocaciones);
  //const datos = JSON.parse(mapa.attributes['data-mislocaciones'].textContent);

  console.log(locaciones);

  //mapboxgl.accessToken // esta variable viene desde  script src="">
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYWxleGVyOTgiLCJhIjoiY2xwdnR1MTNmMDgwZDJrcXFzcXB1eTV1eSJ9.lXmdDpNGy-vEfaXoH5kP-g';

  const opcionesMap = {
    container: 'mapa', // container ID // <div id="mapa" ></div>
    //style: 'mapbox://styles/mapbox/streets-v12', // style URL (predeterminador)
    style: 'mapbox://styles/alexer98/clpwpeumv010201qm75dj976a', // style (propio)
    //center: [-74.5, 40], // starting position [lng, lat]
    //zoom: 9, // 1-> muy poco zoom, 10-> max zoom
    interactive: false, // hace que el mapa se quede estatico y no se mueva
  };
  
  var map = new mapboxgl.Map(opcionesMap);
  const limites = new mapboxgl.LngLatBounds();

  locaciones.forEach((element) => {
    // 1.0 crear marcador
    const div = document.createElement('div');
    div.className = 'mapa-box'; // 4imagenMapaCuenta.css

    // 2.0 Añadir icono-pin
    new mapboxgl.Marker({
      element: div,
      anchor: 'bottom', // para que aparezca la direccion abajo
    })
      .setLngLat(element.coordenadas) // espera [lng, latitud]
      .addTo(map);

    // 3.0 Añadir cuadro-de-texto
    new mapboxgl.Popup({
      offset: 40,
    })
      .setLngLat(element.coordenadas)
      .setHTML(
        `<p class="mapa-propio-popup" >Dia ${element.dia}: ${element.descripcion}</p>`
      )
      .addTo(map);

    // 3.0 Extender limites para incluir la  ubicacion actual
    limites.extend(element.coordenadas);
  });

  // {padding:} es para centrar la vista del mapa
  // para el tour --the-sports-lover-- hay una sobre posicion de etiquetas
  map.fitBounds(limites, {
    padding: {
      top: 250,
      bottom: 100,
      left: 100,
      right: 100,
    },
  });
};
