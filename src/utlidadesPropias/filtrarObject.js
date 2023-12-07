const filtrarObject = function (miObject, ...propiedades) {
  const objectNew = {};
  Object.keys(miObject).forEach((propiedad) => {
    if (propiedades.includes(propiedad))
      objectNew[propiedad] = miObject[propiedad];
  });

  return objectNew;
};

module.exports = filtrarObject;

/*
const objecto = {
  nombre: 'xavier',
  email: 'xavier@example',
  direccion: 'pangaravi',
  casa: {
    cuartos: 4,
    banos: 5,
    camas: 10,
  },
};

const miNuevoObject = filtrarObject(objecto, 'nombre', 'casa');
console.log(miNuevoObject);
*/
