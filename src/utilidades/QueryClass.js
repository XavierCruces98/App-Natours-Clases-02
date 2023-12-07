const cloneDeep = require('lodash.clonedeep');

module.exports = class QueryClass {
  #query;
  #DB_tour;
  #busqueda;
  #camposExcluidos = ['sort', 'miPagina', 'limit', 'misFields'];
  #regex = /\b(gte|lte|gt|lt)\b/g;

  // nota asi es el constructor en Javascript
  constructor(miQuery, DB_tour) {
    this.#query = { ...miQuery };
    this.#DB_tour = DB_tour;
  }

  filtrarYbuscar() {
    this.interarQuery();
    this.regexQuery();
    this.#busqueda = this.#DB_tour.find(this.querySinFiltros()); // buscar, aqui esta como en un trance
    return this;
  }

  //////---------------------Funciones------------------------------
  interarQuery() {
    //tours?sort=duracion&sort=precio ===> sort:[duracion, precio] (aqui el "split(',')" no funciona ❌)
    //tours?sort=duracion,precio      ===> sort:"duracion,precio" (aqui el "split(',') si funciona ✅")
    // console.log(this.#query);

    Object.keys(this.#query) //
      .map((propiedad) => {
        // si es un array, ya no lo iteramos
        const isArray = Array.isArray(this.#query[propiedad]);
        if (isArray) return;

        const validacion = this.#query[propiedad].toString().includes('object');
        if (!validacion) {
          // isNan()===TRUE (string)
          // isNan()===False (number), no importa si 0,1,etc, reconoce el numero
          this.#query[propiedad] = this.#query[propiedad]
            .split(',')
            .map((valor) => (isNaN(valor) ? valor : +valor))
            .map((valor) => (valor.length === 1 ? valor[0] : valor)); // para array [1valor]

          //console.log(`PROPIEDADES ITERADAS`);
          //console.log(this.#query[propiedad]);
        }
      });
    console.log(`QUERY REALIZADA`);
    console.log(this.#query);


    return this;
  }

  regexQuery() {
    const stringQuery = JSON.stringify(this.#query).replace(
      this.#regex,
      (el) => '$' + el
    );
    this.#query = JSON.parse(stringQuery);
    return this;
  }

  querySinFiltros() {
    const querySinFiltros = cloneDeep(this.#query); // creando copia del Query
    this.#camposExcluidos.forEach((el) => delete querySinFiltros[el]);
    return querySinFiltros; // regresamos una copia del Query, para no afectar al #Query original
  }

  //--------------- Ordenar + misFields ---------------------------
  ordenar() {
    const ordenar = this.#query.sort?.join(' ');
    this.#busqueda = this.#busqueda.sort(ordenar); // sort

    if (!ordenar) {
      this.#busqueda = this.#busqueda.sort('-creadoEn'); // ordenar pordefecto
      return this;
    }
    return this;
  }
  misFields() {
    //this.#busqueda = this.#busqueda.sort('-creadoEn'); // ordenar pordefecto // si ponemos esto lo volvera a ordenar
    const campos = this.#query.misFields?.join(' '); // nota aqui es join(" ") (la forma correcta)
    this.#busqueda = this.#busqueda.select(campos); //nota misFields

    return this;
  }

  //--------------- Paginacion---------------------------
  async paginacion() {
    // Step01 : creando variables de miPaginacion
    // dentro de "#query" se tiene las propiedad "mipagina, limit, sort, misFields"
    const numeroDatos = await this.#DB_tour.countDocuments(); // haciendo nuestra propia busqueda

    const miPagina = +this.#query.miPagina || 1; // si no existe => valor sera 1
    const limit = +this.#query.limit || 100; // si no existe => valor 100 resultados, para cualquier consulta
    const salto = (miPagina - 1) * limit;

    //Pagina=0 ó Pagina=1 <=> Pagina1
    //Pagina=2 <=> Pagina2
    //Pagina=3 <=> Pagina3 ....
    if (salto >= numeroDatos) {
      throw new Error(
        `ERROR miPaginacion ${salto} es mayor a NumDatos ${numeroDatos}`
      );
    }
    this.#busqueda.skip(salto).limit(limit);
    //console.log(this.#busqueda);
    return this; // si es necesario
  }

  //////---------------------Fin de Funciones------------------------------
  getQuery() {
    return this.#query;
  }
  getBusqueda() {
    return this.#busqueda;
  }
};
