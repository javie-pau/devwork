const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');

const multer = require('multer');
const shortid = require('shortid');


exports. formularioNuevaVacante=(req,res)=>{

    res.render('nueva-vacante',{
        nombrePagina:'Nueva Vacante',
        tagline:'llena el formulario y publica tu vacante',
        cerrarSesion:true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    });
}

//Guardar las vacantes a la DB
exports.agregarVacante= async(req,res)=>{
    const vacante = new Vacante(req.body);

    //El autor  que lo creeo 
    vacante.autor = req.user._id;

    //crear arreglo de habilidades (Skills)
    vacante.skills= req.body.skills.split(',');

   //almacenarlo en la base de datos
   const nuevaVacante = await vacante.save()

   //redireccionar
   res.redirect(`/vacante/${nuevaVacante.url}`)
    
}

//muestra vacante
exports.mostrarVacante=async(req, res,next)=>{
    const vacante = await Vacante.findOne({url:req.params.url}).populate('autor');

    //si no hay resultados
    if(!vacante) return next();

    res.render('vacante',{
        vacante,
        nombrePagina: vacante.titulo,
        barra:true

    })
}

//Poner los campo de las vacantes
exports.formularioEditarVacante=async(req,res, next)=>{
    const vacante = await Vacante.findOne({url:req.params.url});

    //Si no encuentra vacantes
    if(!vacante) return next();

    res.render('editar-vacante',{
        vacante,
        nombrePagina:`Editar - ${vacante.titulo}`,
        cerrarSesion:true,
        nombre:req.user.nombre,
        imagen: req.user.imagen
    })
}

//Actualizar las vacantes
exports.editarVacante=async(req,res)=>{
    const vacanteActualizada = req.body;

    vacanteActualizada.skills = req.body.skills.split(',');

    const vacante = await Vacante.findOneAndUpdate({url: req.params.url},
        vacanteActualizada,{
        new:true,
        runValidators:true
       });
      res.redirect(`/vacantes/${vacante.url}`);
}

//Validar y Sanitizar los campos de las nuevas vacantes 
exports.validarVacantes = (req, res, next)=>{
    //Sanitizar los campos 
    req.sanitizeBody('titulo').escape();
    req.sanitizeBody('empresa').escape();
    req.sanitizeBody('ubicacion').escape();
    req.sanitizeBody('salario').escape();
    req.sanitizeBody('contrato').escape();
    req.sanitizeBody('skills').escape();

    //validar
    req.checkBody('titulo','Agrega un Titulo a la Vacante').notEmpty();
    req.checkBody('empresa','Agrega una empresa').notEmpty();
    req.checkBody('ubicacion','Agrega un Titulo a la Vacante').notEmpty();
    req.checkBody('contrato','Selecciona el Tipo de Contrato').notEmpty();
    req.checkBody('skills','Agrega al mens una habilidad').notEmpty();

    const errores = req.validationErrors();

    if(errores){
        //Recargar la vista con los errores
        req.flash('error', errores.map(error =>error.msg));

        res.render('nueva-vacante',{
            nombrePagina:'Nueva Vacante',
            tagline:'llena el formulario y publica tu vacante',
            cerrarSesion:true,
            nombre: req.user.nombre,
            mensajes:req.flash
        });
    }

    next();// Siguiente middleware
}

exports.eliminarVacante=async(req, res)=>{
    const {id}= req.params;

    const vacante = await Vacante.findById(id);

    if(verificarAutor(vacante, req.user)){
        //Todo bien, si es el usuario, eliminar
        vacante.remove();
        res.status(200).send('Vacante Eliminada Correctamente');
    }else{
        //No permitido 
        res.status(403).send('Error')

    }


}

const verificarAutor = (vacante ={}, usuario ={})=>{
    if(!vacante.autor.equals(usuario._id)){
        return false
    }
    return true;

}

//Subir archivos en PDF

exports.subirCv =(req, res, next)=>{
    upload(req, res, function(error){
        if(error){
            if(error instanceof multer.MulterError){
                if(error.code === 'LIMIT_FILE_SIZE'){
                    req.flash('error', 'El archivo es muy grabde: Máximo 100kb');
                }else{
                    req.flash('error',error.message);
                }
              }else{
                req.flash('error', error.message)
            }
            res.redirect('back');
            return;
        }else{
            return next();
        }
    }); 
}

//Opciones de Multer
const configuracionMulter={
    limits:{fileSize: 100000},
    storage: fileStorage = multer.diskStorage({
    destination: (req,file ,cb)=>{
        cb(null,__dirname+'../../public/uploads/cv');
       },
       filename:(req, file, cb)=>{
           const extension = file.mimetype.split('/')[1];
           cb(null,`${shortid.generate()}.${extension}`);

       }    
    }),
    fileFilter(req, file, cb){
        if(file.mimetype === 'application/pdf'){
            // el callback se ejecuta como true o false : true cuando la imagen se acepta 
            cb(null, true );  
        }else{
            cb(new Error('Formato no válido'), false);
        }
   }
}

const upload = multer(configuracionMulter).single('cv');

//Almacenar los candidatos en la BD 
exports.contactar = async(req, res, next)=>{

    const vacante = await Vacante.findOne({url: req.params.url});

    //Si no existe la vacante
    if(!vacante) return next();

    //Todo bien, construir el nuevo objeto
    const nuevoCandidato={
        nombre:req.body.nombre,
        email:req.body.email,
        cv: req.file.filename
    }

    //Almacenar la vacante 
    vacante.candidatos.push(nuevoCandidato);
    await vacante.save();

    //Mensaje flash y redireccion
    req.flash('correcto','Se envió Curriculum Correctamente');
    res.redirect('/');
}

exports.mostrarCandidatos = async(req, res, next)=>{
    const vacante = await Vacante.findById(req.params.id);
    

    if(vacante.autor != req.user._id.toString()){
        return next();
    }

    if(!vacante) return next();
   
    res.render('candidatos',{
        nombrePagina:`Candidatos Vacante - ${vacante.titulo}`,
        cerrarSesion:true,
        nombre: req.user.nombre,
        imagen:req.user.imagen,
        candidatos:vacante.candidatos

    })

}

//Buscador de vacantes
exports.buscarVacantes = async(req, res)=>{
    const vacantes = await Vacante.find({
        $text :{
            $search : req.body.q
        }
    });
    
    //mostrar la vacante
    res.render('home',{
        nombrePagina:`Resultados para la búsqueda:${req.body.q}`,
        barra:true,
        vacantes
    })

}