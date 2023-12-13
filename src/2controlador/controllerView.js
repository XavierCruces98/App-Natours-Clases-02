const DB_tour = require('../1modelos/esquemaTour');
const AsyncFunction = require('../utilidades/AsyncFunction');

//const DB_user = require('../1modelos/esquemaUser');
//const filtrarObject = require('../utlidadesPropias/filtrarObject');
// exports.updateMyPerfilView = AsyncFunction(async function (req, resp, next) {
//   // necesitas de ___express.urlencoded({ extended: true, limit: '10kb' })__
//   // para poder ver el "req.body" enviado desde archivo.pug (action="/url")
//   // hemos puesto ---verificarLogin--- para que devuelva "usuarioLocal"
//   //console.log({ body: req.body, user: resp.locals.usuarioLocal._id });

//   const consulta = { _id: resp.locals.usuarioLocal._id };
//   const validarDatos = { new: true, runValidators: true };

//   const documentUpdate = await DB_user.findOneAndUpdate(
//     consulta,
//     {
//       nombre: req.body.nombre,
//       email: req.body.email,
//     },
//     validarDatos
//   );


//   resp.locals.usuarioLocal = documentUpdate;
//   resp.status(200).render('me');
// });

//---------------------------------------------------
exports.permisosHttps = AsyncFunction(async function (req, resp, next) {
  // Aqui vas añadiendo URLS
  // https://*.mapbox.com https://cdn.jsdelivr.net hhtps://ejemplo.ejemplo.com
  // https://*.mapbox.com  (para MAPA gps de nuestros tours)
  // https://cdn.jsdelivr.net (para AXIOS y hacer solicitudes HTTP a nuestra API desde JS)
  resp.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https://*.mapbox.com https://cdn.jsdelivr.net ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://*.mapbox.com https://cdn.jsdelivr.net 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
  );
  next();
});

// render(allTours.ejs) // si es necesario USUARIOLOCAL
exports.allTours = AsyncFunction(async function (req, resp, next) {
  const data = await DB_tour.find();
  const dataTours = data.slice(0, data.length - 1);

  resp.status(200).render('allTours', {
    dataTours: dataTours,
  });
});

// render(login.ejs) // no es necesario USUARIOLOCAL, pero la variable esta presente
exports.login = AsyncFunction(async function (req, resp, next) {
  resp.status(200).render('login');
});

// render(me.ejs) // si es necesario USUARIOLOCAL
exports.perfil = AsyncFunction(async function (req, resp, next) {
  // resp.locals.usuarioLocal = usuario; llega directamente a .pug
  resp.status(200).render('me');
});

//------------------------------------------------------------------------
// nota
// 1) Aver papito, aqui la estabamos malogrando bien feo
// 2) recuerda que una API, NO debe acordarse de solicitudes anteriores, sino que todo lo debe de hacer en una sola pasadda
// 3) Aqui estabamos primero::: usando "localhost:3000/api/v1/signup" => y esto termina en "emailEnviado"
// 4) entonces si ya hemos acabado, esto de aqui no deberia de acordar se solicitudes anteriores, para verificar si el "Email" FUE ENVIADO O NO

// // render(emailEnviado.ejs)
exports.emailEnviado = AsyncFunction(async function (req, resp, next) {
  // ControllerAuthentication.validarJwtCookie ==> nos devuelve ---resp.locals.usuarioLocal---
  // dentro de la plantilla de ""emailEnviado.pug"" tenemos los mensajes
  resp.status(200).render('emailEnviado');
});

// render(signUp.ejs)
exports.signup = AsyncFunction(async function (req, resp, next) {
  resp.status(200).render('signUp');
});

// render(tour.ejs)
// https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/learn/lecture/15065656#questions/12020720
exports.tour = AsyncFunction(async function (req, resp, next) {
  const tour = await DB_tour.findOne({ nombreSlugify: req.params.string });

  resp.status(200).render('tour', {
    tituloDinamico: tour.nombre,
    tour: tour,
  });
});
