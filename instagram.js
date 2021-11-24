const puppeteer = require('puppeteer');
const fs = require('fs');
var request = require('request');
var progress = require('progress-stream');
var link = "https://www.instagram.com";


async function openInstagram() {

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", request => {
        // console.log(request.url());
        request.continue();
    });
    await page.setViewport({ width: 1000, height: 600 });
    await page.goto(link, { timeout: 0, waitUntil: "networkidle0" });

}

openInstagram();