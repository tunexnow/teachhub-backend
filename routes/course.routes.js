const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, isTeacher } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management endpoints
 */

/**
 * @swagger
 * /courses:
 *   post:
 *     summary: Create a new course (Teacher only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 thumbnail:
 *                   type: string
 *                 createdBy:
 *                   type: string
 *                   format: uuid
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 */
// Create Course (Teacher only)
router.post('/', [verifyToken, isTeacher], async (req, res) => {
    const { title, description, thumbnail } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
    }

    try {
        const course = await prisma.course.create({
            data: {
                title,
                description,
                thumbnail,
                createdBy: req.userId
            }
        });
        res.status(201).json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating course' });
    }
});

/**
 * @swagger
 * /courses:
 *   get:
 *     summary: List all courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: List of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     format: uuid
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   thumbnail:
 *                     type: string
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 */
// List all courses (Public)
router.get('/', async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            include: {
                user: {
                    select: { id: true, email: true, name: true, role: true }
                }
            }
        });
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching courses' });
    }
});

/**
 * @swagger
 * /courses/{id}:
 *   get:
 *     summary: Get course details
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course details with lessons and instructor info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   format: uuid
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 thumbnail:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                 lessons:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       title:
 *                         type: string
 *                       type:
 *                         type: string
 *       404:
 *         description: Course not found
 */
// Get Course Details (Public)
router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const course = await prisma.course.findUnique({
            where: { id: id },
            include: {
                user: {
                    select: { id: true, email: true, name: true }
                },
                lessons: {
                    select: { id: true, title: true, type: true }
                }
            }
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.json(course);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching course details' });
    }
});

module.exports = router;
