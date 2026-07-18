import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: "admin" },
    update: {},
    create: {
      name: "admin",
      description: "Full system access",
      permissions: JSON.stringify({
        users: ["create", "read", "update", "delete"],
        orders: ["create", "read", "update", "delete"],
        production: ["create", "read", "update", "delete"],
        inventory: ["create", "read", "update", "delete"],
        purchasing: ["create", "read", "update", "delete"],
        reports: ["read"],
      }),
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: "manager" },
    update: {},
    create: {
      name: "manager",
      description: "Kitchen and operations management",
      permissions: JSON.stringify({
        orders: ["create", "read", "update"],
        production: ["create", "read", "update"],
        inventory: ["read", "update"],
        purchasing: ["create", "read"],
        reports: ["read"],
      }),
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: "staff" },
    update: {},
    create: {
      name: "staff",
      description: "Basic operational access",
      permissions: JSON.stringify({
        orders: ["read"],
        production: ["read", "update"],
        inventory: ["read"],
      }),
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@pawonos.com" },
    update: {},
    create: {
      email: "admin@pawonos.com",
      password: hashedPassword,
      name: "Admin PawonOS",
      roleId: adminRole.id,
    },
  });

  // Create units
  const units = [
    { name: "Kilogram", symbol: "kg" },
    { name: "Gram", symbol: "g" },
    { name: "Liter", symbol: "l" },
    { name: "Milliliter", symbol: "ml" },
    { name: "Piece", symbol: "pcs" },
    { name: "Pack", symbol: "pack" },
    { name: "Box", symbol: "box" },
    { name: "Sachet", symbol: "sachet" },
  ];

  for (const unit of units) {
    await prisma.unit.upsert({
      where: { symbol: unit.symbol },
      update: {},
      create: unit,
    });
  }

  // Create ingredient categories
  const categories = [
    "Meat & Poultry",
    "Seafood",
    "Vegetables",
    "Fruits",
    "Rice & Grains",
    "Spices & Seasonings",
    "Cooking Oil & Fat",
    "Dairy",
    "Beverages",
    "Dry Goods",
  ];

  for (const name of categories) {
    await prisma.ingredientCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Create overhead categories
  const overheadCategories = [
    { name: "Kitchen Rent", allocationMethod: "per_meal" },
    { name: "Equipment Depreciation", allocationMethod: "per_meal" },
    { name: "Vehicle Depreciation", allocationMethod: "per_meal" },
    { name: "Cleaning Supplies", allocationMethod: "per_meal" },
    { name: "Internet & Software", allocationMethod: "fixed" },
    { name: "Administration Salary", allocationMethod: "per_meal" },
    { name: "Insurance", allocationMethod: "fixed" },
    { name: "Miscellaneous", allocationMethod: "per_meal" },
  ];

  for (const cat of overheadCategories) {
    await prisma.overheadCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // Create cost settings
  await prisma.costSettings.upsert({
    where: { companyId: "default" },
    update: {},
    create: {
      companyId: "default",
      expectedMonthlyMeals: 12000,
      targetMargin: 0.35,
      targetFoodCost: 0.35,
      currency: "IDR",
    },
  });

  // Create pricing rule
  await prisma.pricingRule.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Standard Pricing",
      targetMargin: 0.35,
      targetFoodCost: 0.35,
      roundingMethod: "nearest",
      roundingValue: 100,
    },
  });

  console.log("Database seeded successfully!");
  console.log(`Admin user: admin@pawonos.com / admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });