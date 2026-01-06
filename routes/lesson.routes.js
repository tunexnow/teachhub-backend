const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, isTeacher, verifyTokenOptional } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Lessons
 *   description: Lesson management endpoints
 */

/**
 * @swagger
 * /lessons:
 *   post:
 *     summary: Create a new lesson (Teacher only)
 *     tags: [Lessons]
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
 *               - courseId
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               subtitle:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [video, text, game]
 *               courseId:
 *                 type: string
 *               content:
 *                 type: object
 *     responses:
 *       201:
 *         description: Lesson created successfully
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
 *                 subtitle:
 *                   type: string
 *                 type:
 *                   type: string
 *                 courseId:
 *                   type: string
 *                   format: uuid
 *                 content:
 *                   type: object
 *                   description: Flexible JSON content field
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 */
// Create Lesson (Teacher only)
router.post('/', [verifyToken, isTeacher], async (req, res) => {
    const { title, subtitle, type, courseId, content } = req.body;

    if (!title || !courseId || !content) {
        return res.status(400).json({ message: 'Title, courseId, and content are required' });
    }

    // Basic validation for content (kept simple for prototype)
    // const { videoUrl, gameEmbedUrl, flashcards, quiz } = content;

    try {
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (course.createdBy !== req.userId) {
            return res.status(403).json({ message: 'You usually can only add lessons to your own courses.' });
        }

        const lesson = await prisma.lesson.create({
            data: {
                title,
                subtitle,
                type: type || 'text',
                courseId,
                content
            }
        });
        res.status(201).json(lesson);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating lesson' });
    }
});

/**
 * @swagger
 * /lessons/{id}:
 *   get:
 *     summary: Get lesson details
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lesson details with full content
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
 *                 subtitle:
 *                   type: string
 *                 type:
 *                   type: string
 *                   enum: [video, text, game]
 *                 content:
 *                   type: object
 *                 courseId:
 *                   type: string
 *                   format: uuid
 *       404:
 *         description: Lesson not found
 */
// Get Lesson Details (Public) - Includes full content
router.get('/:id', verifyTokenOptional, async (req, res) => {
    const { id } = req.params;

    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id: id }
        });

        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        let isCompleted = false;
        if (req.userId) {
            const completion = await prisma.lessonCompletion.findUnique({
                where: {
                    userId_lessonId: {
                        userId: req.userId,
                        lessonId: id
                    }
                }
            });
            isCompleted = !!completion;
        }

        res.json({ ...lesson, isCompleted });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching lesson' });
    }
});

/**
 * @swagger
 * /lessons/{id}/complete:
 *   post:
 *     summary: Mark a lesson as complete
 *     tags: [Lessons]
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
 *         description: Lesson marked as complete
 *       404:
 *         description: Lesson not found
 */
// Mark Lesson as Complete
router.post('/:id/complete', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const lesson = await prisma.lesson.findUnique({ where: { id } });

        if (!lesson) {
            return res.status(404).json({ message: 'Lesson not found' });
        }

        // Create or update completion (idempotent)
        await prisma.lessonCompletion.upsert({
            where: {
                userId_lessonId: {
                    userId: req.userId,
                    lessonId: id
                }
            },
            update: { completedAt: new Date() },
            create: {
                userId: req.userId,
                lessonId: id
            }
        });

        res.json({ message: 'Lesson marked as complete' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error marking lesson as complete' });
    }
});

module.exports = router;
