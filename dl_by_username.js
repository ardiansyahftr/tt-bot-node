// import * as tiktokscraper from "tiktok-scraper-ts";
import { TTScraper } from "tiktok-scraper-ts"; // Individual classes
import fs from "fs-extra";
import chalk from "chalk";
import axios from "axios";
import inquirer from "inquirer";

const TikTokScraper = new TTScraper();

(async () => {
  function showVTList(arrVT) {
    const totalVT = arrVT.length;
    for (let i = 0; i < totalVT; i++) {
      let filename = i+1 + ". " + 
        reformatDateString(arrVT[i].createdAt) +
        "_" +
        arrVT[i].id +
        "_" +
        arrVT[i].description.slice(0, 15) +
        ".mp4";
      console.log(filename);
    }
  }
  function reformatDateString(date) {
    return new Date(date + " 07:01").toISOString().split("T")[0];
  }
  const username = await inquirer
    .prompt([
      {
        name: "tiktokTarget",
        message: "Username TikTok: ",
      },
    ])
    .then((answers) => {
      return answers.tiktokTarget.replace("@", "");
    });

    const user = await TikTokScraper.user(username);
    console.log(user);
  const fetchVideo = await TikTokScraper.getAllVideosFromUser(username);

//   console.log("Total video: " + fetchVideo.length);
  //   console.log(fetchVideo[4]);
  var menu = await inquirer
  .prompt([
    {
      name: "menu",
      message: "Menu: \n 0. Exit \n 1. Show VT List \n 2. Download \n Pilihan: ",
    },
  ])
  .then((answers) => {
    return answers.menu;
  });

  while (menu == "1") {
    showVTList(fetchVideo);
    menu = await inquirer
    .prompt([
        {
        name: "menu",
        message: "Menu: \n 0. Exit \n 1. Show VT List \n 2. Download \n Pilihan: ",
        },
    ])
    .then((answers) => {
        return answers.menu;
    });
  }
  while (menu == "2") {
    if (fetchVideo.length != 0) {
      var fromData = await inquirer
      .prompt([
        {
          name: "fromData",
          message: `From (1-${fetchVideo.length}):`,
        },
      ])
      .then((answers) => {
        return answers.fromData - 1;
      });
  
      var toData = await inquirer
      .prompt([
        {
          name: "toData",
          message: `To (1-${fetchVideo.length}):`,
        },
      ])
      .then((answers) => {
        return answers.toData;
      });
  
      const folder = `videos/${username}`;
      if (!fs.existsSync(`videos`)) fs.mkdirSync(`videos`);
      if (!fs.existsSync(folder)) fs.mkdirSync(folder);

      const totalDownload = fetchVideo.length;
      for (let i = fromData; i < toData; i++) {
        const downloadLink = await TikTokScraper.noWaterMark(
          fetchVideo[i].directVideoUrl
        );
        console.log((i+1)+"\n"+fetchVideo[i].directVideoUrl);
        console.log(downloadLink);
        let filename =
          reformatDateString(fetchVideo[i].createdAt) +
          "_" +
          fetchVideo[i].id +
          "_" +
          fetchVideo[i].description.replace(/\W/g, "").slice(0, 20) +
          ".mp4";
        console.log(filename);
        if (downloadLink) {
          await axios
            .get(downloadLink, {
              responseType: "stream",
            })
            .then((response) => {
              response.data.pipe(fs.createWriteStream(`${folder}/${filename}`));
              console.log(
                chalk.green(`[+] Download successfully (${filename})\n`)
              );
            })
            .catch((error) => {
              console.log(chalk.red("[!] Failed to download video.\n"));
            });
        } else {
          console.log(
            chalk.red("[!] Failed to get video link without watermark.\n")
          );
        }
      }
    } else {
      console.log("Username salah/durung upload vt");
    }
    menu = await inquirer
    .prompt([
        {
        name: "menu",
        message: "Menu: \n 0. Exit \n 1. Show VT List \n 2. Download \n Pilihan: ",
        },
    ])
    .then((answers) => {
        return answers.menu;
    });
  }
  while (menu == "0") {
    console.log("Thx");
    process.exit(0);
  }
})();
