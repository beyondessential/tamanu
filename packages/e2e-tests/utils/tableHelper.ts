import { Locator, Page } from "@playwright/test";


//TODO: this is flaky, remove timeout and try different approach?
export async function scrollTableToBottom(tableLocator: Locator, page: Page) {
    let previousHeight = 0;

    for (let i = 0; i < 10; i++) {
      const currentHeight = await tableLocator.evaluate(el => el.scrollHeight);
    
      if (currentHeight === previousHeight) break;
    
      await tableLocator.evaluate(el => {
        el.scrollTop = el.scrollHeight;
      });
    
      previousHeight = currentHeight;
    }

    //Wait for lazy loading to complete
    await page.waitForTimeout(2000);
}