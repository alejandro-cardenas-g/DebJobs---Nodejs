const express = require('express');
const router = express.Router();

//Controladores

const HomeController = require('../controllers/HomeController');
const vacantesController = require('../controllers/vacantesController');
const usuariosController = require('../controllers/UsuariosController');
const authController = require('../controllers/AuthController');

module.exports = () =>{

    router.get('/', HomeController.mostrarTrabajos);

    router.get('/vacantes/nueva', 
        authController.verificarUsuario,
        vacantesController.formularioNuevaVacante
    );

    router.post('/vacantes/nueva', 
        authController.verificarUsuario,
        vacantesController.validarVacante,
        vacantesController.agregarVacante
    );
    
    router.get('/vacantes/:url', vacantesController.mostrarVacante);

    router.post('/vacantes/:url', 
        vacantesController.subirCV,
        vacantesController.contactar
    );

    router.get('/vacantes/editar/:url', 
        authController.verificarUsuario,
        vacantesController.formularioEditarVacante
    );

    router.post('/vacantes/editar/:url', 
        authController.verificarUsuario,
        vacantesController.validarVacante,
        vacantesController.editarVacante
    );

    router.delete('/vacantes/eliminar/:id',
        vacantesController.eliminarVacante
    );

    router.get('/crear-cuenta', usuariosController.formularioCrearCuenta);

    router.post('/crear-cuenta', 
        usuariosController.validarRegistro,
        usuariosController.crearUsuario);

    router.get('/iniciar-sesion', usuariosController.formularioIniciarSesion);

    router.post('/iniciar-sesion', authController.autenticarUsuario);

    router.get('/administracion', 
        authController.verificarUsuario,
        authController.mostrarPanel
    );

    router.get('/editar-perfil', 
        authController.verificarUsuario,
        usuariosController.formularioEditarPerfil
    );

    router.post('/editar-perfil', 
        authController.verificarUsuario,
        //usuariosController.validarEditarPerfil,
        usuariosController.subirImagen,
        usuariosController.editarPerfil
    );

    router.get('/cerrar-sesion',
        authController.verificarUsuario,
        authController.cerrarSesion
    )

    //Mostrar candidatos por vacante

    router.get('/candidatos/:id',
        authController.verificarUsuario,
        vacantesController.mostrarCandidatos
    );

    //Recuperar password

    router.get('/reestablecer-password',
        authController.formularioReestablecerPassword
    );

    router.post('/reestablecer-password',
        authController.enviarToken
    );

    router.get('/reestablecer-password/:token', authController.reestablecerPassword);
    router.post('/reestablecer-password/:token', authController.guardarPassword);

    //Buscador de vacantes

    router.post('/buscador', vacantesController.buscarVacantes);

    return router;

}