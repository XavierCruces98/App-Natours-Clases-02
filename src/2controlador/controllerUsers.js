// node "src/proyect1/controlador/controlUsers.js"
// npm run start:dev
const DB_user = require('../1modelos/esquemaUser');
const AsyncFunction = require('../utilidades/AsyncFunction');
const ErrorClass = require('../utilidades/ErrorClass');
const sharp = require('sharp'); // npm install sharp@0.29.3 -E

const { respJwtYCookie } = require('../utlidadesPropias/respJwtYCookie');
const filtrarObject = require('../utlidadesPropias/filtrarObject');
const handlerFactory = require('./handlerFactory');

//---------------------
const multer = require('multer');

// 💻 1.0 MULTER, por recomendacion del instructor, es mejor guardar las fotos en la MEMORIA,
// 💻 1.0 MULTER, en vez de guardarlo directamente en el DISCO
// const multerStorage = multer.diskStorage({
//   // 1.0 destino
//   destination: function (req, archivo, callback) {
//     return callback(null, 'public/imagenes/usuarios');
//   },
//   // 2.0 nombre archivo
//   // (recuerda que pare acceder a "/updateMyPerfil" deben iniciar sesion)
//   filename: function (req, archivo, callback) {
//     // user-ID-fecha.jpg
//     const extension = archivo.mimetype.split('/')[1]; // ".jpeg"
//     return callback(
//       null,
//       `user-${req.usuarioActual.id}-${Date.now()}.${extension}`
//     );
//   },
// });

// 💻 2.0 MULTER, guardando foto en la 'MEMORIA', se guarda como un 'BUFER'
const multerStorage = multer.memoryStorage();

const multerFiltro = function (req, archivo, callback) {
  console.log(`MULTER USER FILTRO ACTUANDO`);
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

// la propiedad "photo" debe ser enviada en el formulario
exports.multerUploadPhoto = uploadPhoto.single('photo');

//----------------------------------------------------------------------

exports.resizeUserImagen = AsyncFunction(async function (req, resp, next) {
  // Si ---multerUploadPhoto--- se realiza con éxito, entonces, existe "req.file"
  console.log({ archivoPre: req });
  if (!req.file) return next();

  // aqui estamos creando la propiedad ".filename" // "el .jpeg solo es texto"
  req.file.filename = `user-${req.usuarioActual.id}-${Date.now()}.jpeg`;

  sharp(req.file.buffer) // el archivo esta en "BUFFER"
    .resize(500, 500) //imagenes de 500px 500px (ancho, altura)
    .toFormat('jpeg') // convertir imagen a '.jpeg'
    .jpeg({ quality: 90 }) // calidad de la imagen al 90%
    .toFile(`public/imagenes/usuarios/${req.file.filename}`);

  next();
});

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
  console.log({ archivo: req.file, body: req.body });
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
  // Si ---multerUploadPhoto--- se realiza con éxito, entonces, existe "req.file"
  if (req.file) body.photo = req.file.filename;
  const documentUpdate = await DB_user.findOneAndUpdate(
    consulta,
    body,
    validarDatos
  );

  resp.locals.usuarioLocal = documentUpdate;

  // 💻 4.1 respuesta si estamos en "renderizar"
  // 💻 4.2 acuerdate que no podemos renderizar, porque estamos en ruta "user"
  // 💻 4.3 y solo podemos renderizar en ruta "view"
  // if (!req.url.startsWith('/api')) return resp.status(200).render('me');

  // 💻 4.1  si estamos en "/api"
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
