const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    try {
        // 1. Create Teacher
        const email = 'demo_teacher@teachhub.com';
        const password = 'Password123!';
        const hashedPassword = await bcrypt.hash(password, 8);

        console.log(`Creating/Updating teacher: ${email}`);

        const teacher = await prisma.user.upsert({
            where: { email },
            update: {
                isApproved: true, // Ensure they are approved if they already exist
                role: 'teacher'
            },
            create: {
                name: 'Demo Teacher',
                email,
                password: hashedPassword,
                role: 'teacher',
                isApproved: true // Auto-approve for seeding
            }
        });

        console.log(`✅ Teacher Ready: ${teacher.id}`);

        // 2. Create Courses
        const coursesData = [
            {
                title: 'Introduction to React Native',
                description: 'Learn to build native mobile apps using React logic. This course covers components, navigation, and state management.',
                thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png',
                duration: 120,
                status: 'PUBLISHED',
                lessons: [
                    {
                        title: 'Setup Environment',
                        content: { type: 'video', url: 'https://www.youtube.com/watch?v=0-S5a0eXPoc', body: 'Setting up Expo and React Native CLI.' }
                    },
                    {
                        title: 'Components & Props',
                        content: { type: 'text', body: 'Components are the building blocks of React Native.' }
                    }
                ]
            },
            {
                title: 'Advanced Node.js Patterns',
                description: 'Master asynchronous programming, streams, and design patterns in Node.js for scalable backends.',
                thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg',
                duration: 180,
                status: 'PUBLISHED',
                lessons: [
                    {
                        title: 'Event Loop Explained',
                        content: { type: 'video', url: 'https://www.youtube.com/watch?v=8aGhZQkoFbQ', body: 'Understanding the phases of the event loop.' }
                    },
                    {
                        title: 'Streams and Buffers',
                        content: { type: 'text', body: 'Handling large data efficiently with pipelines.' }
                    }
                ]
            }
        ];

        console.log('Seeding Courses...');

        for (const courseData of coursesData) {
            const { lessons, ...courseInfo } = courseData;

            // Check if course exists to avoid duplication (optional, based on title)
            const existingCourse = await prisma.course.findFirst({
                where: { title: courseInfo.title, createdBy: teacher.id }
            });

            if (existingCourse) {
                console.log(`Skipping existing course: ${courseInfo.title}`);
                continue;
            }

            const course = await prisma.course.create({
                data: {
                    ...courseInfo,
                    createdBy: teacher.id,
                    lessons: {
                        create: lessons.map(l => ({
                            title: l.title,
                            content: l.content // ensuring this matches Json type
                        }))
                    }
                }
            });
            console.log(`✅ Created course: "${course.title}" with ${lessons.length} lessons`);
        }

        console.log('🎉 Seeding complete!');
        console.log('------------------------------------------------');
        console.log('Credentials:');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('------------------------------------------------');

    } catch (error) {
        console.error('❌ Seeding Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
