const DB_user = require('../1modelos/esquemaUser');
const DB_tour = require('../1modelos/esquemaTour');
const AsyncFunction = require('../utilidades/AsyncFunction');
const { setCookie } = require('../utlidadesPropias/respuestaWithJWT');

//---------------------------------------------------

// render(allTours.ejs)
exports.allTours = AsyncFunction(async function (req, resp, next) {
  console.log({ miUsuario: req.usuarioLogeado });

  const data = await DB_tour.find();
  const dataTours = data.slice(1, data.length - 1);

  resp.status(200).render('allTours', {
    dataTours: dataTours,
    usuario: req.usuarioLogeado,
  });
});

exports.login = AsyncFunction(async function (req, resp, next) {
  resp.status(200).render('login', {
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
exports.tour = AsyncFunction(async function (req, resp, next) {
  console.log({ url: req.url });
  console.log({ url: req.params.string });

  const tour = await DB_tour.findOne({ nombreSlugify: req.params.string });

  resp.status(200).render('tour', {
    tour: tour,
    usuario: req.usuarioLogeado,
  });
});
