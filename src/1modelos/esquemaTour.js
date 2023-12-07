// const cloneDeep = require('lodash.clonedeep');
// const slugify = require('slugify');
const mongoose = require('mongoose');
const DB_user = require('./esquemaUser');
const ErrorClass = require('../utilidades/ErrorClass');
const slugify = require('slugify');

const tourEsquema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'Necesitas ingresar un Tour-nombre'],
      maxlength: [40, 'Tour-nombre debe tener menos o igual a 40 characters'],
      minlength: [10, 'Tour-nombre debe tener mas o igual a 10 characters'],
      unique: true,
      trim: true, // si escribes  " hola  que ", se guarda como "hola que", corta los espacios innecesarios
      validate: {
        validator: function (valor) {
          const regex = /^[A-Za-z0-9\s]+$/;
          return regex.test(valor);
        },
        message: `El "NOMBRE"  debe tener solo caracteres alphaNumericos sin caracteresEspeciales`,
      },
    },
    nombreSlugify: String, // para concatener nombre con un guion '-', busca npm slugify , puedes concatener con '-' u otro simbolo
    duracion: {
      type: Number,
      required: [true, 'Tour-duracion debe tener un valor'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'Tour-maxGroupSize debe tener un valor'],
    },
    dificultad: {
      type: String,
      required: [true, 'Tour- dificultad debe tener un valor segun lista'],
      enum: {
        values: ['facil', 'medio', 'dificil'],
        message: 'Dificultad puede ser: facil, medio, dificil',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 0, // no requerido
      min: [0, 'Tour-ratingAvg debe ser >= 0.0'],
      max: [5, 'Tour-ratingAvg debe ser <= 5.0'],
      set: function (miValor) {
        return Math.round(miValor * 10) / 10; // 4.666*10 => .round(46.666)/10 => 46 /10 => 4.6
      },
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Tour-ratingsQuantity debe ser >= 0.0'],
    },
    precio: {
      type: Number,
      required: [true, 'Tour-precio debe tener un valor'],
      min: [0, 'Tour-precio debe ser >= 0.0'],
    },
    resumen: {
      type: String,
      required: [true, 'Tour-resumen debe tener un valor'],
    },
    descripcion: {
      type: String,
    },
    imageCover: {
      type: String,
      required: [true, 'Tour-imageCover debe tener un valor'],
    },
    imagenes: [String], // un Array de STRING
    startDates: [Date], // un Array de DATES
    //misUsuarios: Array, // un Array de Usarios - esto es para guardar la informaicon de USUARIOS en TOURS-COMPLEJOS
    misUsuarios: [
      {
        // 1. Esto es para hacer referencia de ID-USUARIO en OURS-COMPLEJOS
        // 2.0 --controllerTours.js--
        // 2.1--.populate('misUsuarios')-- cada que consultes un TOUR-ID (GET) podras ver la informacion del usuario
        type: mongoose.Schema.ObjectId,
        ref: 'table-users', // nota ❗❗❗ importante colocar la tabla de referencia --table-user-- (tabla creada en MONGO-DB)
      },
    ],
    creadoEn: {
      type: Date,
      default: Date.now(),
      // select "TRUE" por defecto, siempre se visualiza
      // select "FALSE", se oculta, y se visualiza esta propiedad SOLO si lo especificas en una consulta,
      select: true,
    },
    precio_descuento: {
      type: Number,
      validate: {
        // retonar TRUE O FLASE
        validator: function (valor) {
          return valor <= this.precio;
        },
        message: `El valor precio_descuento ({VALUE}) debe ser menor o igual al "PRECIO"`,
      },
    },
    // --------- 2.0 +propiedades adicionales
    // propiedadTestFind: {
    //   type: String,
    //   default: 'hola', //🔴🔴🔴 al momento de resetear los datos, comenta este default, ❗❗❗
    // },
    locacionStart: {
      //GeoJson -- debes de incrustar un objecto
      type: {
        type: String,
        default: 'Point', // aqui puedes especificar lineas, poligonos, etc
        enum: ['Point'], // un solo punto
      },
      coordenadas: [Number], // [Longitud, Latitud] asi funciona en GeoJSON, [latitud, longitud] googleMaps
      direccion: String,
      descripcion: String,
    },
    locaciones: [
      // hacemos lo mismo que --LocacionStart--
      // pero iniciamos con {}, indicando que esto sera un Array --LocacionStart--
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordenadas: [Number],
        direccion: String,
        descripcion: String,
        dia: Number,
      },
    ],
  },
  {
    toJSON: { virtuals: true }, // TRUE  visualizacion dos veces el ID, + visualizar las prop virtuales (POSTMAN)
    toObject: { virtuals: true }, // TRUE visualizacion dos veces el ID, + visualizar las prop virtuales (TERMINAL / CODIGO)
  }
);
//-------------- INDEX--------------
// 1.0 Aqui estamos creando 02 INDEX (precio, ratingsAvergae)
// 2.0 toda consulta que se haga con [id, nombre, precio, ratingsAverage] seran consulta que tengan INDEX y buscara rapidisimo
//  [1] ordena de menor=> mayor
//  [-1] ordena de mayor=>menor

// tourEsquema.index({ precio: 1 }); // esto es un diex SOLO, como tienes el INDEX compuesto, ya no es necesario
tourEsquema.index({ precio: 1, ratingsAverage: -1 }); // esto es un INDEX compuesto
tourEsquema.index({ nombreSlugify: 1 }); // creando un INDEX para nombreSlugify, aunque tambien podriamos poner arriba como UNIQUE
tourEsquema.index({ 'locacionStart.coordenadas': '2dsphere' }); // creando un INDEX para LOCATIONSTART.COORDENADAS (coordenadas)

//-----------------------------------------------------------------------------------------
// con estos comandos reinicias tus datos:
// => npm run importData && npm run deleteData

// propiedades virtuales
tourEsquema.virtual('duracionSemana').get(function () {
  return this.duracion / 7;
});

// 1.0 para que funcione esto, asegurate que --EsquemaReview-- no muestra informacion de --TOUR--
// 2.0 es decir, que el --.populate()--del --EsquemaReview--  no incluya --TOUR--
tourEsquema.virtual('misReviews', {
  ref: 'table-reviews', // tabla creada en MongoDB                     (tabla externa --tabla-review--)
  foreignField: 'tourId', // Llave Foranea en --esquemaReview--        ( propiedad que esta en la tabla externa --EsquemReview--)
  localField: '_id', // Propiedad que hace referencia --foreignField-- ( propiedad que esta en nuestra tabla actual --EsquemTour--)
});

// nombreSlugify ??
tourEsquema.pre('save', function (next) {
  this.nombreSlugify = slugify(this.nombre, { lower: true });
  next();
});

tourEsquema.pre('save', async function (next) {
  // 1.0 TOURS tiene una propiedad llamada --misUsuarios--,
  // 2.0 De los cuales en --POST-- debemos ingresar sus ID (crear nuevo tour)
  // 3.0 --this.misUsuarios-- buscara cada ID en la base-de-datos de USER
  // 4.0 como esta busqueda es un ARRAY de --async-- entonces debemos de envolver todo en Promise.All
  const misUsuariosPromesas = this.misUsuarios?.map(
    async (miID) => await DB_user.find({ _id: miID })
  );

  // 5.0 Guaradmos
  const misUsuarios = await Promise.all(misUsuariosPromesas);
  const roles = ['guia', 'lider-guia'];
  const validarRole = misUsuarios.every((usuario) =>
    roles.includes(usuario[0].role)
  );

  if (!validarRole) {
    return next(
      new ErrorClass(
        `Ha ingresado un Usuario que no es 'Guia' ó 'Lider-Guia`,
        401
      )
    );
  }
  next();
});

tourEsquema.pre(/^find/, function (next) {
  // 1.0 --.populate({})-- ahora nuestros filtros aplican para todo tipo de --FIND-- (findAll findOne, findID, etc)
  // 2.0 puedes ver la informacion de los ObjectsReferencias gracias --mongoose.Schema.ObjectId--
  // 3.0 sin neceisdad de tener la informacion del OBJECTO dentro de tus bases de datos, solo con ID de REFERENCIA
  // select:'propiedad' (si deseo ver) select:'-propiedad' (no deseo ver)
  this.populate({
    path: 'misUsuarios',
    //select: 'nombre role email -creadoEn',
  }).populate({
    path: 'misReviews',
    //select: '-__v -creadoEn',
  });

  next();
});

const Tour = mongoose.model('table-tours-complejos', tourEsquema); // aqui  poner el nombre que deseamos
module.exports = Tour;

// ❗❗❗ La propiedad de "id=0,1,2,3,4,5,etc" de "esquemaTour.json" simplemente lo ignora,
// porque no estamos poniendo en nuestra esquema ninguna propiedad que se llame "id"

//----------------------------------------------------------------------
// 🟢 video 172 da error al tener esta parte descomentada (--tourDistancias--)
// AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function(next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   console.log(this.pipeline());
//   next();
// });
//----------------------------------------------------------------------

/*

  //-----------------------------------------------------------------------------------------------------------------------------
   // 🟢🟢 video 151 
    ☝☝☝ con --mongoose.Schema.ObjectId-- ya no necesitamos guardar la informacion del usuario dentro de TOURS, 
    ☝☝☝ simplemente hacemos referencia al ID

  tourEsquema.pre('save', async function (next) {
    // 1.0 TOURS tiene una propiedad llamada --misUsuarios--,
    // 2.0 De los cuales en --POST-- debemos ingresar sus ID (crear nuevo tour)
    // 3.0 --this.misUsuarios-- buscara cada ID en la base-de-datos de USER
    // 4.0 como esta busqueda es un ARRAY de --async-- entonces debemos de envolver todo en Promise.All
    const misUsuariosPromesas = this.misUsuarios //
      .map(async (miID) => await DB_user.find({ _id: miID }));

    // 5.0 Guaradmos el Array --async-- en Esquema --Tours.misUsuarios--. Con toda su informacion
    this.misUsuarios = await Promise.all(misUsuariosPromesas);
    next();
  });

  //-----------------------------------------------------------------------------------------
  // 🟢🟢 video 108. validar datos con PATCH, (updateDato)
  // URL: http://127.0.0.1:3000/api/v1/tours/123_aquidebescolocarunID_123
  // revisar --controllerTours--


  //-----------------------------------------------------------------------------------------
  // 🟢🟢 video 105. Document Middleware, recuerda, solo funciona con .save() y .create(), NO con .createMany()
  tourEsquema.pre('save', function (next) {
    // PRE= solo tienes --next--
    console.log(`1.0 [HTTP GET] .pre("save) previsualizacion del documento`);
    next();
  });

  tourEsquema.post('save', function (documento, next) {
    // POST= tienes --documento-- y --next--
    console.log(`2.0 [HTTP GET] .post("save") documento guardado`);
    next();
  });

  //-----------------------------------------------------------------------------------------
  // 🟢🟢 video 106. Query Middleware
  tourEsquema.pre(/^find/, function (next) {
    console.log(`1.0 [HTTP POST] .pre("FIND") realizando QueryMiddleware`);
    next();
  });

  tourEsquema.post(/^find/, function (documento, next) {
    console.log(`2.0 [HTTP POST] .pre("FIND") consulta realizada`);
    next();
  });

  //-----------------------------------------------------------------------------------------
  // 🟢🟢 video 107. Agreggation Middleware
  // url http://127.0.0.1:3000/api/v1/tours/plan-mensual/2021

  tourEsquema.pre('aggregate', function (next) {
    console.log(`1.0 [HTTP GET] .pre("aggregate") `);
    next();
  });

  tourEsquema.post('aggregate', function (documento, next) {
    // el post con "aggregate" al parecer no existe
    console.log(`2.0 [HTTP GET] .post("aggregate") `);
    next();
  });


*/
