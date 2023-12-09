const DB_user = require('../1modelos/esquemaUser');
const DB_tour = require('../1modelos/esquemaTour');
const AsyncFunction = require('../utilidades/AsyncFunction');
const { setCookie } = require('../utlidadesPropias/respWithJwtYCookie');

//---------------------------------------------------
exports.permisosHttps = AsyncFunction(async function (req, resp, next) {
  // Aqui vas añadiendo URLS
  // https://*.mapbox.com https://cdn.jsdelivr.net hhtps://ejemplo.ejemplo.com
  resp.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https://*.mapbox.com https://cdn.jsdelivr.net ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://*.mapbox.com https://cdn.jsdelivr.net 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
  );
  next();
});

// render(allTours.ejs) // si es necesario USUARIOLOCAL
exports.allTours = AsyncFunction(async function (req, resp, next) {
  const data = await DB_tour.find();
  const dataTours = data.slice(1, data.length - 1);

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
// render(emailEnviado.ejs)
exports.emailEnviado = AsyncFunction(async function (req, resp, next) {
  resp.status(200).render('emailEnviado');
});

// render(/emailConfirmado.ejs)
exports.emailConfirmado = AsyncFunction(async function (req, resp, next) {
  // 1) si Existe ---resp.locals.usuarioLocal--- creamos el JWT y el SIGNUP
  if (resp.locals.usuarioLocal) setCookie(resp, resp.locals.usuarioLocal);
  resp.status(200).render('emailConfirmado');

  
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
