const passport = require('passport');
const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');
const Usuarios = mongoose.model('Usuarios');
const crypto = require('crypto');
const enviarEmail = require('../handlers/email');

exports.autenticarUsuario = passport.authenticate('local',{
    successRedirect:'/administracion',
    failureRedirect:'/iniciar-sesion',
    failureFlash:true,
    badRequestMessage:'Ambos campos son obligatorios'
});

//Revisar si el usuario esta autenticado o no 
exports.verificarUsuario = (req, res, next)=>{

    //Revisar el usuario
    if(req.isAuthenticated()){
        return next(); //estan autenticados
    }

    //Redireccionar
    res.redirect('/iniciar-sesion');
}
exports.mostrarPanel = async (req, res)=>{

    //Consultar el usuario autenticado 
    const vacantes = await Vacante.find({autor:req.user._id});

   res.render('administracion',{
       nombrePagina:'Panel de Aministración',
       tagline:'Crea y administra tus vacantes desde aqui',
       cerrarSesion:true,
       nombre: req.user.nombre,
       imagen:req.user.imagen,
       vacantes
   })
}
exports.cerrarSesion=(req,res)=>{
    req.logout();
    req.flash('correcto', 'Cerraste Sesión Correctamente');
    return res.redirect('/iniciar-sesion');
}


/**Formulario para reiniciar el password */
exports.formularioRestablecerPassword=(req,res)=>{
    res.render('reestablecer-password',{
        nombrePagina:' Reestablecer tu Password',
        tagline:'Si ya tienes una cuentas pero olvidaste tu password, coloca tu email'
    })
}

// Generar el Token en la tabla del usuario
exports.enviarToken= async(req,res)=>{
    const usuario= await Usuarios.findOne({email: req.body.email});

    if(!usuario){
        req.flash('error', 'No existe esa cuenta');
        return res.redirect('/iniciar-sesion');
    }

    // El usuario existe, generar token 
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expira = Date.now() + 3600000;

    //Guardar el usuario 
    await usuario.save();
    const resetUrl =`http://${req.headers.host}/reestablecer-password/${usuario.token}`;
     
    //console.log(resetUrl);
    
    // Enviar notificaciones por email 
    await enviarEmail.enviar({
        usuario,
        subject: 'Password Reset',
        resetUrl,
        archivo:'reset'
    })
    //Todo correcto
    req.flash('correcto', 'Revistar tu email para las indicaciones ');
    res.redirect('/iniciar-sesion');
}

//Valida si es token es valido y el usuario existe, muestra la vista
exports.reestablecerPassword= async(req, res)=>{
    const usuario = await Usuarios.findOne({
        token: req.params.token,
        expira:{
            $gt: Date.now()
        }
    });

    if(!usuario){
        req.flash('error', 'El formulario ya no es valido, intennta de nuevo');
        return res.redirect('/reestablecer-Password');
    }

    //Todo bien, mostrar el formulario
    res.render('nuevo-password',{
        nombrePagina:'Nuevo Password'
    })
}

//Almacena el nuevo password rn la BD
exports.guardarPassword= async(req,res)=>{
    const usuario = await Usuarios.findOne({
        token: req.params.token,
        expira:{
            $gt: Date.now()
        }
    });

//No existe el usuario o el token es invalido
if(!usuario){
        req.flash('error', 'El formulario ya no es valido, intennta de nuevo');
        return res.redirect('/reestablecer-Password');
    }

// asignar nuevo password, limpiar valores previos
usuario.password = req.body.password;
usuario.token = undefined;
usuario.expira = undefined;

//guardar en la base de datos
await usuario.save();

// redirigir
req.flash('correcto','Password Modificado Correctamente');
res.redirect('/iniciar-sesion');
}