import { test, expect, Page } from '@playwright/test';

const login = async (page: Page) => {
    await page.goto('https://www.saucedemo.com/');

    // Locators
    const username = page.getByRole("textbox", { name: 'Username' });
    const password = page.getByRole("textbox", { name: 'Password' });
    const loginBtn = page.getByRole("button", { name: 'Login' });

    // Step 1: Login with standard_user
    await username.fill("standard_user");
    await password.fill("secret_sauce");
    await loginBtn.click();
};

test("TC01 - Verify catalogue loading", async ({ page }) => {
    // Step 1: Login with standard_user
    await login(page);

    // Step 2: Validate inventory page is reached after login
    await expect(page).toHaveURL(/inventory\.html$/);
    // Step 3: Validate title Products is visible
    await expect(page.locator('[data-test="title"]')).toBeVisible();
    // Step 4: Validate that 6 products are displayed
    await page.locator('[data-test="inventory-item"]').first().waitFor();
    const inventoryItems = page.locator('[data-test="inventory-item"]');
    await expect(inventoryItems).toHaveCount(6);
    // Step 5: Validate cart is visible
    const shoppingCart = page.getByRole("button", { name: 'Cart, empty' });
    await expect(shoppingCart).toBeVisible();
});

test("TC02 - Verify product cards structure", async ({ page }) => {
    // Precondition
    await login(page);
    await page.locator('[data-test="inventory-item"]').first().waitFor();

    // Step 1: Retrieve all product cards
    const allProductCards = page.locator('[data-test="inventory-item"]');
    const productsCount = await allProductCards.count();

    // Step 2: Verify each card contains: 
    //      an image, a name, a description, a price and an action button
    for (let i = 0; i < productsCount; i++) {
        // Image validation
        const imageCard = allProductCards.nth(i).locator('[data-test*="img-link"]');
        await expect(imageCard).toBeVisible();
        await imageCard.screenshot({ path: 'image-card.png' })

        // Name validation
        const cardName = allProductCards.nth(i).locator('[data-test="inventory-item-name"]');
        await expect(cardName).toBeVisible();

        // Description validation
        const cardDescription = allProductCards.nth(i).locator('[data-test="inventory-item-desc"]');
        await expect(cardDescription).toBeVisible();

        // Price validation
        const cardPrice = allProductCards.nth(i).locator('[data-test="inventory-item-price"]');
        await expect(cardPrice).toBeVisible();

        // Add to cart validation
        const addToCartButton = allProductCards.nth(i).getByRole("button", { name: 'Add to cart' });
        await expect(addToCartButton).toBeVisible();

    }
});

test("TC03 - Verify card content", async ({ page }) => {
    await login(page);
    await page.locator('[data-test="inventory-item"]').first().waitFor();

    const allProductCards = page.locator(".inventory_item");
    const product = allProductCards.filter({ hasText: 'Sauce Labs Backpack' });

    await expect(product.locator('[data-test*="img-link"]')).toBeVisible();
    await expect(product.locator('[data-test="inventory-item-name"]')).toContainText("Sauce Labs Backpack");
    await expect(product.locator('[data-test="inventory-item-desc"]')).toContainText("carry.allTheThings() with the sleek");
    await expect(product.locator('[data-test="inventory-item-price"]')).toContainText("$29.99");
    await expect(product.getByRole("button", { name: 'Add to cart' })).toBeVisible();
});

test("TC04 - Add Backpack to cart", async ({ page }) => {
    await login(page);
    await page.locator('[data-test="inventory-item"]').first().waitFor();

    const allProductCards = page.locator('[data-test="inventory-item"]');
    const product = allProductCards.filter({ hasText: 'Sauce Labs Backpack' });
    await product.getByRole("button", { name: 'Add to cart' }).click();

    await expect(page.locator('[data-test="shopping-cart-link"]')).toBeVisible();
    await expect(page.locator('[data-test="shopping-cart-link"]')).toContainText('1');
    await expect(page.locator('[data-test="remove-sauce-labs-backpack"]')).toBeVisible();
});

test("TC05 - Add two products to cart", async ({ page }) => {
    const backpack = 'Sauce Labs Backpack';
    const bikeLight = 'Sauce Labs Bike Light';


    await login(page);
    const inventoryItems = page.locator('[data-test="inventory-item"]');
    await inventoryItems.first().waitFor();

    const allProductCards = page.locator('[data-test="inventory-item"]');
    const productBackpack = allProductCards.filter({ hasText: backpack });
    const productBikeLight = allProductCards.filter({ hasText: bikeLight });

    // Add products to cart
    await productBackpack.getByRole("button", { name: 'Add to cart' }).click();
    await productBikeLight.getByRole("button", { name: 'Add to cart' }).click();

    const shoppingCart = page.locator('[data-test="shopping-cart-link"]');
    await expect(shoppingCart).toBeVisible();
    await expect(shoppingCart).toContainText('2');
    // Go to shopping cart
    await shoppingCart.click();

    await inventoryItems.first().waitFor();
    await expect(inventoryItems.filter({ hasText: backpack })).toBeVisible();
    await expect(inventoryItems.filter({ hasText: bikeLight })).toBeVisible();
});

test("TC06 - Remove a particular product from shopping cart", async ({ page }) => {
    const backpack = 'Sauce Labs Backpack';
    const bikeLight = 'Sauce Labs Bike Light';


    await login(page);
    const inventoryItems = page.locator('[data-test="inventory-item"]');
    await inventoryItems.first().waitFor();

    const allProductCards = page.locator('[data-test="inventory-item"]');
    const productBackpack = allProductCards.filter({ hasText: backpack });
    const productBikeLight = allProductCards.filter({ hasText: bikeLight });

    // Add products to cart
    await productBackpack.getByRole("button", { name: 'Add to cart' }).click();
    await productBikeLight.getByRole("button", { name: 'Add to cart' }).click();

    const shoppingCart = page.locator('[data-test="shopping-cart-link"]');
    await expect(shoppingCart).toBeVisible();
    await expect(shoppingCart).toContainText('2');
    // Remove Backpack product from cart
    await page.locator('[data-test="remove-sauce-labs-backpack"]').click();
    await expect(shoppingCart).toContainText('1');

    // Go to shopping cart
    await shoppingCart.click();

    await inventoryItems.first().waitFor();
    await expect(inventoryItems.filter({ hasText: bikeLight })).toBeVisible();
    await page.screenshot({ path: 'screenshot.png' });
});

test("TC07 - Filter products price in ASC order", async ({ page }) => {
    await login(page);
    /**
     *  1. Click on Low to High
        2. Retrieve displayed prices
        3. Convert in numbers
        4. Save in actualPrices
        5. Create a copy
        6. Sort the copy
        7. Verify that actualPrices == sortedCopy
     */
    const selectFilter = page.locator('[data-test="product-sort-container"]');
    await selectFilter.selectOption("lohi");

    const displayedPrices = page.locator('[data-test="inventory-item-price"]');
    const actualPrices = (await displayedPrices.allTextContents())
        .map(price => parseFloat(price.replace("$", "")));

    const sortedPrices = [...actualPrices].sort((a, b) => a - b);
    console.log("Sorted prices in asc: " + sortedPrices);

    expect(actualPrices).toEqual(sortedPrices);

});

test("TC08 - Filter products price in DESC order", async ({ page }) => {
    await login(page);
    /**
     *  1. Click on High to Low
        2. Retrieve displayed prices
        3. Convert in numbers
        4. Save in actualPrices
        5. Create a copy
        6. Sort the copy
        7. Verify that actualPrices == sortedCopy
     */
    const selectFilter = page.locator('[data-test="product-sort-container"]');
    await selectFilter.selectOption("hilo");

    const displayedPrices = page.locator('[data-test="inventory-item-price"]');
    const actualPrices = (await displayedPrices.allTextContents())
        .map(price => parseFloat(price.replace("$", "")));

    const sortedPrices = [...actualPrices].sort((a, b) => b - a);
    console.log("Sorted prices in desc: " + sortedPrices);

    expect(actualPrices).toEqual(sortedPrices);

});

test("TC09 - Verify product detail page", async({ page }) => {
    await login(page);

    const backpack = 'Sauce Labs Backpack';

    const inventoryItems = page.locator('[data-test="inventory-item"]');
    await inventoryItems.first().waitFor();
    const allProductCards = page.locator('[data-test="inventory-item"]');
    await allProductCards.filter({ hasText: backpack }).locator('[data-test="inventory-item-name"]').click();

    await expect(page).toHaveURL(/inventory-item/);
    // Verify name, description and price
    await expect(page.locator('[data-test="inventory-item-name"]')).toContainText(backpack);
    await expect(page.locator('[data-test="inventory-item-desc"]')).toContainText('streamlined Sly Pack that melds uncompromising style');
    await expect(page.locator('[data-test="inventory-item-price"]')).toContainText('29.99');
    
    await page.locator('[data-test="back-to-products"]').click();
    await expect(page.locator('[data-test="title"]')).toBeVisible();
});





