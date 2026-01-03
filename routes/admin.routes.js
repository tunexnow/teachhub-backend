const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @swagger
 * /admin/teachers/pending:
 *   get:
 *     summary: List pending teacher approvals
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending teachers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: 
 *                     type: string
 *                   name: 
 *                     type: string
 *                   email: 
 *                     type: string
 *                   isApproved:
 *                     type: boolean
 */
// Get Pending Teachers
router.get('/teachers/pending', [verifyToken, isAdmin], async (req, res) => {
    try {
        const pendingTeachers = await prisma.user.findMany({
            where: {
                role: 'teacher',
                isApproved: false
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isApproved: true,
                createdAt: true
            }
        });
        res.json(pendingTeachers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching pending teachers' });
    }
});

/**
 * @swagger
 * /admin/teachers/{id}/approve:
 *   put:
 *     summary: Approve a teacher account
 *     tags: [Admin]
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
 *         description: Teacher approved successfully
 *       404:
 *         description: User not found
 */
// Approve Teacher
router.put('/teachers/:id/approve', [verifyToken, isAdmin], async (req, res) => {
    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({ where: { id } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isApproved: true }
        });

        res.json({ message: 'Teacher approved successfully', user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error approving teacher' });
    }
});

module.exports = router;
