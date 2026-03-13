import { PrismaClient, RestaurantPlan } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const restaurants = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Demo',
      plan: RestaurantPlan.BASIC,
      qrCode: 'demo',
      slug: 'demo',
      subdomain: 'demo',
      customDomain: null,
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Rivera Grill',
      plan: RestaurantPlan.PRO,
      qrCode: 'rivera-grill',
      slug: 'rivera-grill',
      subdomain: 'rivera',
      customDomain: null,
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Skyline Rooftop',
      plan: RestaurantPlan.ENTERPRISE,
      qrCode: 'skyline',
      slug: 'skyline',
      subdomain: 'skyline',
      customDomain: 'menu.skyline.example',
    },
  ];

  for (const restaurant of restaurants) {
    await prisma.restaurant.upsert({
      where: { id: restaurant.id },
      update: restaurant,
      create: restaurant,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    console.error('Seed failed', err);
    await prisma.$disconnect();
    process.exit(1);
  });
