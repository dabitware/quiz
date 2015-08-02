var models = require('../models/models.js');

// Autoload - factoriza el código si ruta incluye :quizId
exports.load = function(req, res, next, quizId) {
	models.Quiz.find({
		where: {
			id: Number(quizId)
			},
			include: [{
                model: models.Comment
            }]
        }).then(function(quiz) {
			if (quiz) {
				req.quiz = quiz;
				next();
			} else { next(new Error('No existe quizId=' + quizId)); }
		}
	).catch(function(error) { next(error);});
};

// GET /quizes
exports.index = function(req, res) {
	var search = "%"
	if (req.query.search) {
		search += req.query.search.replace(/\s/g,"%") + "%";
		search = search.toUpperCase();
	} 
	
	models.Quiz.findAll({where:["upper(pregunta) like ?", search], order:"pregunta ASC" }).then(function(quizes) {
		res.render('quizes/index', { quizes: quizes, errors: []});
	}).catch(function(error) { next(error);})
};

// GET /quizes/:id
exports.show = function(req, res) {
	res.render('quizes/show', { quiz: req.quiz, errors: []});
};

// GET /quizes/:id/answer
exports.answer = function(req, res) {
	var resultado = 'Incorrecto';
	if (req.query.respuesta === req.quiz.respuesta) {
		resultado = 'Correcto';
	}
	res.render('quizes/answer', {quiz: req.quiz, respuesta: resultado, errors: []});
};
// GET /quizes/new
exports.new = function(req, res) {
	var quiz = models.Quiz.build(
		{pregunta: "Pregunta", respuesta: "Respuesta"}
	);

	res.render('quizes/new', {quiz: quiz, errors: []});
};

// POST /quizes/create
exports.create = function(req, res) {
	var quiz = models.Quiz.build( req.body.quiz );
	quiz
	.validate()
	.then(
		function(err){
			if (err) {
				res.render('quizes/new', {quiz: quiz, errors: err.errors});
			} else {
				quiz // save: guarda en DB campos pregunta y respuesta de quiz
				.save({fields: ["pregunta", "respuesta", "tema"]})
				.then( function(){ res.redirect('/quizes')}) 
			}      // res.redirect: Redirección HTTP a lista de preguntas
		}
	).catch(function(error){next(error)});
};

// GET /quizes/:id/edit
exports.edit = function(req, res) {
	var quiz = req.quiz;  // req.quiz: autoload de instancia de quiz

	res.render('quizes/edit', {quiz: quiz, errors: []});
};

// PUT /quizes/:id
exports.update = function(req, res) {
	req.quiz.pregunta  = req.body.quiz.pregunta;
	req.quiz.respuesta = req.body.quiz.respuesta;
	req.quiz.tema = req.body.quiz.tema;

	req.quiz
		.validate()
		.then(
			function(err){
			if (err) {
				res.render('quizes/edit', {quiz: req.quiz, errors: err.errors});
			} else {
				req.quiz     // save: guarda campos pregunta y respuesta en DB
				.save( {fields: ["pregunta", "respuesta","tema"]})
				.then( function(){ res.redirect('/quizes');});
			}     // Redirección HTTP a lista de preguntas (URL relativo)
		}
	).catch(function(error){next(error)});
};

// DELETE /quizes/:id
exports.destroy = function(req, res) {
	req.quiz.destroy().then( function() {
		res.redirect('/quizes');
	}).catch(function(error){next(error)});
};

// GET /quizes/stats
exports.statistics = function(req, res, next) {
	var stats = {};
	var errors = [];
	models.Quiz.count().then(
		function(count) {
			stats.quizes = count;
			models.Comment.count().then(
			function(count) {
				stats.comments = count;
				stats.quizcomments = count/stats.quizes;
				models.Comment.aggregate('QuizId', 'count', {'distinct': true }).then(
					function(count) {
						stats.quizcommented = count;
						stats.quizuncommented = stats.quizes-count;
						res.render('quizes/statistics.ejs', { statistics: stats, errors: errors });
					}
			  ).catch (function(error) {next(error);})
			}
		  ).catch (function(error) {next(error);})
		}
	).catch (function(error) {next(error);})
};