//  $avg,$match,$sort, (rojo) = operadores de mongoDB
// '$propiedad'               = propieades existentes de nuestra base de datos
// _id                        = campo por defecto, para agrupar segun propiedades existencias
// duracionProm               = nombre creado por nosotros, puuedes poner cualquier cosa

// exports.consulta1 = [
//   {
//     $match: { duracion: { $gte: 3 } },
//   },
//   {
//     $group: {
//       _id: null,
//       duracionProm: { $avg: '$duracion' },
//       precioProm: { $avg: '$precio' },
//       ratingQCantidadProm: { $avg: '$ratingsQuantity' },
//       ratingsPromProm: { $avg: '$ratingsAverage' },
//     },
//   },
// ];

// exports.consulta2 = [
//   {
//     $match: { duracion: { $gte: 3 } }, // este campo si debe de existir en nuestra base de datos
//   },
//   {
//     $group: {
//       _id: '$dificultad', // agrupar por dificultad
//       duracionProm: { $avg: '$duracion' },
//       precioProm: { $avg: '$precio' },
//       precioMin: { $min: '$precio' },
//       precioMax: { $max: '$precio' },
//       precioSuma: { $sum: '$precio' },
//       ratingQCantidadProm: { $avg: '$ratingsQuantity' },
//       ratingsPromProm: { $avg: '$ratingsAverage' },
//     },
//   },
//   {
//     $sort: { precioSuma: -1 }, // ordenar de Mayor->Menor
//   },
// ];

// exports.consulta3 = [
//   {
//     $match: { duracion: { $gte: 3 } }, // este campo si debe de existir en nuestra base de datos
//   },
//   {
//     $group: {
//       _id: '$dificultad', // agrupar por dificultad
//       duracionProm: { $avg: '$duracion' },
//       precioProm: { $avg: '$precio' },
//       precioMin: { $min: '$precio' },
//       precioMax: { $max: '$precio' },
//       precioSuma: { $sum: '$precio' },
//       ratingQCantidadProm: { $avg: '$ratingsQuantity' },
//       ratingsPromProm: { $avg: '$ratingsAverage' },
//     },
//   },
//   {
//     $sort: { precioSuma: -1 }, // ordenar de Mayor->Menor
//   },
//   {
//     // $match: { _id: { $ne: 'facil' } }, // resultados !== "facil"
//     $match: { _id: 'facil' }, // resultados === facil
//   },
// ];

// //-------------------------------------------------------------------------------------------
// // Multiples filtros
// // https://stackoverflow.com/questions/45695453/mongodb-query-to-group-by-multiple-fields-and-filter

// 🔵🔵  001 Aprendiendo a usar $unwind
// $unwind: '$startDates', => muestra el documento  por cada valor del array --'$startDates'--
exports.array_Separado01 = [
  {
    // creando un resultado del mismo documento, por cada valor del array --'$startDates'--
    $unwind: '$startDates',
  },
  {
    $match: {}, // todos los resultados
  },
  {
    $group: {
      // agrupando por varios campos
      _id: {
        miId: '$_id',
        miNombre: '$nombre',
        miDificultad: '$dificultad',
        miStartDate: '$startDates',
      },
    },
  },
  {
    $sort: { _id: -1 }, // ordenar de Mayor->Menor
  },
];

// 🔵🔵  002 Aprendiendo a filtrar solo resultados por fechas, desde Año-enero-01 hasta Año-junio-30
exports.array_Separado02 = function (miAno) {
  return [
    {
      // creando un resultado del mismo documento, por cada valor del array --'$startDates'--
      $unwind: '$startDates',
    },
    {
      // filtran por fechas, desde Año-enero-01 hasta Año-junio-30
      $match: {
        startDates: {
          $gte: new Date(`${miAno}-01-01`),
          $lte: new Date(`${miAno}-06-30`),
        },
      },
    },
    {
      $group: {
        // agrupando por varios campos
        _id: {
          miId: '$_id',
          miNombre: '$nombre',
          miDificultad: '$dificultad',
          miStartDate: '$startDates',
        },
        contadorResultados: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 }, // ordenar de Mayor->Menor
    },
  ];
};

// 🔵🔵  003 Aprendiendo a usar contador
exports.array_Separado03 = function (miAno) {
  return [
    {
      // creando un resultado del mismo documento, por cada valor del array --'$startDates'--
      $unwind: '$startDates',
    },
    {
      // filtran por fechas, desde Año-enero-01 hasta Año-junio-30
      $match: {
        startDates: {
          $gte: new Date(`${miAno}-01-01`), // (mes Junio a mes Enero)
          $lte: new Date(`${miAno}-06-30`), // (mes Junio a mes Enero)
        },
      },
    },
    {
      $group: {
        // agrupando por varios campos
        _id: {
          $month: '$startDates', // hace que se agrupen por fechas que tengan el mismo MES, no importa dia o Año
        },
        miNombre: { $push: '$nombre' },
        miDificultad: { $push: '$dificultad' },
        miStartDate: { $push: '$startDates' },
        contadorResultados: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 }, // ordenar de Mayor->Menor (mes Junio a mes Enero)
    },
  ];
};

// 🔵🔵  004 Aprendiendo a usar dos años
exports.array_Separado04 = function (miAno1, miAno2) {
  return [
    {
      // creando un resultado del mismo documento, por cada valor del array --'$startDates'--
      $unwind: '$startDates',
    },
    {
      // filtran por fechas, desde Año-enero-01 hasta Año-junio-30
      $match: {
        startDates: {
          $gte: new Date(`${miAno1}-01-01`), // (mes Junio a mes Enero)
          $lte: new Date(`${miAno2}-12-30`), // (mes Junio a mes Enero)
        },
      },
    },
    {
      $group: {
        // agrupando por varios campos
        _id: {
          $month: '$startDates', // hace que se agrupen por fechas que tengan el mismo MES, no importa dia o Año
        },
        miNombre: { $push: '$nombre' },
        miStartDate: { $push: '$startDates' },
        contadorResultados: { $sum: 1 },
      },
    },
    {
      $sort: { _id: -1 }, // ordenar de Mayor->Menor (mes Junio a mes Enero)
    },
  ];
};

// 🔵🔵  005 Aprendiendo MAS CAMPOS
exports.array_Separado05 = function (miAno) {
  return [
    {
      // creando un resultado del mismo documento, por cada valor del array --'$startDates'--
      $unwind: '$startDates',
    },
    {
      // filtran por fechas, desde Año-enero-01 hasta Año-junio-30
      $match: {
        startDates: {
          $gte: new Date(`${miAno}-01-01`), // (mes Junio a mes Enero)
          $lte: new Date(`${miAno}-06-30`), // (mes Junio a mes Enero)
        },
      },
    },
    {
      $group: {
        // agrupando por varios campos
        _id: {
          $month: '$startDates', // hace que se agrupen por fechas que tengan el mismo MES, no importa dia o Año
        },
        miNombre: { $push: '$nombre' },
        miDificultad: { $push: '$dificultad' },
        miStartDate: { $push: '$startDates' },
        miContadorResultados: { $sum: 1 },
        miAvgprecio: { $avg: '$precio' }, // aqui SI se puede
        miSumPrecio: { $sum: '$precio' }, // aqui SI se puede
      },
    },
    {
      $sort: { _id: -1 }, // ordenar de Mayor->Menor (mes Junio a mes Enero)
    },
    {
      $addFields: {
        xMes: '$_id',
        xAvgprecio: { $avg: '$precio' }, // aqui no se puede
        xSumPrecio: { $sum: '$precio' }, // aqui no se puede
      },
    },
    // {
    // $project === es opcional,
    // $project: {
    //   _id: 0,
    //    0 = aparece todos los datos menos el ID,
    //    1 = aparece solo ID
    //   /ID ===  $month: '$startDates'
    // },
    // },
  ];
};
