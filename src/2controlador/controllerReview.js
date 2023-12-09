const DB_Review = require('../1modelos/esquemaReview');
const AsyncFunction = require('../utilidades/AsyncFunction'); // nota: con "AsyncFunction", nos quitamos el TRY y el CATCH
const ErrorClass = require('../utilidades/ErrorClass');
const handlerFactory = require('./handlerFactory');

const validar = function (documentFind, req, next) {
  if (!documentFind) {
    return next(new ErrorClass(`ID no Encontrado : ${req.originalUrl}`, 404));
  }

  if (
    req.usuarioActual._id.toString() !== documentFind.usuarioId._id.toString()
  ) {
    return next(
      new ErrorClass(
        `Eres un usuario distinto al usuario creador de la review `,
        404
      )
    );
  }
};

exports.reviewQuery = AsyncFunction(async function (req, resp, next) {
  // req.query.tourId // consulta normal // GET All-Reviews          {URL}api/v1/reviews?Query
  // req.params       // consulta Tours // GET All-Revires x Id tour {URL}api/v1/tours/:id/reviews'

  // --req.params--  === api/v1/tours/:id/reviews
  // --req.query--  ===  api/v1/reviews?Query

  // Si existe --req.params-- entonces ahi recien asignamos el query
  // 1.0 La --Query--    siempre empieza con  "?"
  // 2.0 Y el --parmas-- es colocado entre barras --//--
  // 3.0 Y como sabe que entre las barras --//-- existe "":id""??, porque asi lo definimos en la ruta --api/v1/tours/:id/reviews--
  // 4.0 Antes de ingresar a REVIEW , ingresa  TOURS,
  // Entiende que la ruta --TOURS api/v1/tours/:id/reviews--, existe un parametro llamado --id-- que viene desde --TOURS--

  if (req.params?.id) req.query.tourId = req.params?.id;
  next();
});

exports.reviewCreate = AsyncFunction(async function (req, resp, next) {
  // 1.0 Si no existe en en body --usuarioId-- ó --tourID-- entonces le damos su valor
  if (!req.body.usarioId) req.body.usuarioId = req.usuarioActual.id; // id de usuario actual  ---controllerAuth.permisoJWT---
  if (!req.body.tourId) req.body.tourId = req.params.id; // idTour ---{{URL}}api/v1/tours/5c88fa8cf4afda39709c2951/reviews---

  console.log({ tourId: req.body.tourId });
  next();
});

// ------------------- 1.0 GET, POST, DELETE sin ID ----------------------------------------------

exports.consultaAllDocuments = handlerFactory.getAllElements(DB_Review);

// 1.0 en --middleware-- --reviewEsquema.pre('save')--  estamos validando si: TourId existe o no existe
exports.crearReview = handlerFactory.postElemento(DB_Review);

exports.deleteMany = handlerFactory.deleteMany(DB_Review);

//----------------------------- 2.0 GET , PATCH , DELETE con ID----------------------------------------------------

exports.getReviewId = handlerFactory.getElementoId(DB_Review);

exports.patchReviewId = AsyncFunction(async function (req, resp, next) {
  // 1.0 Las validaciones para crear datos/esquemas son automaticas
  // 1.1 Pero para --Las validaciones-- para actualizar PATCH, se debe colocar runValidators:true

  // {comentario, calificacion} con esto solo puedes modifcar los campos de --comentario ó calificacion--
  const consulta = req.params.id;
  const bodyPostman = {
    comentario: req.body.comentario,
    calificacion: req.body.calificacion,
  };
  const validarDatos = { new: true, runValidators: true };

  const documentUpdate = await DB_Review.findByIdAndUpdate(
    consulta,
    bodyPostman,
    validarDatos
  );

  // 01 Primer Control-de-ID
  // si o si debe de haber un --return next(newErrorClass)--
  validar(documentUpdate, req, next);

  resp.status(201).json({
    status: 'success patchReviewId',
    documentUpdate,
  });
});

exports.deleteReviewId = AsyncFunction(async function (req, resp, next) {
  //  02 Segundo  Control-de-ID
  //  si o si debe de haber un --return next(newErrorClass)--

  // 1.0 Aqui queremos que solo el propio usuario pueda eliminar su propio review
  // const documentFind = await database.findOne({ _id: req.params.id });   // forma antigua
  // const documentDelete = await database.deleteOne({ _id: req.params.id }); // forma antigua
  const documentDelete = await DB_Review.findByIdAndDelete(req.params.id); //

  validar(documentDelete, req, next);

  resp.status(201).json({
    status: 'success deleteReviewId',
    documentDelete,
  });
});
