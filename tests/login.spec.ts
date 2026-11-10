import { test, expect } from '@playwright/test';

test.beforeAll(async() => {
  console.log("Before tests");
});

test('TC01 - Valid login to SauceDemo App', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');

  // Locators:
  const username = page.getByRole("textbox", { name: 'Username'});
  const password  = page.getByRole("textbox", { name: 'Password'});
  const loginBtn = page.getByRole("button", { name: 'Login'});

  // 1. Login with valid username and password
  await username.fill("standard_user");
  await password.fill("secret_sauce");
  await loginBtn.click();

  // 2. Validate inventory list to be visible
  await expect(page.locator(".inventory_list")).toBeVisible();
});

test("TC02 - Incorrect password", async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');

  const username = page.getByRole("textbox", { name: 'Username'});
  const password  = page.getByRole("textbox", { name: 'Password'});
  const loginBtn = page.getByRole("button", { name: 'Login'});

  // 1. Login with valid username and invalid password
  await username.fill("standard_user");
  await password.fill("secret_sauce_invalid");
  await loginBtn.click();

  // 2. Validate error message
  const errorMessage = page.locator('[data-test="error"]');
  await expect(errorMessage).toContainText('Username and password do not match any user in this service');
});

test("TC03 - Empty username", async({ page }) => {
  await page.goto('https://www.saucedemo.com/');

  const username = page.getByRole("textbox", { name: 'Username'});
  const password  = page.getByRole("textbox", { name: 'Password'});
  const loginBtn = page.getByRole("button", { name: 'Login'});

  // 1. Login with empty username and valid password
  await username.fill("");
  await password.fill("secret_sauce");
  await loginBtn.click();

  // 2. Validate error message
  await expect(page.locator('[data-test="error"]')).toContainText('Username is required');
});

test("TC04 - Empty password", async({ page }) => {
  await page.goto('https://www.saucedemo.com/');

  const username = page.getByRole("textbox", { name: 'Username'});
  const password  = page.getByRole("textbox", { name: 'Password'});
  const loginBtn = page.getByRole("button", { name: 'Login'});

  // 1. Login with valid username and empty password
  await username.fill("standard_user");
  await password.fill("");
  await loginBtn.click();

  // 2. Validate error message
  await expect(page.locator('[data-test="error"]')).toContainText('Password is required');
});

test("TC05 - Locked out user", async({ page }) => {
  await page.goto('https://www.saucedemo.com/');

  const username = page.getByRole("textbox", { name: 'Username'});
  const password  = page.getByRole("textbox", { name: 'Password'});
  const loginBtn = page.getByRole("button", { name: 'Login'});

  // 1. Login with valid username and empty password
  await username.fill("locked_out_user");
  await password.fill("secret_sauce");
  await loginBtn.click();

  // 2. Validate error message
  await expect(page.locator('[data-test="error"]')).toContainText('Sorry, this user has been locked out.');
});




