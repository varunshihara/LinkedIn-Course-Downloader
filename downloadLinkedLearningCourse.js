const puppeteer = require("puppeteer");
const fs = require("fs");
var request = require("request");
var progress = require("progress-stream");
var tutorialLink =
  "https://www.linkedin.com/learning/github-for-web-designers/welcome";
var download = function (uri, videoData, callback) {
  request.head(uri, function (err, res, body) {
    // console.log('content-type:', res.headers['content-type']);
    // console.log('content-length:', res.headers['content-length']);
    contentlength = res.headers["content-length"];

    var str = progress({
      length: contentlength,
      time: 300 /* ms */,
    });

    str.on("progress", function (progress) {
      console.log(
        videoData["chapterName"] +
          "/" +
          videoData["videoTitle"] +
          " - " +
          progress.remaining +
          "/" +
          progress.length +
          " | ETA-" +
          progress.eta +
          " | " +
          progress.percentage +
          "%"
      );

      /*
            {
                percentage: 9.05,
                transferred: 949624,
                length: 10485760,
                remaining: 9536136,
                eta: 42,
                runtime: 3,
                delta: 295396,
                speed: 949624
            }
            */
    });

    request(uri)
      .pipe(str)
      .pipe(
        fs.createWriteStream(
          "courses/" +
            videoData["courseTitle"] +
            "/" +
            videoData["chapterName"] +
            "/" +
            videoData["videoTitle"]
        )
      )
      .on("close", callback);
  });
};

async function openLinkedIn() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    // console.log(request.url());
    request.continue();
  });
  await page.setViewport({ width: 1000, height: 600 });
  await page.goto("https://www.linkedin.com/learning-login/", {
    timeout: 0,
    waitUntil: "networkidle0",
  });
  // await page.goto('https://www.linkedin.com/learning-login/', { waitUntil: 'domcontentloaded' });

  const elementHandleEmail = await page.$("input#auth-id-input");
  await elementHandleEmail.type("example@gmail.com");
  await elementHandleEmail.press("Enter");
  await page.waitFor(2000);
  const elementHandlePassword = await page.$("input#password");
  await elementHandlePassword.type("yourLinkedinPassword");
  await elementHandlePassword.press("Enter");
  await page.waitFor(4000);
  await page.goto(tutorialLink, { timeout: 0, waitUntil: "networkidle0" });
  await page.waitFor(3000);
  (await page.$("artdeco-tab.course-body__info-tab-name-content")).click;
  await page.waitFor(1000);
  // console.log(videoSrc['_remoteObject']['value']);

  // let courseTitle = await page.evaluate(() => {
  //     return document.querySelector('h2.course-banner__meta-title > a').innerText;
  // });
  // console.log(courseTitle);

  // let videoTitle = await page.evaluate(() => {
  //     const vtitleHtml = document.querySelector('a.video-item__link.active > div > div.course-toc__item-content').innerHTML;
  //     return vtitleHtml.split('<')[0];
  // });
  // const videoFileName = videoTitle.trim() + '.mp4';
  // console.log(videoFileName);

  let courseData = await page.evaluate(() => {
    let data = []; // Create an empty array that will store our data course-chapter__title-text

    let courseTitle = document.querySelector(
      "h2.course-banner__meta-title > a"
    ).innerText;

    let chapterElements = document.querySelectorAll("ul.course-toc__list > li"); // Select all Products
    chapterIndex = 0;
    for (var chapterElement of chapterElements) {
      // Loop through each proudct
      chapterIndex++;
      let chapterName = chapterElement.children[0].innerText;

      // let videoElements = document.querySelectorAll('a.video-item__link > div > div.course-toc__item-content'); // Select all Products
      let videoElements = chapterElement.children[1].children; // Select all Products
      videoIndex = 0;
      for (var videoElement of videoElements) {
        // Loop through each proudct
        videoIndex++;
        let videoUrl = videoElement.children[0].getAttribute("href");
        let videoTitle =
          videoIndex +
          "_" +
          videoElement.children[0].children[0].children[1].innerHTML
            .split("<")[0]
            .trim() +
          ".mp4"; // Select the title

        data.push({
          videoTitle: videoTitle.replace(/[/\\?%*:|"<>]/g, ""),
          chapterName: chapterName.replace(/[/\\?%*:|"<>]/g, ""),
          courseTitle: courseTitle.replace(/[/\\?%*:|"<>]/g, ""),
          videoUrl: "https://www.linkedin.com" + videoUrl,
        }); // Push an object with the data onto our array
      }
    }
    return data; // Return our data array
  });
  // console.log(courseData);

  for (var videoData of courseData) {
    // console.log(videoData);
    await page.goto(videoData["videoUrl"], {
      timeout: 0,
      waitUntil: "networkidle0",
    });
    await page.waitFor(3000);
    const elementHandleVideo = await page.$("video");
    const videoSrc = await elementHandleVideo.getProperty("src");

    var dir =
      "courses/" + videoData["courseTitle"] + "/" + videoData["chapterName"];
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    download(videoSrc["_remoteObject"]["value"], videoData, function () {
      console.log(
        "done - " +
          videoData["courseTitle"] +
          "/" +
          videoData["chapterName"] +
          "/" +
          videoData["videoTitle"]
      );
    });
    // break;
  }
  console.log("loop done");
  // await download(videoSrc['_remoteObject']['value'], 'dart-static-modifier.mp4', function () {
  //     console.log('done');
  // });
  //   await page.screenshot({path: 'google.png'});

  // await browser.close();
}

openLinkedIn();
