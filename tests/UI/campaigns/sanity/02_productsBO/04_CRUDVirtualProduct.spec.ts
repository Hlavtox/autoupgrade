import {
  // Import utils
  utilsTest,
  utilsCore,
  // Import BO pages
  boDashboardPage,
  boLoginPage,
  boProductsPage,
  boProductsCreatePage,
  // Import FO pages
  foClassicProductPage,
  // Import data
  FakerProduct,
} from '@prestashop-core/ui-testing';

import {
  test, expect, Page, BrowserContext,
} from '@playwright/test';
import semver from 'semver';

const psVersion = utilsTest.getPSVersion();

/*
  Connect to the BO
  Go to Catalog > Products page
  Create/View/Update/Delete virtual product
 */
test.describe('BO - Catalog - Products : CRUD virtual product', async () => {
  let browserContext: BrowserContext;
  let page: Page;

  // Data to create virtual product
  const newProductData: FakerProduct = new FakerProduct({
    type: 'virtual',
    taxRule: 'No tax',
    tax: 0,
    quantity: 50,
    minimumQuantity: 1,
    status: true,
  });
  // Data to update virtual product
  const updateProductData: FakerProduct = new FakerProduct({
    type: 'virtual',
    taxRule: 'FR Taux réduit (10%)',
    tax: 10,
    quantity: 100,
    minimumQuantity: 1,
    status: true,
  });

  test.beforeAll(async ({browser}) => {
    browserContext = await browser.newContext();
    page = await browserContext.newPage();
  });
  test.afterAll(async () => {
    await page.close();
  });

  // Steps
  test('should login in BO', async () => {
    await boLoginPage.goTo(page, global.BO.URL);
    await boLoginPage.successLogin(page, global.BO.EMAIL, global.BO.PASSWD);

    const pageTitle = await boDashboardPage.getPageTitle(page);
    expect(pageTitle).toContain(boDashboardPage.pageTitle);
  });

  test('should go to \'Catalog > Products\' page', async () => {
    await boDashboardPage.goToSubMenu(
      page,
      boDashboardPage.catalogParentLink,
      boDashboardPage.productsLink,
    );
    await boProductsPage.closeSfToolBar(page);

    const pageTitle = await boProductsPage.getPageTitle(page);
    expect(pageTitle).toContain(boProductsPage.pageTitle);
  });

  // @todo : https://github.com/PrestaShop/PrestaShop/issues/36097
  if (semver.lte(psVersion, '8.1.6') && semver.gte(psVersion, '7.3.0')) {
    test('should close the menu', async () => {
      await boDashboardPage.setSidebarCollapsed(page, true);

      const isSidebarCollapsed = await boDashboardPage.isSidebarCollapsed(page);
      expect(isSidebarCollapsed).toEqual(true);
    });
  }

  test.describe('Create product', async () => {
    test('should click on \'New product\' button and check new product modal', async () => {
      const isModalVisible = await boProductsPage.clickOnNewProductButton(page);
      expect(isModalVisible).toEqual(true);
    });

    test('should choose \'Virtual product\'', async () => {
      if (semver.lt(psVersion, '8.1.0')) {
        await boProductsCreatePage.chooseProductType(page, 'Virtual product');
      }
      if (semver.gte(psVersion, '8.1.0')) {
        await boProductsPage.selectProductType(page, newProductData.type);
        await boProductsPage.clickOnAddNewProduct(page);
      }
      const pageTitle = await boProductsCreatePage.getPageTitle(page);
      expect(pageTitle).toContain(boProductsCreatePage.pageTitle);
    });

    test('should create virtual product', async () => {
      const createProductMessage = await boProductsCreatePage.setProduct(page, newProductData);
      expect(createProductMessage).toEqual(boProductsCreatePage.successfulUpdateMessage);
    });

    if (semver.gte(psVersion, '8.1.0')) {
      test('should check that the save button is changed to \'Save and publish\'', async () => {
        const saveButtonName = await boProductsCreatePage.getSaveButtonName(page);
        expect(saveButtonName).toEqual('Save and publish');
      });
    }

    test('should preview created product', async () => {
      // Click on preview button
      page = await boProductsCreatePage.previewProduct(page);

      await foClassicProductPage.changeLanguage(page, 'en');

      const pageTitle = await foClassicProductPage.getPageTitle(page);
      expect(pageTitle).toContain(newProductData.name);
    });

    test('should check all product information', async () => {
      const result = await foClassicProductPage.getProductInformation(page);
      await Promise.all([
        expect(result.name).toEqual(newProductData.name),
        expect(result.price).toEqual(newProductData.price),
        expect(result.summary).toEqual(newProductData.summary),
        expect(result.description).toEqual(newProductData.description),
      ]);
    });

    test('should go back to BO to update product', async () => {
      // Go back to BO
      page = await foClassicProductPage.closePage(browserContext, page, 0);

      const pageTitle = await boProductsCreatePage.getPageTitle(page);
      expect(pageTitle).toContain(boProductsCreatePage.pageTitle);
    });
  });

  test.describe('Update product', async () => {
    test('should update the created product', async () => {
      const createProductMessage = await boProductsCreatePage.setProduct(page, updateProductData);
      expect(createProductMessage).toEqual(boProductsCreatePage.successfulUpdateMessage);
    });

    test('should preview the updated product', async () => {
      // Click on preview button
      page = await boProductsCreatePage.previewProduct(page);

      await foClassicProductPage.changeLanguage(page, 'en');

      const pageTitle = await foClassicProductPage.getPageTitle(page);
      expect(pageTitle).toContain(updateProductData.name);
    });

    test('should check all product information', async () => {
      const taxValue = await utilsCore.percentage(updateProductData.priceTaxExcluded, 10);

      const result = await foClassicProductPage.getProductInformation(page);
      await Promise.all([
        expect(result.name).toEqual(updateProductData.name),
        expect(result.price).toEqual(updateProductData.priceTaxExcluded + taxValue),
        expect(result.description).toEqual(updateProductData.description),
      ]);
    });
  });

  test.describe('Delete product', async () => {
    test('should go back to BO to delete product', async () => {
      // Go back to BO
      page = await foClassicProductPage.closePage(browserContext, page, 0);

      const pageTitle = await boProductsCreatePage.getPageTitle(page);
      expect(pageTitle).toContain(boProductsCreatePage.pageTitle);
    });

    test('should delete product', async () => {
      const createProductMessage = await boProductsCreatePage.deleteProduct(page);
      expect(createProductMessage).toEqual(boProductsPage.successfulDeleteMessage);
    });
  });
});
