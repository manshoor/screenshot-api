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
const userAgents           = require("user-agents");
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

    let browser = null;
    try {

        browser    = await puppeteer.launch({
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
            headless      : true,
            // devtools: true,
            ignoreHTTPSErrors: true,
            args             : [
                '--user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36"',
                '--ignore-certificate-errors',
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
                '--unlimited-storage',
                '--disable-accelerated-2d-canvas',
                '--full-memory-crash-report',
                '--headless',
                // '--single-process',
            ],
            userDataDir      : tempFolder,
            // 'dumpio'         : true,
        });
        const page = await browser.newPage();

        // Configure the navigation timeout
        await page.setDefaultNavigationTimeout(0); //timeout 60 seconds now


        await page.setViewport({width: intWidth, height: intHeight, deviceScaleFactor: 1});

        const userAgent = new userAgents([
            /Safari/,
            {
                connection: {
                    type: 'wifi',
                },
                platform  : 'MacIntel',
            },
        ]);
        await page.setUserAgent(userAgent.toString()); // added this
        let status = await page.goto(siteURL, {waitUntil: ['networkidle0', 'domcontentloaded'], timeout: 0}).catch(e => console.log(e.toString()));
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
