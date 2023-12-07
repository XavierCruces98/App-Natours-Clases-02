const express = require('express');
const controlReview = require('../2controlador/controllerReview');
const routerReview = express.Router({ mergeParams: true }); // creando routerReview // nota importante para enroutar con tour
const controllerAuth = require('../2controlador/controllerAuthentication');

/**
 * ❗❗❗Merge enroutar [Review, Tour]❗❗❗
 *
 * [POST] api/v1/tours/:id/reviews (termina en --reviews--)
 * [POST] api/v1/reviews           (empieza en --reviews--)
 *
 * [GET]  api/v1/tours/:id/reviews (termina en --reviews--)
 * [GET]  api/v1/reviews           (empieza en --reviews--)
 *
 * [GET] api/v1/tours/:id/reviews/:id (Review)    (termina en --reviews--)
 * [GET] api/v1/reviews/:id                    (empieza en --reviews--)
 *
 * 1.0 El codigo es mas inteligente que nosotros
 * 2.0 Estas ingresando dos veces el parametro de --:id-- , asi que el codigo simplemente agarra el ultimo ID
 * 3.0 y El ultimo ID pertence al --ID-- REVIEW, entonces NO tienes que preocuparte del --ID TOUR-- ,
 * 4.0 Solo tomara en cuenta el --ID REVIEW-- , pero esto esta mal, porque podrias ingresar cualquier --ID TOUR--
 * 5.0 En --routerTour-- ponemos primero nuestra ruta personalizada para que chanque al ❗❗❗MERGE enroutar [Review, Tour]❗❗❗
 *
 *
 */

routerReview
  .route('/:id') //
  //  ---- automaticamente MERGE ira aqui, porque es :: [GET] api/v1/reviews/:id  <=> [GET] api/v1/tours/:id/reviews/:id (Review)
  .get(
    controlReview.getReviewId // para mi las review deben de ser publicas (sin permisoJWT)
  )
  .patch(
    controllerAuth.permisoJWT, //
    controllerAuth.restringidoTo('user-basico'),
    controlReview.patchReviewId
  )
  .delete(
    controllerAuth.permisoJWT, //
    controllerAuth.restringidoTo('user-basico'),
    controlReview.deleteReviewId
  );

routerReview
  .route('/') // NO TIENE PARAMETROS
  //  ---- automaticamente MERGE ira aqui, porque es :: [GET] api/v1/reviews  <=> [GET] api/v1/tours/:id/reviews
  .get(
    controlReview.reviewQuery, // para mi las review deben de ser publicas (sin permisoJWT)
    controlReview.consultaAllDocuments
  )
  //  ---- automaticamente MERGE ira aqui, porque es :: [POST] api/v1/reviews <=> [POST] api/v1/tours/:id/reviews
  .post(
    controllerAuth.permisoJWT,
    controllerAuth.restringidoTo('user-basico'),
    controlReview.reviewCreate,
    controlReview.crearReview
  )
  .delete(
    controllerAuth.permisoJWT, //
    controllerAuth.restringidoTo('user-basico'),
    controlReview.deleteMany
  );

// nota --controllerAuth.restringidoTo('user-basico')-- se supone que solo los USER-BASICOS, pueden dejar reviews
// imaginate si un ADMIN o GUIA, o LIDER GUIA, puede dejar reviews, estaria mal❌❌

module.exports = routerReview;
