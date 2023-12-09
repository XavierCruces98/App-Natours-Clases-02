console.log(`holaa test`);

const miLogin = document.querySelector('#miLogin');

miLogin.addEventListener('click', async function (e) {
  e.preventDefault();
  //xavier@example.com
  //test4321
  const respLogin = await getLogin();

  if (respLogin.status === 'success POST login') {
    //window.location.replace('/api/v1/tours');
    window.location.replace('/ver-perfil');
    window.localStorage.setItem('respLogin', JSON.stringify(respLogin));

    console.log(respLogin); // aqui estas recibiendo datos del usuario
  }
});

console.log(boton);

//-------------------------------------------------------------------------------------------
const boton = document.querySelector('#boton-perfil');

boton.addEventListener('click', async function (e) {
  e.preventDefault();
  const respLogin = JSON.parse(window.localStorage.getItem('respLogin'));
  const respTours = await getTours(respLogin);

  console.log({ login: respLogin });
  console.log({ tours: respTours });
});

//-------------------------------------------------------------------------------------------

async function getTours(resp) {
  const headers = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${resp.tokenJWT}`,
    },
  };

  const misTours = await fetch(
    'http://localhost:3000/api/v1/tours/top-5-tours-baratos-bestCalificados',
    headers
  );

  const respuesta = await misTours.json();

  return respuesta;
}

async function getLogin() {
  const email = document.querySelector('#login-email').value;
  const password = document.querySelector('#login-password').value;
  const miJson = JSON.stringify({ email, password });

  const headers = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: miJson,
  };
  const login = await fetch(
    'http://localhost:3000/api/v1/users/login',
    headers
  );
  const respuesta = await login.json();

  return respuesta;
}
