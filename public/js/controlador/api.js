export const logout = async function () {
  const headers = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const login = await fetch(
    'http://localhost:3000/api/v1/users/logout',
    headers
  );
  const respuesta = await login.json();
  console.log(respuesta.status);

  if (respuesta.status === 'sucess logout') {
    window.location.replace('/home');
  }
};

export const login = async function (email, password) {
  const headers = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  };

  const login = await fetch(
    'http://localhost:3000/api/v1/users/login',
    headers
  );
  const respuesta = await login.json();
  console.log(respuesta.status);

  if (respuesta.status === 'sucess POST login') {
    window.location.replace('/me');
  }
};

export const signup = async function (
  nombre,
  email,
  password,
  passwordConfirm
) {
  const headers = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ nombre, email, password, passwordConfirm }),
  };

  const login = await fetch(
    'http://localhost:3000/api/v1/users/signup',
    headers
  );
  const respuesta = await login.json();
  console.log(respuesta);

  if (respuesta.status === 'Success Signup') {
    window.location.replace('/emailEnviado');
  }
};
