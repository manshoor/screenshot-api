'use strict';
const {APP_DOMAIN}                         = require("../config/config");
const puppeteer                            = require('puppeteer');
const fs                                   = require('fs');
const {getInt, getUrlFromPath, isValidUrl} = require('../helper/validator');
const {parse}                              = require("url");
const {v4: uuidv4}                         = require('uuid');

exports.screenshot = async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    // if screenshots directory is not exist then create one
    if (!fs.existsSync('tmp')) {
        fs.mkdirSync('tmp');
    }
    const {pathname = '/', query = {}} = parse(req.url, true);
    const {
              type           = 'jpeg',
              quality        = 100,
              fullPage       = true,
              capture        = false,
              omitBackground = true,
              waitUntil      = 'networkidle0',
              delay          = false,
              width          = 1366,
              height         = 1080,
              timeout        = 500,
          }                            = query;
    const qual                         = getInt(quality);
    const intTimeOut                   = getInt(timeout);
    const intWidth                     = getInt(width);
    const intHeight                    = getInt(height);
    if (!capture) {
        res.status(400).json({
            status: 'fail',
            result: 'capture url missing!'
        });
    }
    const captureURLValidate = Buffer.from(capture, 'base64');
    const captureURL         = captureURLValidate.toString('utf-8');
    if (!isValidUrl(captureURL)) {
        res.status(400).json({
            status: 'fail',
            result: 'invalid url'
        });
    }
    // Locates the temp directory for temporary storage
    const tempFolder = './tmp';

    // get params from POST request
    const siteURL = captureURL;
    const name    = uuidv4();
    // Launch puppeteer

    // Path to temp folder
    let path = `${tempFolder}/${name}.${type}`;


    // if screenshots directory is not exist then create one
    if (!fs.existsSync('tmp')) {
        fs.mkdirSync('tmp');
    }

    let browser = null;
    try {

        browser    = await puppeteer.launch({
            headless: true,
            // devtools: true,
            ignoreHTTPSErrors: true,
            args             : [
                '--window-size=1366,1080',
                // important to add
                '--disable-gpu',
                '--disable-setuid-sandbox',
                '--no-sandbox',
                // important to add
                // This will write shared memory files into /tmp instead of /dev/shm,
                // because Docker’s default for /dev/shm is 64MB
                '--disable-dev-shm-usage',
                '--allow-external-pages',
                '--data-reduction-proxy-http-proxies',
                '--start-maximized', // Start in maximized state
                "--unlimited-storage",
                "--full-memory-crash-report"
            ],
            userDataDir      : "/usr/cache",
        });
        const page = await browser.newPage();

        // Configure the navigation timeout
        // await page.setDefaultNavigationTimeout(0);
        await page.setDefaultNavigationTimeout(60000); //timeout 60 seconds now

        // const dimensions = await page.evaluate((intWidth, intHeight) => {
        //   return {
        //     width: intWidth,
        //     height: intHeight,
        //     deviceScaleFactor: window.devicePixelRatio
        //   };
        // }, intWidth, intHeight);

        await page.setViewport({width: intWidth, height: intHeight, deviceScaleFactor: 1});

        await page.goto(siteURL, {
            waitUntil: ['load', 'networkidle0', 'domcontentloaded'],
            // timeout: 60,
        });
        console.log('page has been loaded!');

        // Emitted when the DOM is parsed and ready (without waiting for resources)
        // await page.once('domcontentloaded', () => console.info('✅ DOM is ready'));

        // The promise resolves after navigation has finished
        // await page.waitForNavigation()

        // Emitted when the page is fully loaded
        // await page.once('load', () => console.info('✅ Page is loaded'));
        //scroll to bottom
        await autoScroll(page);

        // await waitForLazyImages(page);

        await page.waitForTimeout(intTimeOut);

        await page.emulateMediaType('screen');

        await page.screenshot({
            path          : path,
            fullPage      : fullPage,
            type          : type,
            omitBackground: omitBackground,
            quality       : qual
        });
        console.log('done');
        await browser.close();
        res.status(200).send({status: 'success', siteName: name, fileName: `${APP_DOMAIN}/${name}.${type}`});
    } catch (err) {
        res.status(500).send({status: 'fail', msg: err.message});
        console.log(`❌ Error: ${err.message}`);
    } finally {
        console.log(`\n🎉screenshots captured.`);
    }
};

//method used to scroll to bottom, referenced from user visualized on https://github.com/GoogleChrome/puppeteer/issues/305
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            let totalHeight = 0;
            let distance    = 400;
            let timer       = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 200);
        });
    });
}

async function waitForLazyImages(page) {
    await page.evaluate(async () => {
        // Scroll down to bottom of page to activate lazy loading images
        document.body.scrollIntoView(false);

        // Wait for all remaining lazy loading images to load
        await Promise.all(Array.from(document.getElementsByTagName('img'), image => {
            if (image.complete) {
                return;
            }

            return new Promise((resolve, reject) => {
                image.addEventListener('load', resolve);
                image.addEventListener('error', reject);
            });
        }));
    });

}
