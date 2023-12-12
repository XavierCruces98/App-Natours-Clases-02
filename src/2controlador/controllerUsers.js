// node "src/proyect1/controlador/controlUsers.js"
// npm run start:dev
const DB_user = require('../1modelos/esquemaUser');
const AsyncFunction = require('../utilidades/AsyncFunction');
const ErrorClass = require('../utilidades/ErrorClass');

const { respJwtYCookie } = require('../utlidadesPropias/respJwtYCookie');
const filtrarObject = require('../utlidadesPropias/filtrarObject');
const handlerFactory = require('./handlerFactory');

//---------------------
const multer = require('multer');

const multerStorage = multer.diskStorage({
  // 1.0 destino
  destination: function (req, archivo, callback) {
    return callback(null, 'public/imagenes/usuarios');
  },
  // 2.0 nombre archivo
  // (recuerda que pare acceder a "/updateMyPerfil" deben iniciar sesion)
  filename: function (req, archivo, callback) {
    // user-ID-fecha.jpg
    const extension = archivo.mimetype.split('/')[1]; // ".jpeg"
    return callback(
      null,
      `user-${req.usuarioActual.id}-${Date.now()}.${extension}`
    );
  },
});

const multerFiltro = function (req, archivo, callback) {
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

exports.multerUploadPhoto = uploadPhoto.single('photo');

exports.consultaAllDocuments = handlerFactory.getAllElements(DB_user);

exports.postUser = handlerFactory.postElemento(DB_user);

exports.deleteMany = handlerFactory.deleteMany(DB_user);

//------------------------------------------------------------------
exports.getUserId = handlerFactory.getElementoId(DB_user);

exports.patchUserId = handlerFactory.patchElementoId(DB_user);

exports.deleteUserId = handlerFactory.deleteElementoId(DB_user);

//------------------------------------------------------------------
exports.getMe = AsyncFunction(async function (req, resp, next) {
  // req.params.id      : {URL}/api/v1/users/(:id)
  // req.params.id  =>  : {URL}/api/v1/users/653944a642674692ff7e6c7d (:id) (id del usuario actual)
  req.params.id = req.usuarioActual.id; // req.usuarioActual ==> --controllerAuth.permisoJWT---
  next();
});

exports.updatePerfil = AsyncFunction(async function (req, resp, next) {
  // subirFoto con MULTER
  // console.log({ archivo: req.file, body: req.body });
  // console.log({ usuarioActual: req.usuarioActual });

  // 💻 1.0 En este URL '/updateMyPerfil' no se permite actualizar password, solo "nombre+email"
  if (req.body.password || req.body.passwordConfirm)
    return next(new ErrorClass("Porfavor use la ruta '/updatePassword'", 401)); // bad request

  // 💻 2.0 buscando usuario, y obviamente si esta porque ha iniciado sesion "permisoJWT"

  const consulta = { _id: req.usuarioActual.id };
  const body = filtrarObject(req.body, 'email', 'nombre');

  const validarDatos = { new: true, runValidators: true };

  // 💻 3.0 no podemos hacer --await DB_user.save()--
  // porque que se activen los campos obligatorio y "password + confirm" es un campo obligatorio
  // validarUsuario.nombre = req.body.nombre;
  // validarUsuario.email = req.body.email;
  // await DB_user.save(); // req.body.password + req.body.passwordConfirm;

  // 💻 3.0 actualizando usuario y foto
  body.photo = req.file?.filename || req.usuarioActual.photo;
  const documentUpdate = await DB_user.findOneAndUpdate(
    consulta,
    body,
    validarDatos
  );

  // 💻 4.1 respuesta
  respJwtYCookie(resp, {
    status: 'success updatePerfil',
    usuario: documentUpdate,
  });
});

exports.deletePerfil = AsyncFunction(async function (req, resp, next) {
  // 💻 1.0 aqui ya has iniciado sesion, no deberias ingresar nada, simplemente vamos a pedir su contraseña
  // 💻 1.0 recuerda, ".find()" no devuelve metodos, ".findOne" si devuelve metodos
  const validarUsuario = await DB_user.findOne({
    _id: req.usuarioActual.id,
  }).select('+password');
  const validarPassword = await validarUsuario.compararPassword(
    req.body.password,
    validarUsuario.password
  );

  if (!validarPassword)
    return next(new ErrorClass('Ingrese correctamente su password', 401));

  // 💻 2.0 si su contraseña es correcto, entonces {active:False}
  const consulta = { _id: req.usuarioActual.id };
  const validarDatos = { new: true, runValidators: true };

  const documentUpdate = await DB_user.findOneAndUpdate(
    consulta,
    { active: false },
    validarDatos
  );

  resp.status(201).json({
    status: 'success deletePerfil',
    documentUpdate,
  });
});
