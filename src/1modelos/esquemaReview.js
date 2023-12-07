const mongoose = require('mongoose');
const DB_Tour = require('./esquemaTour');
const ErrorClass = require('../utilidades/ErrorClass');

const reviewEsquema = new mongoose.Schema(
  {
    comentario: {
      type: String,
      require: [true, 'Review-comentario no puede quedar vacio'],
      maxlength: [
        500,
        'Review-comentario debe tener como maximo 500caracteres',
      ],
      trim: true, // si escribes  " hola  que ", se guarda como "hola que", corta los espacios innecesarios
    },
    calificacion: {
      type: Number,
      //default: 2.5, // no requerido
      min: [1, 'Review-rating debe ser >= 1.0'],
      max: [5, 'Review-rating debe ser <= 5.0'],
      require: [true, 'Review-Calificacion debe ingresar una Calificion [1,5]'],
    },
    usuarioId: {
      // 1. Esto es para hacer referencia  ID-TOURS-COMPLEJOSO en Table-REVIEWS
      type: mongoose.Schema.ObjectId,
      ref: 'table-users', // nota ❗❗❗ importante colocar la tabla de referencia(tabla creada en MONGO-DB)
      require: [true, 'Review-UsuarioID debe ingresar un ID de Usuario'],
    },

    tourId: {
      type: mongoose.Schema.ObjectId,
      ref: 'table-tours-complejos',
      require: [true, 'Review-TourID debe ingresar un ID de Tour'],
    },

    creadoEn: {
      type: Date,
      default: Date.now(),
      // select "TRUE" por defecto, siempre se visualiza
      // select "FALSE", se oculta, y se visualiza esta propiedad SOLO si lo especificas en una consulta,
      select: true,
    },
  },

  {
    toJSON: { virtuals: false }, // TRUE saldra en la visualizacion dos veces el ID, + visualizar las prop virtuales
    toObject: { virtuals: true },
  }
);

//------------------ 1.0 INDEX UNIQUE -----------------------------
// 1.0 verificar que un USER pueda poner solo 01 REVIEW en cada TOUR
// 2.0 Aqui no basta con solo comentar el codigo, debes de ir a MongoDBC ompass --> reviewEsquema --> INDEX --> borras el index

reviewEsquema.index({ usuarioId: 1, tourId: 1 }, { unique: true }); // nota no te olvides de comentar/descomentar segun tu gusto ☝

//------------------ 2.0 CALCULAR RATINGS DE TOUR -----------------------------

// .static() (es como .methods --esquemaUser--)
// .aggregate() ==> revisa --consultas--  y TOURS --.getAgrupamientoAno-- ahi tambien usamos .aggregate()
reviewEsquema.statics.calcularAvgRatings = async function (miTourId) {
  const consulta = [
    { $match: { tourId: miTourId } }, // consulta {tourId: review.tourId}
    {
      $group: {
        _id: '$tourId', // agrupar por {id, numeroDeReview segun tourId, promedio de Ratings }
        numeroDeReviews: { $sum: 1 },
        ratingsAvg: { $avg: '$calificacion' },
      },
    },
  ];
  const estadisticas = await this.aggregate(consulta);

  // console.log('Mis estadisticas');
  // console.log(estadisticas);

  const consultaId = miTourId;
  const body = {
    ratingsQuantity: estadisticas[0]?.numeroDeReviews || 0, // si no hay review, ponemos valor 0
    ratingsAverage: estadisticas[0]?.ratingsAvg || 0, // si no hay review, ponemos valor 0
  };
  await DB_Tour.findByIdAndUpdate(consultaId, body);
};

//-------------- 2.1 CALCULAR RATINGS DE TOUR SEGUN .create() REVIEW || .delete() .update() .find() REVIEW ----------------------
// 002 Esto se ejecuta cada vez que guardamos un documentoReview
reviewEsquema.post('save', function () {
  this.constructor.calcularAvgRatings(this.tourId);
  console.log('Review .create() .POST()');
  // 1. La variable DB_review, se crea despues de:
  //
  // const Review = mongoose.model('table-reviews', reviewEsquema);
  //
  // 2. por ello aqui usamos --this.constructor-- , como si estuvieras haciendo un metodo desde el constructor
  // 3. lo normal seria --await DB_review.calcularAvgRatings---
  // 4. pero queremos que por cada vez que se guarde un REVIEW => update RatingsTour
});

// reviewEsquema.pre(/^(find|update|delete) // se supone que este codigo se debe ejecutar cada vez que se haga: (no funciona ❌)
// reviewEsquema.pre(/^findOneAnd)          // Si FUNCIONA ✅
// await DB_review .findByIdAndUpdate() // aqui si
// await DB_review .findByIdAndDelete() // aqui si
// await DB_review .findOne()           // aqui no
// await DB_review .updateOne()         // aqui no

// 001.1 Esto se ejecuta cada vez que update/find/delete un documentoReview
reviewEsquema.pre(/^findOneAnd/, async function (next) {
  this.reviewUnico = await this.findOne().clone(); // con esto solucionas el problema --await this.findOne().--
  console.log('Review update/delete .PRE()');
  console.log(this.reviewUnico);
  next();
});

// 001.2 Esto se ejecuta cada vez que update/find/delete un documentoReview
// 001.3 reviewSchema.post(/^findOneAnd/, async function()   --> esto no funcina
// 001.4 reviewEsquema.post(/^find/, async function ()  --> esto si funciona
reviewEsquema.post(/^find/, async function () {
  //this.reviewUnico = await this.findOne(); // esto en .POST no se puede

  await this.reviewUnico?.constructor.calcularAvgRatings(
    this.reviewUnico.tourId
  );

  const documentChange = await this.reviewUnico;
  console.log('Review update/delete .POST()');
  console.log(documentChange);
});

//------------------ 3.0  verificar si el ID_TOUR existe o no existe-----------------------------

// reviewEsquema.pre(/^(save|update|delete)/, async function (next)
reviewEsquema.pre('save', async function (next) {
  const tourId = await DB_Tour.find({ _id: this.tourId?.toString() });
  if (!tourId[0]) {
    return next(new ErrorClass(`Ha ingresado un ID Tour No valido`, 401));
  }

  next();
});

//------------------ 4.0  .populate() -----------------------------

// 3.0 NOO incluyas TOURS, porque sino:
//  ☝ Cada TOUR vera una REVIEW
//  ☝ y cada REVIEW tiene un TOUR
//  ☝ y cada TOUR tiene un REVIEW...
reviewEsquema.pre(/^find/, function (next) {
  // select:'propiedad' (si deseo ver)
  // select:'-propiedad' (no deseo ver)
  this.populate({
    path: 'usuarioId',
    select: 'nombre -creadoEn photo',
  });
  // .populate({
  //   path: 'tourId',
  //   select: 'nombre',
  // });

  next();
});

const Review = mongoose.model('table-reviews', reviewEsquema); // aqui  poner el nombre que deseamos
module.exports = Review;
