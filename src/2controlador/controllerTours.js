//npm run start:dev
const DB_tour = require('../1modelos/esquemaTour');
const Consultas = require('./Consultas');
const AsyncFunction = require('../utilidades/AsyncFunction');
const handlerFactory = require('./handlerFactory');
const ErrorClass = require('../utilidades/ErrorClass');
const sharp = require('sharp'); // npm install sharp@0.29.3 -E

//---------------------
const multer = require('multer');

const multerStorage = multer.memoryStorage();

const multerFiltro = function (req, archivo, callback) {
  console.log(`MULTER TOUR FILTRO ACTUANDO`);
  if (archivo.mimetype.startsWith('image')) {
    callback(null, true);
  } else {
    callback(
      new ErrorClass('No es una Imagen!, Elige un archivo de Imagen!'),
      false
    );
  }
};

//const uploadPhoto = multer({ dest: 'public/imagenes/usuarios' });
const uploadPhoto = multer({
  storage: multerStorage,
  fileFilter: multerFiltro,
});

// la propiedad "photo" debe ser enviada en el formulario
exports.updatePhotoTours = uploadPhoto.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'imagenes', maxCount: 3 },
]);

exports.resizeTourImagen = AsyncFunction(async function (req, resp, next) {
  // uploadPhoto.single('photo')  ==>  req.file
  // uploadPhoto.fields([])       ==>  req.files

  console.log({ archivo: req.files });
  if (!req.files) return next();

  // 1) IMAGECOVER === creando nombre del archivo ---imageCover---
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  await sharp(req.files.imageCover[0].buffer) // el archivo esta en "BUFFER"
    .resize(2000, 1333) //imagenes de 500px 500px (ancho, altura)
    .toFormat('jpeg') // convertir imagen a '.jpeg'
    .jpeg({ quality: 90 }) // calidad de la imagen al 90%
    .toFile(`public/imagenes/tours/${req.body.imageCover}`); // guardando imagen en DISCO

  // 2) IMAGENES === creando nombre de cada archivo de ---imagenes---
  req.body.imagenes = []; // creamos un array y luego .push("nombreImagen.jpg")
 
  await Promise.all(
    req.files.imagenes.map(async function (elemento, index) {
      const nombreArchivo = `tour-${req.params.id}-${Date.now()}-${
        index + 1
      }.jpeg`;

      await sharp(elemento.buffer) // el archivo esta en "BUFFER"
        .resize(2000, 1333) //imagenes de 500px 500px (ancho, altura)
        .toFormat('jpeg') // convertir imagen a '.jpeg'
        .jpeg({ quality: 90 }) // calidad de la imagen al 90%
        .toFile(`public/imagenes/tours/${nombreArchivo}`); // guardando imagen en DISCO

      req.body.imagenes.push(nombreArchivo);
    })
  );

  // el "handlerFactory.patchElementoId(DB_tour);" mete todo lo que este en --req.body--
  next();
});

//------------------------------------------------

exports.getAgrupamientoAno = AsyncFunction(async function (req, resp, next) {
  const miYear = +req.params.miAno; //revisar ""routerTour"" '/plan-mensual/:miAno'
  const estadisticas = await DB_tour.aggregate(
    //Consultas.array_Separado03(miYear) // test1
    //Consultas.array_Separado04(2021, 2023) // test2
    Consultas.array_Separado05(miYear) //test3
  );

  resp.status(201).json({
    status: 'success getAllTour',
    estadisticas,
  });
});

exports.getAgrupamiento = AsyncFunction(async function (req, resp, next) {
  const estadisticas = await DB_tour.aggregate(Consultas.array_Separado01);
  resp.status(201).json({
    status: 'success getAllTour',
    estadisticas,
  });
});

exports.tourTop5 = function (req, resp, next) {
  // Step01 : Creando URL artificial
  req.query.sort = '-ratingsAverage,precio';
  req.query.misFields = 'nombre,precio,dificultad,ratingsAverage';
  req.query.limit = '5';

  next();
};

// -------------- ERROR NO ASINCRONICO -----------------------
//console.log(variableNoCreada);
// -------------- ERROR NO ASINCRONICO -----------------------

exports.consultaAllDocuments = handlerFactory.getAllElements(DB_tour);

exports.postTour = handlerFactory.postElemento(DB_tour);

exports.deleteMany = handlerFactory.deleteMany(DB_tour);

//------------------------------------------------------------------------------
exports.getTourId = handlerFactory.getElementoId(DB_tour);

exports.patchTourId = handlerFactory.patchElementoId(DB_tour);

exports.deleteTourId = handlerFactory.deleteElementoId(DB_tour);

//------------------------------------------------------------------------------

exports.getIdTourIdReview = AsyncFunction(async function (req, resp, next) {
  // 02 Segundo Control-de-ID
  //  si o si debe de haber un --return next(newErrorClass)--
  console.log({ tourId: req.params.id, reviewId: req.params.idReview });
  const documentFind = await DB_tour.findOne({ _id: req.params.id }); // antes de borrar un dato, busca primero su ""id""

  if (!documentFind) {
    return next(new ErrorClass(`ID no Encontrado : ${req.originalUrl}`, 404));
  }

  const review = documentFind.misReviews
    .map((objecto) => {
      if (objecto._id.toString() === req.params.idReview) return objecto;
    })
    .filter((elemento) => typeof elemento !== 'undefined');

  if (review.length === 0) {
    return next(
      new ErrorClass(`ID Reiew no Encontrado : ${req.params.idReview}`, 404)
    );
  }

  resp.status(200).json({
    status: 'success getId',
    data: {
      review,
    },
  });
});

//------------------------------------------------------------------------------
// 001 Te muestra los TOURS que se encuentran a la redonda (segun 1 punto, y segun 1 radio)
// puntoInicial = center/:latitudLongitud
// radio = :distancia

exports.toursCercanos = AsyncFunction(async function (req, resp, next) {
  // URL (profesional): api/v1/tours/tours-cercanos/:distancia/center/:latitudLongitud/unidad/:unit
  // URL (profesional): api/v1/tours/tours-cercanos/400/center/34.058172,-118.242987/unidad/mi // LOS ANGELES
  // URL (profesional): api/v1/tours/tours-cercanos/400/center/34.058172,-118.242987/unidad/km // LOS NEW YORK

  // :distancia, :latitudLongitud, :unit
  // distancia === 400, unit === mi (400 millas)
  // distancia === 400, unit === km (400 kilometros)
  const { distancia, latitudLongitud, unit } = req.params; // la distancia ingresada sera en KILOMETROS Ó MILLAS
  const [latitud, longitud] = latitudLongitud.split(',');
  let radio = undefined;
  if (unit === 'mi') radio = distancia / 3963.2; // dividr distancia/radio-tierra-en-millas  || radio-tierra Millas = 3963.2 millas
  if (unit === 'km') radio = distancia / 6378.1; // dividr distancia/radio-tierra-en-km      || radio-tierra 6378.1 = 3963.2 KM

  console.log({
    parametros: req.params,
    longitud: +longitud,
    latitud: +latitud,
    radio: radio,
  });

  if (!distancia || !latitud || !longitud || !unit) {
    return next(new ErrorClass('Ingrese los datos correctamente', 400));
  }

  const consulta = {
    'locacionStart.coordenadas': {
      $geoWithin: { $centerSphere: [[+longitud, +latitud], radio] },
    },
  };
  const documentFind = await DB_tour.find(consulta);

  resp.status(200).json({
    status: 'success toursCercanos',
    documents: documentFind.length,
    data: {
      documentFind,
    },
  });
});

// 002 Muestra Todos los TOURS y te indica a la distancia que se encuentran (segun 1 punto cualquiera)
// puntoInicial = center/:latitudLongitud

exports.tourDistancias = AsyncFunction(async function (req, resp, next) {
  // URL (profesional): api/v1/tours/tours-distancias/:latitudLongitud/unidad/:unit
  const { latitudLongitud, unit } = req.params;
  const [latitud, longitud] = latitudLongitud.split(',');

  if (!latitud || !longitud || !unit) {
    return next(new ErrorClass('Ingrese los datos correctamente', 400));
  }

  let distancia = undefined;
  if (unit === 'mi') distancia = 0.000621371; // convertir Metros => Millas
  if (unit === 'km') distancia = 0.001; //convertir Metros => Kilometros

  // --$geoNear-- buscara el un index de --2dsphere-- dentro de nuestro esquema
  // dentro de --EsquemaTours-- es importante crear el index: tourEsquema.index({ 'locacionStart.coordenadas': '2dsphere' });
  // de esta forma la consulta funcionara, y sabra que propiedad buscara dentro de nueestra --EsquemaTours--
  const consulta = [
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [+longitud, +latitud], // aqui le estas señalando el punto
        },
        distanceField: 'distanciaCalculada',
        distanceMultiplier: distancia,
      },
    },
    {
      $project: {
        // esto es para filtrar
        distanciaCalculada: 1,
        nombre: 1,
        'locacionStart.direccion': 1,
      },
    },
  ];

  const documentFind = await DB_tour.aggregate(consulta);

  resp.status(200).json({
    status: 'success toursDistancia',
    data: {
      documentFind,
    },
  });
});
