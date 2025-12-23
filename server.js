const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to TeachHub API' });
});

const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const lessonRoutes = require('./routes/lesson.routes');

const { swaggerUi, specs } = require('./swagger');

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Default Route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to TeachHub API', docs: '/api-docs' });
});
app.get('/api', (req, res) => {
    res.json({ message: 'Welcome to TeachHub API', docs: '/api-docs' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
