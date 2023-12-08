const DB_user = require('../1modelos/esquemaUser');
const DB_tour = require('../1modelos/esquemaTour');
const AsyncFunction = require('../utilidades/AsyncFunction');
const { setCookie } = require('../utlidadesPropias/respuestaWithJWT');

//---------------------------------------------------
exports.permisosHttps = AsyncFunction(async function(req,resp,next){
  // Aqui vas añadiendo URLS
  // https://*.mapbox.com https://cdn.jsdelivr.net hhtps://ejemplo.ejemplo.com
    resp.setHeader(
      'Content-Security-Policy',
      "default-src 'self' https://*.mapbox.com https://cdn.jsdelivr.net ;base-uri 'self';block-all-mixed-content;font-src 'self' https: data:;frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src https://*.mapbox.com https://cdn.jsdelivr.net 'self' blob: ;script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests;"
    );
  
    next();
  
})


// render(allTours.ejs)
exports.allTours = AsyncFunction(async function (req, resp, next) {
  console.log({ miUsuario: req.usuarioLogeado });

  const data = await DB_tour.find();
  const dataTours = data.slice(1, data.length - 1);

  resp
    .status(200)
    .render('allTours', {
      dataTours: dataTours,
      usuario: req.usuarioLogeado,
    });
});

// render(login.ejs)
exports.login = AsyncFunction(async function (req, resp, next) {
  resp
    .status(200)
    .render('login', {
      usuario: req.usuarioLogeado,
    });
});

// render(me.ejs)
exports.perfil = AsyncFunction(async function (req, resp, next) {
  resp.status(200).render('me', {
    usuario: req.usuarioLogeado,
  });
});

// render(emailEnviado.ejs)
exports.emailEnviado = AsyncFunction(async function (req, resp, next) {
  resp.status(200).render('emailEnviado');
});

// render(/emailConfirmado.ejs)
exports.emailConfirmado = AsyncFunction(async function (req, resp, next) {
  if (!req.errorValidarEmail) setCookie(resp, req.validarUsuario);
  console.log({ cookieEmail: req.headers.cookie });

  resp.status(200).render('emailConfirmado', {
    errorValidarEmail: req.errorValidarEmail,
    usuario: req.validarUsuario,
  });
});

// render(signUp.ejs)
exports.signup = AsyncFunction(async function (req, resp, next) {
  resp.status(200).render('signUp', {
    usuario: req.usuarioLogeado,
  });
});

// render(tour.ejs)
// https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/learn/lecture/15065656#questions/12020720
exports.tour = AsyncFunction(async function (req, resp, next) {
  console.log({ url: req.url });
  console.log({ url: req.params.string });

  const tour = await DB_tour.findOne({ nombreSlugify: req.params.string });

  resp
    .status(200)
    .render('tour', {
      tituloDinamico: tour.nombre,
      tour: tour,
      usuario: req.usuarioLogeado,
    });
});
