const QueryClass = require('../utilidades/QueryClass');
const AsyncFunction = require('../utilidades/AsyncFunction');
const ErrorClass = require('../utilidades/ErrorClass');

//---------------------------- 1.0 GET, POST, DELETE sin ID-------------------------------------
//
exports.getAllElements = function (database) {
  return AsyncFunction(async function (req, resp) {
    // -------------- ERROR NO ASINCRONICO -----------------------
    //console.log(variableNoCreada);
    // -------------- ERROR NO ASINCRONICO -----------------------

    // En este consulta, no estamos tomando --1 ID--, sino estamos tomando ALL ID
    // ahora, si en la consulta, hay filtros (paginas, ordenar, misFields, etc), nos ahorrajara los resultados de esos filtros
    // peero la consulta es sobre All documents

    // Aqui no se pone  "control de null", porque SI la consulta que haces regresa un NULL
    // es porque simplemente has hecho una consulta que no tiene resultado, pero no es un error, sino que es una consulta sin resultados
    // en cambio ABAJO, estas ingresanod un ID NO VALIDO, ahi es un error

    // Step01 : Creando Query
    const Query = await new QueryClass(req.query, database)
      .filtrarYbuscar()
      .ordenar() // sort
      .misFields() // miscampos
      .paginacion(); // paginacion

    const resultado = await Query.getBusqueda(); // devuelve los datos encontrados, aqui Busqueda Colapsa
    // const resultado = await Query.getBusqueda().explain() // ver estadisticas de consulta

    resp.status(201).json({
      status: 'success getAll',
      results: resultado.length,
      data: {
        resultado,
      },
    });
  });
};

exports.postElemento = function (database) {
  return AsyncFunction(async function (req, resp, next) {
    // nota: con "AsyncFunction", nos quitamos el TRY y el CATCH     // postman: 3.0 AsyncFunction test
    // recuerda: aqui ya no tenemos un "catch error" este se ira a miServidor.use(ErrorController)

    const document = await database.create(req.body);

    // nota: Recuerda que aqui no tenemos un ID, estamos creando un nuevo documento nuevo, por ende no hay un controllerID

    resp.status(201).json({
      status: 'success Post',
      data: {
        results: document.length,
        document,
      },
    });
  });
};

exports.deleteMany = function (database) {
  return AsyncFunction(async function (req, resp) {
    //const documentDelete = await DB_user.deleteMany({ nombre: { $ne: null } }); // NO  borra nada
    const documentDelete = await database.deleteMany({ nombre: { $ne: null } }); // SI borra todo

    resp.status(201).json({
      status: 'success deleteAll',
      data: {
        // results: document.length, // AQUI SALE ERROR SI PONES ESTO
        documentDelete,
      },
    });
  });
};

//-------------------------- 2.0 GET, PATCH, DELETE con ID ---------------------------------------
exports.getElementoId = function (database) {
  return AsyncFunction(async function (req, resp, next) {
    console.log({ comentario: 'ver parametros', params: req.params });
    //  ☝  --findone()-- aqui estamos buscando el ID
    //  ☝ --.populate()-- pero ahora tenemos el --.populate()--  aparte en un middleware, ok

    //  01 Primer Control-de-ID
    //  const documentFind = await Tour.findById(req.params.id); // esta forma tambien es valida
    const documentFind = await database.findOne({ _id: req.params.id }); // antes de borrar un dato, busca primero su ""id""

    if (!documentFind) {
      return next(new ErrorClass(`ID no Encontrado : ${req.originalUrl}`, 404));
    }

    resp.status(200).json({
      status: 'success getId',
      data: {
        documentFind,
      },
    });
  });
};

// Crear un nuevo Review, ❗❗❗recuerda ❗❗❗
// 🟢 1.0 Para crear datos dentro del esquema de --esquemaTour, esquemaUser, esquemaReview--,
//    --DB_Review.create()-- Las validaciones se activan automaticamente (campos REQUERIDOS, campos con ENUMERACION, etc)

// 🔴 2.0 Pero para actualizar --DB_Review.updateOne()-- ahi si debemos de activar las validaciones
//        Sino, podrias actualizar un documento sin respetar (campos REQUERIDOS, campos con ENUMERACION, etc)

exports.patchElementoId = function (database) {
  return AsyncFunction(async function (req, resp, next) {
    // 02 Segundo Control-de-ID
    //const documentFind = await database.findOne({ _id: req.params.id }); // forma antigua
    //const consulta = { _id: req.params.id };
    //const bodyPostman = req.body;
    //const validarDatos = { new: true, runValidators: true };
    //const documentUpdate = await DB_tour.updateOne(
    //  consulta,
    //  bodyPostman,
    //  validarDatos
    //);

    const consulta = req.params.id;
    const bodyPostman = req.body;
    const validarDatos = { new: true, runValidators: true };

    const documentUpdate = await database.findByIdAndUpdate(
      consulta,
      bodyPostman,
      validarDatos
    );

    if (!documentUpdate) {
      return next(new ErrorClass(`ID no Encontrado : ${req.originalUrl}`, 404));
    }

    // 1.0 Las validaciones para crear datos/esquemas son automaticas
    // 2.0 para para actualizar PATCH, se debe colocar runValidators:true
    // 3.0 es importante, porque en nuestros datos podemos tener listas-de-valores dificultad : ['facil','medio','dificil']
    //   => entonces, al momento de actualizar los datos, debemos asegurarnos que se respete solo colocar esa lista-de-valores

    resp.status(201).json({
      status: 'success patchId',
      data: {
        documentUpdate,
      },
    });
  });
};

exports.deleteElementoId = function (database) {
  return AsyncFunction(async function (req, resp, next) {
    // 03 tercer  Control-de-ID
    // const documentFind = await database.findOne({ _id: req.params.id });     // forma antigua
    // const documentDelete = await database.deleteOne({ _id: req.params.id }); // forma antigua
    const documentDelete = await database.findByIdAndDelete(req.params.id); //

    if (!documentDelete) {
      return next(new ErrorClass(`ID no Encontrado : ${req.originalUrl}`, 404));
    }

    resp.status(201).json({
      status: 'success deleteId',
      data: {
        documentDelete,
      },
    });
  });
};

// esto es para cuando quieras usar como opciones a --populate--
exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id); // la consulta inicia  -- Model.findById(req.params.id).populate("misReviews")--
    if (popOptions) query = query.populate(popOptions); // la consulta agrega -- Model.findById(req.params.id).populate("misReviews")--
    const doc = await query; // la consulta recien se guarda  --await Model.findById(req.params.id).populate("misReviews")--

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
