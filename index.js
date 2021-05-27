const jsdom = require('jsdom');
const axios = require('axios');
const fs = require('fs');

const { JSDOM } = jsdom;
const metacriticLink =
  'https://www.metacritic.com/browse/games/score/metascore/all/ps4/filtered';

async function fetchData(link) {
  const res = await axios.get(link);
  const data = await res.data;
  const dom = new JSDOM(data);
  return dom;
}

async function fetchFromPages(link, pages) {
  const calls = [];
  calls.push(await fetchData(link));
  for (let i = 1; i < pages; i++) {
    calls.push(await fetchData(`${link}?page=${i}`));
  }
  const results = await Promise.all(calls);
  return results;
}

function getNeededGamesData(doms) {
  const games = [];

  doms.forEach((dom) => {
    const titles = dom.window.document.querySelectorAll('a.title > h3');
    const dates = dom.window.document.querySelectorAll(
      'div.clamp-details > span'
    );
    const scores = dom.window.document.querySelectorAll(
      'div.clamp-metascore div.metascore_w.large.game.positive'
    );
    for (let i = 0; i < titles.length; i++) {
      games.push({
        title: titles[i].innerHTML,
        date: dates[i].innerHTML,
        score: scores[i].innerHTML,
      });
    }
  });

  return games;
}

async function main() {
  const doms = await fetchFromPages(metacriticLink, 5);
  const games = getNeededGamesData(doms);

  const stream = fs.createWriteStream('games.txt', { flags: 'a' });
  games.forEach((game, i) => {
    stream.write(`${i + 1}. ${game.title}  ${game.date}  [${game.score}]\n`);
  });

  stream.close();
}

main();
