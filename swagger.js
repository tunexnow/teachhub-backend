const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'TeachHub API',
            version: '1.0.0',
            description: 'API Documentation for TeachHub Backend Prototype',
            contact: {
                name: 'Tunde (Backend Dev)',
            },
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Local server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{
            bearerAuth: []
        }],
    },
    apis: ['./routes/*.js'], // Files containing annotations
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };
