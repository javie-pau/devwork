const express = require('express');
const router = express.Router();

const homeController = require('../controllers/homeController');
const vacantesController = require('../controllers/vacantesController');
const usuariosController = require('../controllers/usuariosController');
const authController = require('../controllers/authController');

module.exports = ()=>{
    router.get('/',homeController.mostrarTrabajos);

    //crear vacantes
    router.get('/vacantes/nueva',
    authController.verificarUsuario,
    vacantesController.formularioNuevaVacante);

    router.post('/vacantes/nueva',
    authController.verificarUsuario,
    vacantesController.validarVacantes,
    vacantesController.agregarVacante);

    //Mostrar vacantes(Individual)
    router.get('/vacantes/:url',
    vacantesController.mostrarVacante);

    //Editar Vacante
    router.get('/vacantes/editar/:url',
    authController.verificarUsuario,
    vacantesController.formularioEditarVacante);

    router.post('/vacantes/editar/:url',
    authController.verificarUsuario,
    vacantesController.editarVacante);

    //Eliminar Vacante 
    router.delete('/vacantes/eliminar/:id',
    vacantesController.eliminarVacante);

    //crear cuentas Usuarios 
    router.get('/crear-cuenta',
    usuariosController.formularioCrearCuenta);

    router.post('/crear-cuenta',
    usuariosController.validarRegistro,
    usuariosController.crearUsuario);
    
    //Cerrar sesion 
    router.get('/cerrar-sesion',
    authController.verificarUsuario,
    authController.cerrarSesion);

    //Resetear password (emails)
    router.get('/reestablecer-password',
    authController.formularioRestablecerPassword)
     
    router.post('/reestablecer-password',
    authController.enviarToken);
    
     //Resetear password (Almacenar en la BD)
     router.get('/reestablecer-password/:token',
     authController.reestablecerPassword);

     router.post('/reestablecer-password/:token',
     authController.guardarPassword);


    //Autentica Usuarios
    router.get('/iniciar-sesion',
    usuariosController.formularioIniciarSesion);

    router.post('/iniciar-sesion',
    authController.autenticarUsuario);

   
    
    // Panel de administración 
    router.get('/administracion',
    authController.verificarUsuario,
    authController.mostrarPanel);
    
    //Editar Perfil 
    router.get('/editar-perfil', 
    authController.verificarUsuario,
    usuariosController.editarFormularioPerfil);

    router.post('/editar-perfil', 
    authController.verificarUsuario,
    usuariosController.subirImagen,
    usuariosController.editarPerfil);

    //Recibir Mensajes
    router.post('/vacantes/:url',
    vacantesController.subirCv,
    vacantesController.contactar);

    //Muestra los Candidatos 
    router.get('/candidatos/:id',
    authController.verificarUsuario,
    vacantesController.mostrarCandidatos);

    //buscador de vacantes
    router.post('/buscador', vacantesController.buscarVacantes);

    return router;
}