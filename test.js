// import * as tiktokscraper from "tiktok-scraper-ts";
import { TTScraper } from "tiktok-scraper-ts"; // Individual classes
import fs from "fs-extra";
import chalk from "chalk";
import axios from "axios";
import inquirer from "inquirer";
import table from "table"; // Individual classes

(async () => {
    
  let config;
  let data_table = [];
  let g_data_posts = [];
  var g_cursor = 0;

  config = {
    // Predefined styles of table
    border: table.getBorderCharacters("ramac"),
  }

  const username_tt = await inquirer
  .prompt([
    {
      name: "tiktokTarget",
      message: "Username TikTok: ",
    },
  ])
  .then((answers) => {
    return answers.tiktokTarget.replace("@", "");
  });
  const username = username_tt != "" ? username_tt : "jkt48.ella.a";
  resetPosts();
  var menu = await inquirer
  .prompt([
    {
      name: "appMenu",
      message: "Pilihan menu: \n 1. Posts \n 0. Keluar \nPilihan:",
    },
  ])
  .then((answers) => {
    const data_return = isNaN(Number(answers.appMenu)) ? 0 : Number(answers.appMenu);
    return data_return != 1 ? 0 : data_return;
  });
  while (menu != 0) {
    if (menu == 1) {
      // getPostsTest();
      showDatatable();
      var menu_post = await inquirer
      .prompt([
        {
          name: "appMenuPost",
          message: "Pilihan menu: \n 1. Load \n 2. Download \n 3. Reset \n 4. Show \n 0. Keluar \nPilihan:",
        },
      ])
      .then((answers) => {
        const data_return = isNaN(Number(answers.appMenuPost)) ? 0 : Number(answers.appMenuPost);
        return (data_return == 1 || data_return == 2 || data_return == 3 || data_return == 4) ? data_return : 0;
      });
      while (menu_post != 0) {
        if (menu_post == 1) {
          var jml = await inquirer
          .prompt([
            {
              name: "jmlVid",
              message: "Jumlah yang ditampilkan (max 33): ",
              type: "number",
              default: 10
            },
          ])
          .then((answers) => {
            const data_return = isNaN(Number(answers.jmlVid)) ? 10 : Number(answers.jmlVid);
            return data_return > 33 ? 33 : data_return;
          });
          const data_posts = await getPosts(username, jml, g_cursor);
          g_cursor = data_posts.data.cursor;
          populateDatatable(data_posts);
          showDatatable();
        } else if (menu_post == 2) {
          await download(username, g_data_posts);
        } else if (menu_post == 3) {
          resetPosts();
        } else if (menu_post == 4) {
          showDatatable();
        }
        
      menu_post = await inquirer
      .prompt([
        {
          name: "appMenuPost",
          message: "Pilihan menu: \n 1. Load \n 2. Download \n 3. Reset \n 4. Show \n 0. Keluar \nPilihan:",
        },
      ])
      .then((answers) => {
        const data_return = isNaN(Number(answers.appMenuPost)) ? 0 : Number(answers.appMenuPost);
        return (data_return == 1 || data_return == 2 || data_return == 3 || data_return == 4) ? data_return : 0;
      });
      }
      
    }

    menu = await inquirer
    .prompt([
      {
        name: "appMenu",
        message: "Pilihan menu: \n 1. Posts \n 0. Keluar \nPilihan:",
      },
    ])
    .then((answers) => {
      const data_return = isNaN(Number(answers.appMenu)) ? 0 : Number(answers.appMenu);
      return data_return != 1 ? 0 : data_return;
    });
  }
  async function getPosts(username, jml, cursor = 0) {
    var token = "*";
    const config = {headers : {
      'X-RapidAPI-Key' : token,
      'X-RapidAPI-Host': 'tiktok-video-no-watermark2.p.rapidapi.com'
    }};
    const url_get_videos = `https://www.tikwm.com/api/user/posts?unique_id=${username}&count=${jml}&cursor=${cursor}`;
    // const url_get_videos = `https://tiktok-video-no-watermark2.p.rapidapi.com/user/posts?unique_id=${username}&count=${jml}&cursor=${cursor}`;
    const data = await axios.get(url_get_videos, config)
      .then(res => res.data)
      .catch(err => console.error(err));
    return data;
  }
  
  function populateDatatable(data_posts) {
    for (let i = 0; i < data_posts.data.videos.length; i++) {
      const element = data_posts.data.videos[i];
      data_table.push([
        (data_table.length),
        new Date(element.create_time * 1000).toISOString().replace("T"," ").replace(".000Z",""),
        (((element.title == null ? "" : element.title.toString()).length < 30) ? element.title : element.title.substr(0, 30) + "..." )
      ]);
      g_data_posts.push(element)
    }
  }

  function showDatatable() {
    let x = table.table(data_table, config);
    console.log(x)
  }
  async function download(username,data_videos) {
    
    const folder = `videos/${username}`;
    if (!fs.existsSync(`videos`)) fs.mkdirSync(`videos`);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);
    for (let i = 0; i < data_videos.length; i++) {
      const element = data_videos[i];
      let filename =
      new Date(data_videos[i].create_time * 1000).toISOString().split("T")[0] +
      "_" +
      data_videos[i].video_id +
      ".mp4";
      var downloadLink = data_videos[i].hdplay;
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
  }

  function resetPosts() {
    data_table.length = 0;
    g_data_posts.length = 0;
    g_cursor = 0;
    data_table.push([
      "No.",
      "Date",
      "Title"
    ])

  }
})();