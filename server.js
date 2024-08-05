'use strict';

const Hapi = require('@hapi/hapi');
const Joi = require('joi');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const HapiSwagger = require('hapi-swagger');

const books = [
    { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
    { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee' },
];

const init = async () => {
    try {
        const server = Hapi.server({
            port: 3002,
            host: 'localhost'
        });

        const swaggerOptions = {
            info: {
                title: 'Books API Documentation',
                version: '1.0.0',
            },
            securityDefinitions: {
                jwt: {
                    type: 'apiKey',
                    name: 'Authorization',
                    in: 'header'
                }
            },
            security: [{ jwt: [] }],
            swaggerUI: true,
            documentationPage: true,
            documentationPath: '/documentation'
        };

        await server.register([
            Inert,
            Vision,
            {
                plugin: HapiSwagger,
                options: swaggerOptions
            }
        ]);

        server.route({
            method: 'GET',
            path: '/books',
            handler: (request, h) => {
                return books;
            },
            options: {
                tags: ['api'],
                description: 'Get all books'
            }
        });

        server.route({
            method: 'GET',
            path: '/books/{id}',
            handler: (request, h) => {
                const book = books.find(b => b.id === parseInt(request.params.id));
                if (!book) {
                    return h.response('Book not found').code(404);
                }
                return book;
            },
            options: {
                tags: ['api'],
                description: 'Get a book by id',
                validate: {
                    params: Joi.object({
                        id: Joi.number().integer().required().description('The id of the book')
                    })
                },
                response: {
                    schema: Joi.object({
                        id: Joi.number().required(),
                        title: Joi.string().required(),
                        author: Joi.string().required()
                    }).label('Book')
                }
            }
        });

        server.route({
            method: 'POST',
            path: '/books',
            handler: (request, h) => {
                const book = {
                    id: books.length + 1,
                    title: request.payload.title,
                    author: request.payload.author
                };
                books.push(book);
                return h.response(book).code(201);
            },
            options: {
                tags: ['api'],
                description: 'Add a new book',
                validate: {
                    payload: Joi.object({
                        title: Joi.string().required().description('The title of the book'),
                        author: Joi.string().required().description('The author of the book')
                    })
                },
                response: {
                    schema: Joi.object({
                        id: Joi.number().required(),
                        title: Joi.string().required(),
                        author: Joi.string().required()
                    }).label('NewBook')
                }
            }
        });

        await server.start();
        console.log('Server running on %s', server.info.uri);
        console.log('Documentation available at: %s/documentation', server.info.uri);
    } catch (err) {
        console.error('Error starting server:', err);
    }
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();