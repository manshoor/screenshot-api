'use strict';
const {
          APP_DOMAIN,
          REDIS_PORT,
          REDIS_URL,
          REDIS_CACHE_TIME,
          REDIS_PASSWORD
      }                    = require("../config/config");
const puppeteer            = require('puppeteer');
const fs                   = require('fs');
const {getInt, isValidUrl} = require('../helper/validator');
const {parse}              = require("url");
const {v4: uuidv4}         = require('uuid');
const UserAgents           = require("user-agents");
const redis                = require('redis');
const redisClient          = redis.createClient(REDIS_PORT, REDIS_URL);
redisClient.auth(REDIS_PASSWORD);
const crypto       = require('crypto');
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
              timeout        = 1000,
              device         = 'desktop' // default is always going to be desktop
          }                            = query;
    // setting the device to iphone 13 pro
    const mobile                       = puppeteer.devices['iPhone 13 Pro'];
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
    const md5sum          = crypto.createHash('md5');
    const md5CheckSumHash = md5sum.update(capture).digest("hex");
    // Locates the temp directory for temporary storage
    const tempFolder      = './tmp';

    // get params from POST request
    const siteURL = captureURL;
    const name    = uuidv4();
    // Launch puppeteer
    await console.warn(` -------> START: \n ${siteURL} \n `);
    // Path to temp folder
    let path = `${tempFolder}/${name}.${type}`;


    // if screenshots directory is not exist then create one
    if (!fs.existsSync('tmp')) {
        fs.mkdirSync('tmp');
    }

    const args  = [
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-skip-list',
        '--start-maximized', // Start in maximized state
        `--window-size=${width || 1366},${height || 1080}`,
        '--autoplay-policy=user-gesture-required',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-client-side-phishing-detection',
        '--disable-component-update',
        '--disable-default-apps',
        '--disable-dev-shm-usage',
        '--disable-domain-reliability',
        '--disable-extensions',
        '--disable-features=AudioServiceOutOfProcess',
        '--disable-hang-monitor',
        '--disable-ipc-flooding-protection',
        '--disable-notifications',
        '--disable-offer-store-unmasked-wallet-cards',
        '--disable-popup-blocking',
        '--disable-print-preview',
        '--disable-prompt-on-repost',
        '--disable-renderer-backgrounding',
        '--disable-setuid-sandbox',
        '--disable-speech-api',
        '--disable-sync',
        '--hide-scrollbars',
        '--ignore-gpu-blacklist',
        '--metrics-recording-only',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--no-pings',
        '--no-sandbox',
        '--no-zygote',
        '--password-store=basic',
        '--use-gl=swiftshader',
        '--use-mock-keychain',
        '--disable-infobars',
        '--disable-accelerated-2d-canvas',
        '--disable-component-extensions-with-background-pages',
        '--disable-features=TranslateUI,BlinkGenPropertyTrees',
        '--enable-features=NetworkService,NetworkServiceInProcess',
    ];
    let browser = null;
    try {

        browser    = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            headless      : true,
            // devtools: true,
            ignoreHTTPSErrors: true,
            args             : args,
            // userDataDir      : tempFolder,
            // 'dumpio'         : true,
        });
        const page = await browser.newPage();

        // Configure the navigation timeout
        await page.setDefaultNavigationTimeout(0); //timeout 60 seconds now


        await page.setViewport({width: intWidth, height: intHeight, deviceScaleFactor: 1});

        const userAgent = new UserAgents([
          /Safari/,
          {
            platform      : 'MacIntel',
            deviceCategory: 'desktop',
          }
        ]);
        await page.setUserAgent(userAgent.toString()); // added this
        // checking if the device is set to mobile
        if (device === 'mobile') {
            // emulate the page with the mobile settings
            await page.emulate(mobile);
        }
        let status = await page.goto(siteURL, {
            waitUntil: ['networkidle2'],
            timeout  : 0
        }).catch(e => console.log(e.toString()));
        await Promise.all([
            page.waitForResponse(response => response.status() === 200, {timeout: intTimeOut}).catch(e => console.log(e.toString())),
            // page.evaluate(() => document.body.innerHTML),
            autoScroll(page).catch(e => console.log(e.toString())),
            page.waitForTimeout(intTimeOut).catch(e => console.log(e.toString())),
            page.emulateMediaType('screen').catch(e => console.log(e.toString())),
        ]).then(results => {
            console.log(` -------> status: \n ${status.status()} \n`);
            console.log(` -------> results: \n Navigation Done \n`);
        }).catch(e => console.error(e.toString()));

        await page.screenshot({
            path          : path,
            fullPage      : fullPage,
            type          : type,
            omitBackground: omitBackground,
            quality       : qual
        }).catch(e => console.error(` -------> \n unable to capture ${e.toString()} \n`));

        await browser.close();
        const responseData = {status: 'success', siteName: name, fileName: `${APP_DOMAIN}/${name}.${type}`};
        await console.log(` -------> \n Cache set \n`);
        redisClient.setex(md5CheckSumHash, REDIS_CACHE_TIME, JSON.stringify(responseData));
        res.status(200).send(responseData);
    } catch (err) {
        if (browser !== null) {
            res.status(500).send({status: 'fail', msg: err.message});
        }
        await console.error(` ------->  Error: \n ${err.message} \n`);
    } finally {
        if (browser !== null) {
            await browser.close();
        }
        await console.warn(` -------> \n screenshots captured \n`);
        await console.warn(` -------> \n END: ${siteURL} \n`);
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
                    // jump to the top to avoid sticky headers issues
                    window.scrollTo(0, 0);
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
