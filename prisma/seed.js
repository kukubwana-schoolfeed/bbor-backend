const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('bbor2026admin', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@bbor.org' },
    update: {},
    create: {
      email: 'admin@bbor.org',
      password: hashedPassword,
      name: 'BBOR Admin',
      role: 'admin'
    }
  });

  console.log('✅ Created admin user:', admin.email);

  // Create sample causes
  const causes = await Promise.all([
    prisma.cause.create({
      data: {
        name: 'School Supplies',
        amount: 500,
        currency: 'ZMW',
        description: 'Provides books and pens for 5 students',
        icon: '📚',
        status: 'Active',
        order: 1
      }
    }),
    prisma.cause.create({
      data: {
        name: 'Accommodation',
        amount: 2000,
        currency: 'ZMW',
        description: 'Shelter for one child for a month',
        icon: '🏠',
        status: 'Active',
        order: 2
      }
    }),
    prisma.cause.create({
      data: {
        name: 'Meals for 10 Children',
        amount: 300,
        currency: 'ZMW',
        description: 'Nutritious meals for 10 children for one week',
        icon: '🍽️',
        status: 'Active',
        order: 3
      }
    })
  ]);

  console.log(`✅ Created ${causes.length} causes`);

  // Create sample FAQs
  const faqs = await Promise.all([
    prisma.fAQ.create({
      data: {
        question: 'How do I donate?',
        answer: 'You can donate through our secure payment gateway using your credit/debit card or mobile money.',
        category: 'Donations',
        order: 1,
        status: 'Active'
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'Is my donation tax-deductible?',
        answer: 'Yes, BBOR is a registered charity and all donations are tax-deductible.',
        category: 'Donations',
        order: 2,
        status: 'Active'
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'How are funds used?',
        answer: 'Funds go directly to supporting orphaned children with food, shelter, education, and healthcare.',
        category: 'About',
        order: 1,
        status: 'Active'
      }
    })
  ]);

  console.log(`✅ Created ${faqs.length} FAQs`);

  // Create sample orphan stories
  const stories = await Promise.all([
    prisma.story.create({
      data: {
        name: 'Katema Lenard',
        story: 'My name is Katema Lenard and I am in grade five (5). I was a street boy and quite unfortunate...',
        imageUrl: '/images/katema.png',
        status: 'Active',
        order: 1
      }
    }),
    prisma.story.create({
      data: {
        name: 'Amaal Angela Povia',
        story: 'My name is Amaal Angela Povia and I am 16 years of age...',
        imageUrl: '/images/amal.png',
        status: 'Active',
        order: 2
      }
    })
  ]);

  console.log(`✅ Created ${stories.length} stories`);

  // Create sample news
  const news = await Promise.all([
    prisma.news.create({
      data: {
        title: 'BBOR Opens New Building',
        description: 'We are proud to announce the opening of our new facility that will house 100 more children.',
        date: new Date('2026-02-01'),
        icon: '🏠',
        useImage: false,
        status: 'Published'
      }
    }),
    prisma.news.create({
      data: {
        title: 'Graduation Ceremony Success',
        description: '20 children graduated from our vocational training program this year.',
        date: new Date('2026-01-15'),
        icon: '🎓',
        useImage: false,
        status: 'Published'
      }
    })
  ]);

  console.log(`✅ Created ${news.length} news articles`);

  // Create site images
  const images = await Promise.all([
    prisma.siteImage.create({
      data: {
        page: 'Home',
        location: 'Hero Background',
        currentUrl: '/images/IMG-20230715-WA0004.png',
        description: 'Main hero image'
      }
    }),
    prisma.siteImage.create({
      data: {
        page: 'About',
        location: 'Hero Background',
        currentUrl: '/images/IMG-20230715-WA0004.png',
        description: 'About page hero'
      }
    })
  ]);

  console.log(`✅ Created ${images.length} site images`);

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
