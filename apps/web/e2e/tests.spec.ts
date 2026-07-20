import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:4000';

test.describe('Authentication', () => {
  test('should login successfully', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@pawonos.com',
        password: 'admin123',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('token');
    expect(data.user.email).toBe('admin@pawonos.com');
  });

  test('should reject invalid credentials', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@pawonos.com',
        password: 'wrongpassword',
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe('Ingredients API', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'admin@pawonos.com', password: 'admin123' },
    });
    const data = await response.json();
    token = data.token;
  });

  test('should list ingredients', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/ingredients`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('items');
    expect(data).toHaveProperty('total');
  });

  test('should create ingredient', async ({ request }) => {
    const units = await request.get(`${API_URL}/api/ingredients/units`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const unitsData = await units.json();

    const categories = await request.get(`${API_URL}/api/ingredients/categories`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const categoriesData = await categories.json();

    const response = await request.post(`${API_URL}/api/ingredients`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        name: 'Test Ingredient',
        categoryId: categoriesData[0].id,
        unitId: unitsData[0].id,
        purchasePrice: 50000,
        minimumStock: 10,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.name).toBe('Test Ingredient');

    // Cleanup
    await request.delete(`${API_URL}/api/ingredients/${data.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });
});

test.describe('Orders API', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: { email: 'admin@pawonos.com', password: 'admin123' },
    });
    const data = await response.json();
    token = data.token;
  });

  test('should list orders', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('items');
  });
});

test.describe('Dashboard', () => {
  test('should load frontend', async ({ page }) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/PawonOS/);
  });
});