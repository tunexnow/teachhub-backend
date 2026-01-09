const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, isTeacher, verifyTokenOptional } = require('../middleware/auth.middleware');

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
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
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
 *                 duration:
 *                   type: integer
 *                 status:
 *                   type: string
 *                   enum: [DRAFT, PUBLISHED]
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
    const { title, description, thumbnail, duration } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required' });
    }

    try {
        const course = await prisma.course.create({
            data: {
                title,
                description,
                thumbnail,
                duration: duration || 0,
                createdBy: req.userId
            }
        });
        res.status(201).json(course);
    } catch (error) {
        console.error("CREATE COURSE ERROR:", error);
        res.status(500).json({ message: 'Error creating course', error: error.message });
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
 *                   duration:
 *                     type: integer
 *                   status:
 *                     type: string
 *                   numberOfLessons:
 *                     type: integer
 *                   completedLessons:
 *                     type: integer
 *                     description: Number of lessons completed by the authenticated user
 *                   progress:
 *                     type: integer
 *                     description: Calculated completion percentage (0-100)
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
router.get('/', verifyTokenOptional, async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            include: {
                user: {
                    select: { id: true, email: true, name: true, role: true }
                },
                _count: {
                    select: { lessons: true }
                }
            }
        });

        // If user is logged in, fetch their completed lessons for all courses
        let userCompletions = [];
        if (req.userId) {
            userCompletions = await prisma.lessonCompletion.findMany({
                where: { userId: req.userId },
                select: { lesson: { select: { courseId: true } } }
            });
        }

        const coursesWithStats = courses.map(course => {
            const numberOfLessons = course._count.lessons;
            let completedLessons = 0;
            let progress = 0;

            if (req.userId) {
                // Count completions for this specific course
                completedLessons = userCompletions.filter(c => c.lesson.courseId === course.id).length;
                progress = numberOfLessons > 0 ? Math.round((completedLessons / numberOfLessons) * 100) : 0;
            }

            return {
                ...course,
                numberOfLessons,
                completedLessons,
                progress
            };
        });

        res.json(coursesWithStats);
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
 *                 duration:
 *                   type: integer
 *                 progress:
 *                   type: integer
 *                   description: Calculated completion percentage (0-100)
 *                 numberOfLessons:
 *                   type: integer
 *                 completedLessons:
 *                   type: integer
 *                   description: Number of lessons completed by the authenticated user
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
router.get('/:id', verifyTokenOptional, async (req, res) => {
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
                },
                _count: {
                    select: { lessons: true }
                }
            }
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        let completedLessonsCount = 0;
        let completedLessonIds = [];

        if (req.userId) {
            const completed = await prisma.lessonCompletion.findMany({
                where: {
                    userId: req.userId,
                    lesson: { courseId: id }
                },
                select: { lessonId: true }
            });
            completedLessonsCount = completed.length;
            completedLessonIds = completed.map(c => c.lessonId);
        }

        // Inject isCompleted into lessons
        const lessonsWithCompletion = course.lessons.map(lesson => ({
            ...lesson,
            isCompleted: completedLessonIds.includes(lesson.id)
        }));

        const numberOfLessons = course._count.lessons;
        const progress = numberOfLessons > 0 ? Math.round((completedLessonsCount / numberOfLessons) * 100) : 0;

        res.json({
            ...course,
            lessons: lessonsWithCompletion,
            numberOfLessons,
            completedLessons: completedLessonsCount,
            progress
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching course details' });
    }
});

/**
 * @swagger
 * /courses/{id}:
 *   put:
 *     summary: Update a course (Teacher only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               duration:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Course updated successfully
 *       403:
 *         description: Unauthorized - You can only update your own courses
 *       404:
 *         description: Course not found
 */
// Update Course (Teacher only)
router.put('/:id', [verifyToken, isTeacher], async (req, res) => {
    const { id } = req.params;
    const { title, description, thumbnail, duration } = req.body;

    try {
        const course = await prisma.course.findUnique({ where: { id } });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.createdBy !== req.userId) {
            return res.status(403).json({ message: 'You can only update your own courses' });
        }

        const updatedCourse = await prisma.course.update({
            where: { id },
            data: {
                title,
                description,
                thumbnail,
                duration
            }
        });

        res.json(updatedCourse);
    } catch (error) {
        console.error("UPDATE COURSE ERROR:", error);
        res.status(500).json({ message: 'Error updating course', error: error.message });
    }
});

/**
 * @swagger
 * /courses/{id}/publish:
 *   put:
 *     summary: Publish a course (Teacher only)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course published successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: PUBLISHED
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Course not found
 */
// Publish Course (Teacher only)
router.put('/:id/publish', [verifyToken, isTeacher], async (req, res) => {
    const { id } = req.params;

    try {
        const course = await prisma.course.findUnique({ where: { id } });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.createdBy !== req.userId) {
            return res.status(403).json({ message: 'You can only publish your own courses' });
        }

        const updatedCourse = await prisma.course.update({
            where: { id },
            data: { status: 'PUBLISHED' }
        });

        res.json(updatedCourse);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error publishing course' });
    }
});

module.exports = router;
