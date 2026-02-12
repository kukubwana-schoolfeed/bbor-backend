const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding BBOR database with current website data...\n');

  // 1. CREATE ADMIN USER
  console.log('👤 Creating admin user...');
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
  console.log('✅ Admin user created:', admin.email);

  // 2. CREATE CAUSES (from donate page)
  console.log('\n🎯 Creating donation causes...');
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
  console.log(`✅ Created ${causes.length} donation causes`);

  // 3. CREATE NEWS ARTICLES (from homepage)
  console.log('\n📰 Creating news articles...');
  const news = await Promise.all([
    prisma.news.create({
      data: {
        title: "BBOR's Vision for Expanding Support to Widows and Disabled Community Members",
        description: 'Beautiful Beginnings Outreach Relief (BBOR) not only focuses on supporting orphaned and vulnerable children but also extends its compassion to widows and disabled community members.',
        date: new Date('2024-09-16'),
        icon: '🏠',
        useImage: false,
        status: 'Published'
      }
    }),
    prisma.news.create({
      data: {
        title: 'Success Stories from BBOR: Transforming Lives One Child at a Time',
        description: 'At Beautiful Beginnings Outreach Relief (BBOR), we have seen firsthand the profound impact our programs have on the lives of orphaned and vulnerable children.',
        date: new Date('2024-09-16'),
        icon: '🎓',
        useImage: false,
        status: 'Published'
      }
    }),
    prisma.news.create({
      data: {
        title: "BBOR's Holistic Approach to Child Welfare: More Than Just Shelter",
        description: 'At Beautiful Beginnings Outreach Relief (BBOR), we understand that children need more than just food and shelter to thrive.',
        date: new Date('2024-09-16'),
        icon: '❤️',
        useImage: false,
        status: 'Published'
      }
    })
  ]);
  console.log(`✅ Created ${news.length} news articles`);

  // 4. CREATE ORPHAN STORIES (from about page)
  console.log('\n👥 Creating orphan stories...');
  const stories = await Promise.all([
    prisma.story.create({
      data: {
        name: 'Katema Lenard',
        story: 'My name is Katema Lenard and I am in grade five (5). I was a street boy and quite unfortunate, I had a miserable life on the streets. Most of the times, we used to sleep on an empty stomach because we could not afford to have any meals. At times, I used to sleep on stony bridges and roads because we could not afford shelter.\n\nHowever, through begging, I met sister Jameelah and did not only offer me a chance to go to school but eventually education has become a blessing such that I am now able to read and write.\n\nFortunately, through Beautiful Beginnings Outreach Relief (BBOR), my life has completely changed and has meaning and guidance. Currently, she has accommodated me at BBOR orphanage and I have a lovely family.',
        imageUrl: '/images/katema.png',
        status: 'Active',
        order: 1
      }
    }),
    prisma.story.create({
      data: {
        name: 'Amaal Angela Povia',
        story: 'ASALAM ALAIKUM!\nMy name is Amaal Angela Povia and I am 16 years of age and currently I am a resident of Lusaka with the auspice of Beautiful Beginnings Outreach Relief (BBOR). Partly, I lived happily with my mother and father together with my siblings as a happy family.\n\nUnfortunately, while enjoying the beautiful family moments, my father passed away. Thereafter, my mother started struggling just to feed us and manage our daily basic needs. Fortunately, she was guided by her cousin on how Beautiful Beginnings Outreach Relief (BBOR) aids at saving vulnerable families and the orphaned and that was how my existence at BBOR became into being.\n\nHowever, my experience under BBOR ever since auntie Jameelah took us in as a family, I have learnt how to read and write, proudly BBOR has been my savior to a being I am currently. Additionally, BBOR has blessed a being I am cause I least lack, I am fed, am given shelter, love and education.',
        imageUrl: '/images/amal.png',
        status: 'Active',
        order: 2
      }
    }),
    prisma.story.create({
      data: {
        name: 'Tembo Zeenat',
        story: 'My name is Tembo Zeenat and I am 23 years old. I was adopted into the orphanage when I was 4 years old in 2003. Having faced a number of unpleasant moments, I have been with Sister Jameelah and BBOR from Primary to Tertiary Education. Through Beautiful Beginnings Outreach Relief (BBOR), In 2022 I graduated with a fruitful Diploma in Educational science.\n\nHowever, without BBOR, life would have been terrible especially people of my gender because girls are always vulnerable in every single country and most of them would be in early Marriages or prostitution.\n\nLastly, to potential donors out there, I am an example of BBOR, your donations will not go in vain as they will help thousands of people.',
        imageUrl: '/images/tembo.png',
        status: 'Active',
        order: 3
      }
    }),
    prisma.story.create({
      data: {
        name: 'Chambwe Shaidah',
        story: 'They say; "Charity does not only help Muslims to get closer to Allah and purify their souls it also has many rewards that are mentioned in many Hadiths about charity." My name is Chambwe Shaidah and I am 17 years old. I am a resident of Lusaka and am currently at BBOR. I am the third born in a family of four (4).\n\nHowever, Beautiful Beginnings Outreach Relief (BBOR) has been a blessing unto my life particularly. My mother died when I was 3 years old. Unfortunately, just after death my father developed mental issues and suddenly got mad. Thereafter, my grandmother who lived in chibolya, Zambia took us in under her care and support together with my siblings.',
        imageUrl: '/images/chambwe.png',
        status: 'Active',
        order: 4
      }
    }),
    prisma.story.create({
      data: {
        name: 'Bharuchi Latifa',
        story: 'My name is Bharuchi Latifa and I am currently 21 years old. I did my Cambridge grade 11 (eleven) at Licef secondary school and also completed a short course and acquired a certificate in computers (I.T) at Makeni vocational training college. I am a single orphan and I grew up with my grandmother from my fathers side of the family. Fortunately, when I was 15, I met Jameelah Ohl from BBOR and I was welcomed with open arms.',
        imageUrl: '/images/latifa.png',
        status: 'Active',
        order: 5
      }
    })
  ]);
  console.log(`✅ Created ${stories.length} orphan stories`);

  // 5. CREATE FAQs (from FAQ page)
  console.log('\n❓ Creating FAQs...');
  const faqs = await Promise.all([
    prisma.fAQ.create({
      data: {
        question: 'How do I donate to BBOR?',
        answer: 'You can donate through our secure payment gateway using your credit/debit card or mobile money (Airtel Money, MTN, Zamtel). Visit our Donate page and select your preferred payment method.',
        category: 'Donations',
        order: 1,
        status: 'Active'
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'Is my donation tax-deductible?',
        answer: 'Yes, BBOR is a registered charity in Zambia and all donations are tax-deductible. We will provide you with a receipt for tax purposes.',
        category: 'Donations',
        order: 2,
        status: 'Active'
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'How are the funds used?',
        answer: 'Funds go directly to supporting orphaned children with food, shelter, education, healthcare, and vocational training. We maintain complete transparency in our financial reporting.',
        category: 'About',
        order: 1,
        status: 'Active'
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'Can I sponsor a specific child?',
        answer: 'Yes! We offer child sponsorship programs where you can support a specific child\'s education, healthcare, and daily needs. Contact us for more information.',
        category: 'Sponsorship',
        order: 1,
        status: 'Active'
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'How can I volunteer at BBOR?',
        answer: 'We welcome volunteers! You can help with teaching, healthcare, maintenance, or administrative tasks. Please contact us to discuss volunteer opportunities.',
        category: 'Volunteering',
        order: 1,
        status: 'Active'
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'Where is BBOR located?',
        answer: 'BBOR is located in Lusaka, Zambia. We serve over 350 orphaned and vulnerable children across the region.',
        category: 'General',
        order: 1,
        status: 'Active'
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'What is the minimum donation amount?',
        answer: 'There is no minimum donation amount. Every contribution, no matter how small, makes a difference in a child\'s life.',
        category: 'Donations',
        order: 3,
        status: 'Active'
      }
    }),
    prisma.fAQ.create({
      data: {
        question: 'How many children does BBOR support?',
        answer: 'BBOR currently provides care and support for over 350 orphaned and vulnerable children, with 230 living in our residential facility.',
        category: 'About',
        order: 2,
        status: 'Active'
      }
    })
  ]);
  console.log(`✅ Created ${faqs.length} FAQs`);

  // 6. CREATE SITE IMAGES
  console.log('\n🖼️ Creating site images...');
  const siteImages = await Promise.all([
    // Home page
    prisma.siteImage.create({
      data: {
        page: 'Home',
        location: 'Hero Background',
        currentUrl: '/images/IMG-20230715-WA0004.png',
        description: 'Main hero graduation photo'
      }
    }),
    prisma.siteImage.create({
      data: {
        page: 'Home',
        location: 'Impact Section Background',
        currentUrl: '/images/IMG-20240925-WA0234-300x300.png',
        description: 'Children eating - impact section'
      }
    }),
    prisma.siteImage.create({
      data: {
        page: 'Home',
        location: 'Empowering Futures Background',
        currentUrl: '/images/IMG-20230715-WA0004.png',
        description: 'Graduation photo - futures section'
      }
    }),
    // About page
    prisma.siteImage.create({
      data: {
        page: 'About',
        location: 'Hero Background',
        currentUrl: '/images/IMG-20230715-WA0004.png',
        description: 'About page hero image'
      }
    }),
    prisma.siteImage.create({
      data: {
        page: 'About',
        location: 'Who We Are Section',
        currentUrl: '/images/IMG-20240924-WA0031-300x300.png',
        description: 'BBOR team photo'
      }
    }),
    // Gallery page
    prisma.siteImage.create({
      data: {
        page: 'Gallery',
        location: 'Celebrations Album Cover',
        currentUrl: '/images/gallery/BBOR_celebrations.png',
        description: 'Celebrations album thumbnail'
      }
    }),
    prisma.siteImage.create({
      data: {
        page: 'Gallery',
        location: 'Building Project Album Cover',
        currentUrl: '/images/gallery/Bbor_building_project.png',
        description: 'Building project album thumbnail'
      }
    }),
    prisma.siteImage.create({
      data: {
        page: 'Gallery',
        location: 'Graduation Album Cover',
        currentUrl: '/images/gallery/Bbor_graduation_5.png',
        description: 'Graduation album thumbnail'
      }
    }),
    prisma.siteImage.create({
      data: {
        page: 'Gallery',
        location: 'Tours Album Cover',
        currentUrl: '/images/gallery/Bbor_tours.png',
        description: 'Tours album thumbnail'
      }
    }),
    // Contact page
    prisma.siteImage.create({
      data: {
        page: 'Contact',
        location: 'Hero Background',
        currentUrl: '/images/IMG-20230715-WA0004.png',
        description: 'Contact page hero image'
      }
    }),
    // Donate page
    prisma.siteImage.create({
      data: {
        page: 'Donate',
        location: 'Hero Background',
        currentUrl: '/images/IMG-20230715-WA0004.png',
        description: 'Donate page hero image'
      }
    }),
    // News page
    prisma.siteImage.create({
      data: {
        page: 'News',
        location: 'Hero Background',
        currentUrl: '/images/IMG-20230715-WA0004.png',
        description: 'News page hero image'
      }
    })
  ]);
  console.log(`✅ Created ${siteImages.length} site images`);

  console.log('\n✅ ✅ ✅ DATABASE SEEDED SUCCESSFULLY! ✅ ✅ ✅\n');
  console.log('📊 Summary:');
  console.log(`   • 1 Admin user`);
  console.log(`   • ${causes.length} Donation causes`);
  console.log(`   • ${news.length} News articles`);
  console.log(`   • ${stories.length} Orphan stories`);
  console.log(`   • ${faqs.length} FAQs`);
  console.log(`   • ${siteImages.length} Site images`);
  console.log('\n🎉 Your admin panel is now populated with all current website data!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
