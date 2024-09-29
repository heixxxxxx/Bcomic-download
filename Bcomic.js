var fs = require("fs");
var fetch = require("node-fetch");
const path = require('path');
let cookie = ''
let docName = ""
let epName = ""
let ep_list = []
let ep_no = ''
let allPage = 0
// 下载保存
function download(url, index, page) {
  let name = index >= 10 ? index : "0" + index
  fetch(url).then(res => res.buffer()).then(_ => {
    fs.writeFile(docName + "/" + epName + "/" + name + ".jpg", _, "binary", function (err) {
      allPage++
      if (allPage == page) {
        ep_list.splice(ep_list.length - 1, 1)
        if (ep_no) {
          console.log("------------结束-----------")
        } else {
          console.log("----------------------")
          getInfo()
        }
      }
    });
  });
}
//图片token
function getImgToken(list) {
  let imgList = []
  list.forEach(item => {
    imgList.push(item.path)
    // imgList.push(item.path+ "@1100w.jpg")
  });
  fetch("https://manga.bilibili.com/twirp/comic.v1.Comic/ImageToken?device=pc&platform=web", {
    "headers": {
      "content-type": "application/json;charset=UTF-8",
      "cookie": cookie
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": JSON.stringify({ urls: JSON.stringify(imgList) }),
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
  }).then(response => response.json())
    .then(data => {
      allPage = 0
      console.log("开始下载...")
      data.data.forEach((item, index) => {
        download(item.url + "?token=" + item.token, index, data.data.length)
      })
    })
    .catch(error => console.error(error));
}
//图片列表
function getImageIndex(ep_id) {
  fetch("https://manga.bilibili.com/twirp/comic.v1.Comic/GetImageIndex?device=pc&platform=web", {
    "headers": {
      "content-type": "application/json;charset=UTF-8",
      "cookie": cookie,
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": JSON.stringify({ ep_id }),
      "method": "POST",
      "mode": "cors",
      "credentials": "include"
    }
  })
    .then(response => response.json())
    .then(data => {
      console.log("共" + data.data.images.length + "p")
      getImgToken(data.data.images)
    })
    .catch(error => console.error(error));
}
//标题
function getInfo() {
  if (ep_list.length == 0) {
    console.log("结束。")
    return 0
  }
  fetch("https://manga.bilibili.com/twirp/comic.v1.Comic/GetEpisode?device=pc&platform=web", {
    "headers": {
      "content-type": "application/json;charset=UTF-8",
      "cookie": cookie
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": JSON.stringify({ id: ep_list[ep_list.length - 1].id }),
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
  }).then(response => response.json())
    .then(data => {
      epName = data.data.short_title
        + "-" + data.data.title
      fs.stat(docName + "/" + epName, function (exists) {
        if (exists) {
          fs.mkdir(docName + "/" + epName, function (err) {
            if (err) console.error(err);
            console.log("---ep" + data.data.short_title + "---")
            //查询列表
            getImageIndex(ep_list[ep_list.length - 1].id)
          });
        } else {
          ep_list.splice(ep_list.length - 1, 1)
          getInfo()
        }
      });
    })
    .catch(error => console.error(error));
}
function getEpInfo() {
  fetch("https://manga.bilibili.com/twirp/comic.v1.Comic/GetEpisode?device=pc&platform=web", {
    "headers": {
      "content-type": "application/json;charset=UTF-8",
      "cookie": cookie
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": JSON.stringify({ id: ep_list[ep_list.length - ep_no].id }),
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
  }).then(response => response.json())
    .then(data => {
      console.log(ep_list[ep_list.length - ep_no])

      epName = data.data.short_title
        + "-" + data.data.title
      fs.stat(docName + "/" + epName, function (exists) {
        if (exists) {
          fs.mkdir(docName + "/" + epName, function (err) {
            if (err) console.error(err);
            console.log("---ep" + data.data.short_title + "---")
            //查询列表
            getImageIndex(ep_list[ep_list.length - ep_no].id)
          });
        }
      });
    })
    .catch(error => console.error(error));
}
function getComicInfo(comic_id) {
  fetch("https://manga.bilibili.com/twirp/comic.v1.Comic/ComicDetail?device=pc&platform=web", {
    "headers": {
      "content-type": "application/json;charset=UTF-8",
      "cookie": cookie
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": JSON.stringify({ comic_id }),
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
  }).then(response => response.json())
    .then(data => {
      docName = data.data.title
      ep_list = data.data.ep_list
      fs.stat(docName, function (exists) {
        if (exists) {
          fs.mkdir(docName, function (err) {
            if (err) console.error(err);
            console.log("创建文件夹完成")
            ep_no ? getEpInfo() :
              getInfo()
          });
        } else {
          console.log("文件夹存在")
          ep_no ? getEpInfo() :
            getInfo()
        }
      })
    })
    .catch(error => console.error(error));
}
console.log("============================")
console.log("该下载需要提供cookie(登陆后->控制台(刷新)->网络->任意选择请求->header(标头)->复制Cookie内容)")
console.log("该下载需要提供comicId(网址中 mc后的数字)")
console.log("请确保该账号购买了该漫画")
console.log("============================")

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})
readline.question(`cookie:`, cookieData => {
  cookie = cookieData
  readline.question(`comicId:`, comic_id => {
    readline.question(`话数（不填写为全部下载）:`, ep => {
      ep_no = ep
      getComicInfo(comic_id)
      readline.close()
    })
  })
})



